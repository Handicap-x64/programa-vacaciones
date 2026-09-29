import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto'
import express from 'express';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';

import UsersRepository from  './database/users.js'
import TicketsRepository from './database/tickets.js';
import SurtidasRepository from './database/surtidas.js';

import { validateLogin, validateRegistro, validateUpdate, requireAuth, verifyTwoFA, validateTicket, validateTicketUpdate, validateSurtida } from './middleware/validation.js'
import { PORT, SECRET_JWT_KEY } from './config.js'
import { enviarCorreo } from './services/email.js';

const app = express();

// Repositorios (Bases de datos)
const usersRepository = new UsersRepository();
const ticketsRepository = new TicketsRepository();
const surtidasRepository = new SurtidasRepository();

const __filename = fileURLToPath(import.meta.url); // Nombre de este archivo
const __dirname = path.dirname(__filename); // Carpeta ruta de este proyecto

app.use(express.json());
app.use (express.static('public'));
app.use(cookieParser());

// Verifica el token de sesoin
app.use((req, res, next) => {
    const token = req.cookies.access_token;

    try {
        const data = jwt.verify(token, SECRET_JWT_KEY);
        req.user = data;
        // Aqui req.user tiene el valor del payload, basicamente los datos del usuario que puse en la cookie
    } catch (err) {
        
    } 
    next()
})

// VIEWS
app.get("/login" ,(req, res) => res.sendFile(path.join(__dirname, "public" , "login", "login.html")));
app.get("/2fa/", (req, res) => res.sendFile(path.join(__dirname, "public", "2fa", "2fa.html")))
app.get("/asignacion",(req, res) => res.sendFile(path.join(__dirname, "public", "asignacion_vehiculo", "asignacion_vehiculo.html")))
app.get("/surtir-estacion", requireAuth("empleado", "admin"), (req, res) => res.sendFile(path.join(__dirname, "views", "surtir_estacion", "surtir_estacion.html")))
app.get("/", requireAuth("empleado", "admin"), (req, res) => res.sendFile(path.join(__dirname, "views", "index.html")))

// Gestion de usuarios
app.get("/gestion-usuarios", requireAuth("admin"), (req, res) => res.sendFile(path.join(__dirname, "views", "gestion_usuarios", "gestion_usuarios.html")))
// el id viaja por query (?id=...) en vez de por param para que un id raro no rompa la ruta
app.get("/gestion-usuarios/crear", requireAuth("admin"), (req, res) => res.sendFile(path.join(__dirname, "views", "gestion_usuarios", "crear_usuario.html")))
app.get("/gestion-usuarios/editar", requireAuth("admin"), (req, res) => res.sendFile(path.join(__dirname, "views", "gestion_usuarios", "editar_usuario.html")))


// LOGIN
app.post("/api/login", validateLogin, async (req, res) => {
    const { _id: id, email } = req.user;

    const codigo = crypto.randomInt(100000, 1000000).toString();

    enviarCorreo(email, codigo);

    const twoFAToken = jwt.sign(
    { id: id, etapa: '2fa', codigo: codigo},
    SECRET_JWT_KEY,
    { expiresIn: '10m' }
    );

    res
    .clearCookie('tfaToken') // Elimina el token de 2fa si existe
    .clearCookie('access_token') // Elimina el token de acceso si existia
    .cookie('tfaToken', twoFAToken, {
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        maxAge: 10 * 60 * 1000
    })
    .send(codigo)

});

app.post("/api/2fa", verifyTwoFA, (req, res) => {
    if (!req.user) res.redirect('/login')
    try {
    const user = req.user;

    // Aca se activa la cuenta la primera vez que el usuario pasa el codigo.
    // Por eso el login no puede rechazar a los usuarios inactivos: si lo hiciera
    // nunca llegarian a este paso. El que los frena es justamente el 2FA.
    usersRepository.activar(user._id);

    const access_token = jwt.sign(
    { id: user._id, username: user.username, role: user.role },
        SECRET_JWT_KEY,
    { expiresIn: "1h" }
    );
    res
    .cookie('access_token', access_token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: false
    })
    .clearCookie('tfaToken')
    .send("Login exitoso")
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
})

