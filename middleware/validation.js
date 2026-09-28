import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import zod, { email } from "zod";

import {User} from "../database/users.js";

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
    phone: zod
        .string({ message: "El teléfono debe ser una cadena de texto" })
        .min(6, { message: "El nuemoro de telefono debe tener minimo 8 digitos"})
        .max(10, { message: "El numero de telefono debe tener maximo 10 digitos" })
        .regex(/^[0-9]+$/, { message: "El teléfono debe ser un número" }),
    password: zod
        .string({ message: "El password debe ser una cadena de texto" })
        .min(8, { message: "El password debe tener al menos 8 caracteres" })
        .regex(/[A-Z]/, { message: "El password debe tener al menos una letra mayúscula" })
        .regex(/[0-9]/, { message: "El password debe tener al menos un número" })
        .regex(/[!@#$%^&*(),.?":{}|<>]/, { message: "El password debe tener al menos un caracter especial" }),
    role: zod.enum(['admin', 'empleado'], { message: "Rol invalido" })
});


async function validateLogin(req, res, next) {
    const { identificador, password } = req.body; 

    if (typeof identificador !== "string" || typeof password !== "string") {
        return res.status(400).json({ error: "Identificador y contraseña son obligatorios" });
    }

    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identificador);

    const user = await isEmail ? User.findOne({email: identificador}) : User.findOne({phone: identificador});
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
    const result = await userSchema.safeParseAsync(req.body);
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

export { validateRegistro, validateLogin, validateUpdate, requireAuth }
   
