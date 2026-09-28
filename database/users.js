import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import DBLocal from 'db-local';

import { SALT_ROUNDS } from '../config.js';
import { required } from 'zod/mini';

const { Schema } = new DBLocal({ path: './database/' });
export const User = Schema('User', {
    _id: { type: String, required: true },
    username: { type: String, required: true },
    nombre: { type: String, required: true },
    apellido: { type: String, required: true },
    ci: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    password: { type: String, required: true  },
    role: { type: String, required: true }
})

class UsersRepository {
    async create({ username, nombre, apellido, ci, email, phone, password, role }) {
        const id = crypto.randomUUID();
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

        User.create({ _id: id, username, nombre, apellido, ci, email, phone, password: passwordHash, role }).save();
    }

    update(id, { username, nombre, apellido, ci, email, phone, password, role }) {
        User.update({ _id: id }, {
        username: username,
        nombre: nombre,
        apellido: apellido,
        ci: ci,
        email: email,
        phone: phone,
        password: password,
        role: role
        }).save()
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
}

export default UsersRepository;