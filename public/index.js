
// El orden de estas claves tiene que calzar con los <th> de views/index.html
const COLUMNAS = ["_id", "tipo", "marca", "modelo", "placa", "color", "cantidadCombustible", "estado", "codigoVerificacion"];

// Los 4 numeros grandes. Cada id del HTML mapea a un campo del resumen.
const RESUMEN = [
    { id: "stat-total", campo: "totalCombustible" },
    { id: "stat-moto", campo: "asigMoto" },
    { id: "stat-auto", campo: "asigAuto" },
    { id: "stat-camion", campo: "asigCamion" }
];

async function obtenerTickets() {
    const tickets = await fetch("/api/tickets")
    if (!tickets.ok) throw new Error("Error al obtener los tickets");

    return tickets.json()
}

async function obtenerResumen() {
    const response = await fetch("/api/surtidas/resumen")
    if (!response.ok) throw new Error("Error al obtener el resumen de surtidas");

    return response.json()
}

function pintarResumen(resumen) {
    for (const { id, campo } of RESUMEN) {
        document.getElementById(id).textContent = resumen[campo] ?? 0;
    }
}

async function actualizarTicket(id, cambios) {
    const response = await fetch(`/api/tickets/update/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cambios)
    });

    if (!response.ok) {
        const { error } = await response.json().catch(() => ({}));
        throw new Error(error ?? `Error ${response.status}`);
    }
}

async function cancelarTicket(ticket, boton) {
    if (!confirm(`¿Cancelar el ticket ${ticket._id} (${ticket.placa})?`)) return;

    boton.disabled = true;

    try {
        // hay que mandar los 7 campos: update() los reescribe y el schema los exige
        await actualizarTicket(ticket._id, { ...ticket, estado: "Cancelado" });
        await cargarTickets();
    } catch (error) {
        boton.disabled = false;
        alert(error.message);
    }
}

function crearAcciones(ticket) {
    const td = document.createElement("td");
    td.className = "acciones";

    if (ticket.estado === "Cancelado") {
        td.textContent = "—";
        return td;
    }

    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "cancelar-btn";
    boton.textContent = "Cancelar";
    boton.addEventListener("click", () => cancelarTicket(ticket, boton));
    td.append(boton);

    return td;
}

function pintarTickets(tickets) {
    const tbody = document.getElementById("tickets-table-body");
    tbody.replaceChildren();

    if (!tickets.length) {
        const tr = document.createElement("tr");
        tr.className = "sin-tickets";

        const td = document.createElement("td");
        td.colSpan = COLUMNAS.length + 1; // +1 por la columna de acciones
        td.textContent = "No hay tickets registrados";

        tr.append(td);
        tbody.append(tr);
        return;
    }

    for (const ticket of tickets) {
        const tr = document.createElement("tr");

        for (const columna of COLUMNAS) {
            const td = document.createElement("td");
            td.textContent = ticket[columna] ?? "-";
            tr.append(td);
        }

        tr.append(crearAcciones(ticket));

        tbody.append(tr);
    }
}

async function cargarTickets() {
    try {
        pintarTickets(await obtenerTickets());
    } catch (error) {
        console.error(error);
    }

    try {
        pintarResumen(await obtenerResumen());
    } catch (error) {
        console.error(error);
    }
}





// Primera carga al abrir la pagina
cargarTickets();

// LOGOUT
document.getElementById("logout").addEventListener("click", async e => {
    e.preventDefault();

    if (!confirm("¿Seguro que quieres cerrar la sesion?")) return

    const response = await fetch("/api/logout", {
        method: "POST"
    })
    if (!response) console.error("Error al iniciar sesion");
    globalThis.location.assign("/login");
})