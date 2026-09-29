import { Schema } from "./users.js";

const Tickets = Schema('Ticket', {
    _id: {type: String, required: true},
    tipo: {type: String, required: true},
    marca: {type: String, required: true},
    modelo: {type: String, required: true},
    placa: {type: String, required: true},
    color: {type: String, required: true},
    estado: {type: String, required: true},
    codigoVerificacion: {type: String, required: true},
    cantidadCombustible: {type: Number, required: true},
})

class TicketsRepository {
    create({ tipo, marca, modelo, placa, color, estado, cantidadCombustible }) {

        const _id = String(Math.floor(Math.random() * 20) + 1) ; // Genera un ID aleatorio entre 1 y 20
        const codigoVerificacion = String(Math.floor(Math.random() * 1000)) // Genera un codigo aleatoreo de 3 digitos

        // db-local rechaza strings en campos Number, el form los manda como texto
        Tickets.create({ _id, tipo, marca, modelo, placa, color, estado, codigoVerificacion, cantidadCombustible: Number(cantidadCombustible) }).save();
    }

    // Ojo: este update reescribe los 7 campos de abajo. El cliente tiene que mandarlos
    // todos, por eso el boton de cancelar reenvia el ticket entero con el estado cambiado.
    // codigoVerificacion y _id no se tocan: concat() arranca de una copia del doc.
    update(id, { tipo, marca, modelo, placa, color, estado, cantidadCombustible }) {
        Tickets.update({ _id: id }, {
            tipo: tipo,
            marca: marca,
            modelo: modelo,
            placa: placa,
            color: color,
            estado: estado,
            cantidadCombustible: Number(cantidadCombustible)
        }).save()
    }

    delete(id) {
        Tickets.remove({_id: id})
    }

    get(id) {
        return Tickets.findOne({_id: id})
    }

    getAll() {
        return Tickets.find();
    }
}

export default TicketsRepository;