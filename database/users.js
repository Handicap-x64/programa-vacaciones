import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import DBLocal from 'db-local';

import { SALT_ROUNDS } from '../config.js';

const { Schema } = new DBLocal({ path: './database/' });
export const User = Schema('User', {
    _id: { type: String, required: true },
    username: { type: String, required: true },
    nombre: { type: String, required: true },
    apellido: { type: String, required: true },
    ci: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true  },
    role: { type: String, required: true },
    // OJO: db-local NO aplica los defaults al leer, solo al crear o al actualizar.
    // Un usuario guardado antes de que existiera este campo devuelve activo: undefined,
    // por eso el codigo tiene que comparar con  user.activo === false  y no con  !user.activo
    activo: { type: Boolean, default: true }
})

class UsersRepository {
    async create({ username, nombre, apellido, ci, email, password, role }) {
        const id = crypto.randomUUID();
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

        // toda cuenta arranca sin verificar, se activa sola al pasar el 2FA.
        // activo no se acepta desde el body, asi nadie se salta la verificacion por correo
        User.create({ _id: id, username, nombre, apellido, ci, email, password: passwordHash, role, activo: false }).save();
    }

    // Ojo: este update reescribe los 6 campos de abajo mas el password.
    // activo no se toca, asi que editar un usuario no lo desactiva.
    async update(id, { username, nombre, apellido, ci, email, password, role }) {
        const user = User.findOne({ _id: id });
        if (!user) throw new Error("Usuario no encontrado");

        // password vacio significa "no la cambies": se conserva el hash que ya tenia
        const passwordHash = password ? await bcrypt.hash(password, SALT_ROUNDS) : user.password;

        User.update({ _id: id }, {
        username: username,
        nombre: nombre,
        apellido: apellido,
        ci: ci,
        email: email,
        password: passwordHash,
        role: role
        }).save()
    }

    // Se llama desde /api/2fa la primera vez que el usuario pasa el codigo
    activar(id) {
        // concat() arranca de una copia del documento, asi que el resto de los campos sobrevive
        User.update({ _id: id }, { activo: true }).save()
    }

    delete(id) {
        User.remove({_id: id})
    }
    get(id) {
        return User.findOne({_id: id})
    }
    getAll() {
        return User.find();
    }
    // Para el bloqueo de borrarse a si mismo: si es el unico admin, no puede quedarse sin acceso
    contarAdmins() {
        return User.find().filter(user => user.role === 'admin').length;
    }
}

export default UsersRepository;
export { Schema }