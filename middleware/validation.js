import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import zod, { email } from "zod";

import {User} from "../database/users.js";
import TicketsRepository from "../database/tickets.js";
import { SECRET_JWT_KEY } from "../config.js";

const userSchema = zod.object({   
    username: zod
        .string({ message: "El nombre de usuario debe ser una cadena" })
        .min(3, { message: "El nombre de usuario debe tener minimo 3 caracteres" })
        .max(20, { message: "El usuario solo puede tener maximo 20 caracteres" })
        .regex(/^[a-zA-Z0-9_]+$/, "El nombre de usuario solo puede tener letras, barras bajas y numeros "),
    nombre: zod
        .string({ message: "El nombre debe ser una cadena de texo" })
        .max(20, { message: "El nombre debe ser de maximo 20 caracteres" })
        .regex(/^[a-zA-Z\s]+$/, { message: "El nombre no puede tener caracteres especiales" }),
    apellido: zod
        .string({ message: "El apellido debe ser una cadena de texo" })
        .max(20, { message: "El apellido debe ser de maximo 20 caracteres" })
        .regex(/^[a-zA-Z\s]+$/, { message: "El apellido no puede tener caracteres especiales" }),
    ci: zod
        .string({ message: "El ci debe ser una cadena de texto" })
        .regex(/^[0-9]+$/, { message: "La cedula solo puede contener números" }),
    email: zod
        .email({ message: "El email no es válido" }),
    password: zod
        .string({ message: "El password debe ser una cadena de texto" })
        .min(8, { message: "El password debe tener al menos 8 caracteres" })
        .regex(/[A-Z]/, { message: "El password debe tener al menos una letra mayúscula" })
        .regex(/[0-9]/, { message: "El password debe tener al menos un número" })
        .regex(/[!@#$%^&*(),.?":{}|<>]/, { message: "El password debe tener al menos un caracter especial" }),
    role: zod.enum(['admin', 'empleado'], { message: "Rol invalido" })
});

// En la edicion la contraseña puede venir vacía: significa "no la cambies".
// El preprocess convierte "" / null / undefined en ausente para que el .optional() lo deje pasar,
// y cualquier valor que sí venga se valida con las mismas reglas del registro.
const userUpdateSchema = userSchema.extend({
    password: zod.preprocess(
        valor => (valor === "" || valor === null || valor === undefined) ? undefined : valor,
        zod
            .string({ message: "El password debe ser una cadena de texto" })
            .min(8, { message: "El password debe tener al menos 8 caracteres" })
            .regex(/[A-Z]/, { message: "El password debe tener al menos una letra mayúscula" })
            .regex(/[0-9]/, { message: "El password debe tener al menos un número" })
            .regex(/[!@#$%^&*(),.?":{}|<>]/, { message: "El password debe tener al menos un caracter especial" })
            .optional()
    )
});

// El _id y el codigoVerificacion los genera el repository en el servidor,
// asi que el cliente no los manda al crear.
const ticketSchema = zod.object({
    tipo: zod.enum(['moto', 'automovil', 'camion'], { message: "Tipo de vehiculo invalido" }),
    marca: zod.string({ message: "La marca debe ser una cadena de texto" }).min(1, { message: "La marca es obligatoria" }),
    modelo: zod.string({ message: "El modelo debe ser una cadena de texto" }).min(1, { message: "El modelo es obligatorio" }),
    placa: zod.string({ message: "La placa debe ser una cadena de texto" }).min(1, { message: "La placa es obligatoria" }),
    color: zod.string({ message: "El color debe ser una cadena de texto" }).min(1, { message: "El color es obligatorio" }),
    estado: zod.string({ message: "El estado debe ser una cadena de texto" }).min(1, { message: "El estado es obligatorio" }),
    cantidadCombustible: zod.coerce
    .number({ message: "La cantidad de combustible debe ser un numero" })
    .min(0, { message: "La cantidad de combustible no puede ser negativa" })
    .max(10000, { message: "La cantidad de combustible es demasiado alta" })
});

// _id y codigoVerificacion se permiten para que el PUT del boton de cancelar
// pueda reenviar el ticket tal cual vino del GET.
const ticketUpdateSchema = ticketSchema.extend({
    _id: zod.string().optional(),
    codigoVerificacion: zod.string().optional()
});

const surtidaSchema = zod.object({
    totalCombustible: zod.coerce
    .number({ message: "El combustible total debe ser un numero" })
    .min(0, { message: "El combustible total no puede ser negativo" })
    .max(100000, { message: "El combustible total es demasiado alto" }),
    horaInicio: zod.string().regex(/^\d{2}:\d{2}$/, { message: "La hora de inicio debe tener formato HH:MM" }),
    horaCierre: zod.string().regex(/^\d{2}:\d{2}$/, { message: "La hora de cierre debe tener formato HH:MM" }),
    asigMoto: zod.coerce
    .number({ message: "La asignacion de moto debe ser un numero" })
    .min(0, { message: "La asignacion de moto no puede ser negativa" }),
    asigAuto: zod.coerce
    .number({ message: "La asignacion de auto debe ser un numero" })
    .min(0, { message: "La asignacion de auto no puede ser negativa" }),
    asigCamion: zod.coerce
    .number({ message: "La asignacion de camion debe ser un numero" })
    .min(0, { message: "La asignacion de camion no puede ser negativa" })
});

function validar(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ errores: result.error.issues });
        req.body = result.data;
        next();
    };
}

const validateTicket = validar(ticketSchema);
const validateTicketUpdate = validar(ticketUpdateSchema);
const validateSurtida = validar(surtidaSchema);



async function validateLogin(req, res, next) {
    const { email, password } = req.body; 

    if (typeof email !== "string" || typeof password !== "string") {
        return res.status(400).json({ error: "Email y contraseña son obligatorios" });
    }

    const user = User.findOne({email})
    if (!user) return res.status(401).json({ error: "Usuario no encontrado" });

    const passwordValido = await bcrypt.compare(password, user.password);
    if (!passwordValido) return res.status(401).json({ error: "Contraseña incorrecta" });

    req.user = user;
    next();
}

async function validateRegistro(req, res, next) {
    const user = req.body;
    const ci = user.ci
    const username = user.username


    const result = await userSchema.safeParseAsync(user);

    if (!result.success) return res.status(400).json({ errores: result.error.issues });
    if (User.findOne({username})) return res.status(400).json({ error: "Existe otro usuario con el mismo nombre de usurio" });
    if (User.findOne({ci})) return res.status(400).json({ error: "Existe otro usuario con la misma cedula" })
    
        req.body = result.data;
    next();
}

async function validateUpdate(req, res, next) {
    const result = await userUpdateSchema.safeParseAsync(req.body);
    if (!result.success) return res.status(400).json({ errores: result.error.issues });

    const userId = req.params.id;

    const ciOwner = User.findOne({ ci: result.data.ci });
    if (ciOwner && ciOwner._id !== userId) {
        return res.status(400).json({
            error: "Existe otro usuario con la misma cédula"
        });
    }

    const usernameOwner = User.findOne({ username: result.data.username });
    if (usernameOwner && usernameOwner._id !== userId) {
        return res.status(400).json({
            error: "Existe otro usuario con el mismo nombre de usuario"
        });
    }
    next();
}

function requireAuth(...roles) {
  return (req, res, next) => {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'No autenticado' });
    if (!roles.includes(user.role)) return res.status(403).json({ error: 'No autorizado' });
    next();
  };
}

function verifyTwoFA(req, res, next) {
    const tfa = req.cookies.tfaToken;
    let payload;
    try {
        payload = jwt.verify(tfa, SECRET_JWT_KEY);
    } catch {
        return res.status(401).json({ error: 'Token inválido o expirado' });
    }
    if (payload.etapa !== '2fa') return res.status(401).json({ error: 'Token no válido para este paso' });
    if (payload.codigo !== req.body.codigo) return res.status(401).json({ error: "El codigo de verificacion no es valido" })

        const user = User.findOne({ _id: payload.id });
        if (!user) return res.status(401).json({ error: 'Usuario no encontrado' });

    req.user = {
            _id: user._id,
            username: user.username,
            role: user.role
    };

    next();
}


export {
    validateRegistro, validateLogin, validateUpdate, requireAuth, verifyTwoFA,
    validateTicket, validateTicketUpdate, validateSurtida
}
   