// API
// Ojo: antes esto no pedia nada, y cualquiera con un POST podia crear un admin.
// Con la base ya sembrada no hay problema. Si alguna vez la vacias, el primer admin
// hay que crearlo a mano en database/User.json porque la API te pide sesion de admin.
app.post("/api/register", requireAuth("admin"), validateRegistro, async (req, res) => {
    const user = req.body;
    try {
        await usersRepository.create(user);
        res.status(201).json({ result: "Usuario creado exitosamente" });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
})


app.post("/api/logout", (req, res) => {
    res
    .clearCookie('access_token')
    .send('Sesion cerrada')
})

// Quien esta conectado. El frontend lo necesita para no mostrarse a si mismo
// el boton de eliminar, y el id viene en el JWT como "id", no como "_id"
app.get("/api/me", requireAuth("admin"), (req, res) => {
    res.json({ _id: req.user.id, username: req.user.username, role: req.user.role })
})

// USUARIOS
app.get("/api/users/:id",requireAuth("admin"), async (req, res) => {
    try {
        const id = req.params.id
        const users = usersRepository.get(id);
        res.json(users)
    } catch(err) {
        res.status(500).json(err);
    }
}) 

app.get("/api/users", requireAuth("admin"), async (req, res) => {
    try {
        const users = usersRepository.getAll();
        res.json(users)
    } catch(err) {
        res.status(500).json(err);
    }
}) 

app.put("/api/users/update/:id", requireAuth("admin"), validateUpdate ,async (req, res) => {
    const id = req.params.id
    // ACA ESTABA EL BUG: faltaba role en el destructuring, llegaba undefined al repository
    // y verifySchema tiraba "The value role is required" en el 100% de los casos
    const { username, nombre, apellido, ci, email, password, role } = req.body

    // Degradarte a empleado siendo el unico admin te deja sin acceso a esta pagina.
    // El borrado ya te protege de eliminarte, pero este camino era un agujero aparte.
    const objetivo = usersRepository.get(id);
    if (objetivo && id === req.user.id && objetivo.role === 'admin' && role !== 'admin' && usersRepository.contarAdmins() <= 1) {
        return res.status(400).json({ error: "No podés quitarte el rol de administrador si sos el único" });
    }

    try {
        await usersRepository.update(id, { username, nombre, apellido, ci, email, password, role });
        res.status(201).send("Usuario actualizado");
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
})

app.delete("/api/users/delete/:id", requireAuth("admin"),async (req, res) => {
    const id = req.params.id

    // El boton del frontend lo deshabilita, pero el guard va aca que es donde importa:
    // borrarte te dejaria sin acceso a esta pagina y no hay forma de recuperarlo
    if (id === req.user.id) {
        return res.status(400).json({ error: "No podés eliminar tu propio usuario" });
    }

    if (!usersRepository.get(id)) {
        return res.status(404).json({ error: "Usuario no encontrado" });
    }

    try {
        await usersRepository.delete(id);
        res.send("Usuario eliminado");
        } catch (err) {
        console.error(err);
        return res.status(500).json({ error: err.message });
    }
})

// TICKETS
app.get("/api/tickets/:id", requireAuth("admin, empleado"), async (req, res) => {
    try {
        const id = req.params.id
        const ticket = await ticketsRepository.get(id);
        res.json(ticket)
    } catch(err) {
        res.status(500).json(err);
    }
});

app.get("/api/tickets", requireAuth("admin", "empleado"), async (req, res) => {
    try {
        const tickets = await ticketsRepository.getAll();
        res.json(tickets)
    } catch(err) {
        res.status(500).json(err);
    }
})

app.post("/api/tickets/create", requireAuth("admin", "empleado"), validateTicket, async (req, res) => {
    try {
        await ticketsRepository.create(req.body);
        res.status(201).send("Ticket creado exitosamente");
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.put("/api/tickets/update/:id", requireAuth("admin", "empleado"), validateTicketUpdate, async (req, res) => {
    const id = req.params.id
    try {
        await ticketsRepository.update(id, req.body);
        res.status(201).send("Ticket actualizado");
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.delete("api/tickets/delete/:id", requireAuth("admin", "empleado"), async (req, res) => {
    const id = req.params.id
    try {
        await ticketsRepository.delete(id);
        res.send("Ticket eliminado");
        } catch (err) {
        console.error(err);
        return res.status(500).json({ error: err.message });
    }
});

// SURTIDAS
app.get("/api/surtidas/resumen", requireAuth("admin", "empleado"), async (req, res) => {
    try {
        res.json(surtidasRepository.resumen())
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/api/surtidas", requireAuth("admin", "empleado"), async (req, res) => {
    try {
        res.json(surtidasRepository.getAll())
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/api/surtidas/:id", requireAuth("admin", "empleado"), async (req, res) => {
    try {
        const surtida = await surtidasRepository.get(req.params.id);
        if (!surtida) return res.status(404).json({ error: "Surtida no encontrada" });
        res.json(surtida)
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/api/surtidas/create", requireAuth("admin", "empleado"), validateSurtida, async (req, res) => {
    try {
        await surtidasRepository.create(req.body);
        res.status(201).send("Surtida creada exitosamente");
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.put("/api/surtidas/update/:id", requireAuth("admin", "empleado"), validateSurtida, async (req, res) => {
    const id = req.params.id
    try {
        await surtidasRepository.update(id, req.body);
        res.status(201).send("Surtida actualizada exitosamente");
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.delete("/api/surtidas/delete/:id", requireAuth("admin", "empleado"), async (req, res) => {
    const id = req.params.id
    // remove() de db-local no avisa si no encontro nada, asi que chequeo antes
    if (!surtidasRepository.get(id)) {
        return res.status(404).json({ error: "Surtida no encontrada" });
    }
    try {
        await surtidasRepository.delete(id);
        res.send("Surtida eliminada");
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));