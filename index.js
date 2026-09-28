import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';

import UsersRepository from  './database/users.js'
import { validateLogin, validateRegistro, validateUpdate, requireAuth } from './middleware/validation.js'
import { PORT, SECRET_JWT_KEY } from './config.js'

const app = express();
const usersRepository = new UsersRepository();

const __filename = fileURLToPath(import.meta.url); // Nombre de este archivo
const __dirname = path.dirname(__filename); // Carpeta ruta de este proyecto

app.use(express.json());
app.use (express.static('public'));
app.use(cookieParser());

// LOGIN
app.post("/api/login", validateLogin, async (req, res) => {
    try {
    const user = req.user;

    const token = jwt.sign(
    { id: user._id, username: user.username, role: user.role },
        SECRET_JWT_KEY,
    { expiresIn: "1h" }
    );
    res
    .cookie('access_token', token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: false
    })
    .send("Login exitoso")
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Verifica el token de sesoin
app.use((req, res, next) => {
    const token = req.cookies.access_token;

    req.user = null;


    try {
        const data = jwt.verify(token, SECRET_JWT_KEY);
        req.user = data;
        // Aqui req.user tiene el valor del payload, basicamente los datos del usuario que puse en la cookie
    } catch (err) {
        
    } 
    next()
})

// VIEWS
app.get("/", (req, res) => {
    if (!req.user) res.redirect('/login') 
    res.sendFile(path.join(__dirname, "views", "index.html"))
})
app.get("/login" ,(req, res) => res.sendFile(path.join(__dirname, "public" , "login", "login.html")));
app.get("/2fa", (req, res) => res.sendFile(path.join(__dirname, "public", "2fa", "2fa.html")))


// API


app.post("/api/register", validateRegistro, async (req, res) => {
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

// 2FA
app.post("/api/login/2fa/request", (req, res) => {})
app.post("/api/login/2fa/verify", (req, res) => {})





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
    const { username, nombre, apellido, ci, email, phone, password } = req.body

    try {
        await usersRepository.update(id, { username, nombre, apellido, ci, email, phone, password });
        res.status(201).send("Usuario actualizado");
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
})

app.delete("/api/users/delete/:id", requireAuth("admin"),async (req, res) => {
    const id = req.params.id
    try {
        await usersRepository.delete(id);
        res.send("Usuario eliminado");
        } catch (err) {
        console.error(err);
        return res.status(500).json({ error: err.message });
    }
})

app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));