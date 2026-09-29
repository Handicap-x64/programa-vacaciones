import crypto from 'node:crypto';
import { Schema } from "./users.js";

const Surtida = Schema('Surtida', {
    _id: { type: String, required: true },
    totalCombustible: { type: Number, required: true },
    horaInicio: { type: String, required: true },
    horaCierre: { type: String, required: true },
    asigMoto: { type: Number, required: true },
    asigAuto: { type: Number, required: true },
    asigCamion: { type: Number, required: true },
})

// db-local valida tipos estricto: un input llega como string y un campo Number
// revienta con "must be an instance of Number", asi que se convierte aca.
const aNumero = valor => Number(valor);

class SurtidasRepository {
    create({ totalCombustible, horaInicio, horaCierre, asigMoto, asigAuto, asigCamion }) {
        const _id = crypto.randomUUID();

        Surtida.create({
            _id,
            totalCombustible: aNumero(totalCombustible),
            horaInicio,
            horaCierre,
            asigMoto: aNumero(asigMoto),
            asigAuto: aNumero(asigAuto),
            asigCamion: aNumero(asigCamion)
        }).save();
    }

    update(id, { totalCombustible, horaInicio, horaCierre, asigMoto, asigAuto, asigCamion }) {
        Surtida.update({ _id: id }, {
            totalCombustible: aNumero(totalCombustible),
            horaInicio,
            horaCierre,
            asigMoto: aNumero(asigMoto),
            asigAuto: aNumero(asigAuto),
            asigCamion: aNumero(asigCamion)
        }).save()
    }

    delete(id) {
        Surtida.remove({ _id: id })
    }

    get(id) {
        return Surtida.findOne({ _id: id })
    }

    getAll() {
        return Surtida.find();
    }

    // Suma de los campos numericos de todas las surtidas, para los 4 numeros del index
    resumen() {
        const total = (campo) => this.getAll()
            .reduce((suma, surtida) => suma + (Number(surtida[campo]) || 0), 0);

        return {
            totalCombustible: total('totalCombustible'),
            asigMoto: total('asigMoto'),
            asigAuto: total('asigAuto'),
            asigCamion: total('asigCamion')
        };
    }
}

export default SurtidasRepository;
