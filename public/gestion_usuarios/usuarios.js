// El orden de estas claves tiene que calzar con los <th> de gestion_usuarios.html.
// OJO: password queda fuera a proposito, GET /api/users si lo manda y no va en la tabla
const COLUMNAS = ["_id", "username", "nombre", "apellido", "ci", "email", "role"];

async function obtenerUsuarios() {
    const response = await fetch("/api/users")
    if (!response.ok) throw new Error("Error al obtener los usuarios")

    return response.json()
}

async function obtenerYo() {
    const response = await fetch("/api/me")
    if (!response.ok) throw new Error("Error al obtener la sesión")

    return response.json()
}

async function eliminarUsuario(usuario, boton) {
    if (!confirm(`¿Eliminar a ${usuario.username} (${usuario.nombre} ${usuario.apellido})?`)) return;

    boton.disabled = true;

    try {
        const response = await fetch(`/api/users/delete/${usuario._id}`, { method: "DELETE" });

        if (!response.ok) {
            const { error } = await response.json().catch(() => ({}));
            throw new Error(error ?? `Error ${response.status}`);
        }

        await cargarUsuarios();
    } catch (error) {
        boton.disabled = false;
        alert(error.message);
    }
}

function crearAcciones(usuario, yo) {
    const td = document.createElement("td");
    td.className = "acciones";

    // Editar va a otra pagina, con los campos ya llenos
    const editar = document.createElement("a");
    editar.className = "editar-btn";
    editar.href = `/gestion-usuarios/editar?id=${encodeURIComponent(usuario._id)}`;
    editar.textContent = "Editar";
    td.append(editar);

    // Borrarse a si mismo dejaria el sistema sin admins. El backend lo rechaza igual,
    // esto es solo para que el boton se vea apagado y no invite a intentarlo
    const eliminar = document.createElement("button");
    eliminar.type = "button";
    eliminar.className = "eliminar-btn";
    eliminar.textContent = "Eliminar";

    if (usuario._id === yo._id) {
        eliminar.disabled = true;
        eliminar.title = "No podés eliminar tu propio usuario";
    } else {
        eliminar.addEventListener("click", () => eliminarUsuario(usuario, eliminar));
    }

    td.append(eliminar);
    return td;
}

function pintarEstado(activo) {
    const td = document.createElement("td");
    const badge = document.createElement("span");

    // activo === false y no !activo: los usuarios viejos no tienen el campo y dan undefined
    if (activo === false) {
        badge.className = "badge badge-inactivo";
        badge.textContent = "Sin activar";
    } else {
        badge.className = "badge badge-activo";
        badge.textContent = "Activo";
    }

    td.append(badge);
    return td;
}

function pintarUsuarios(usuarios, yo) {
    const tbody = document.getElementById("usuarios-table-body");
    tbody.replaceChildren();

    if (!usuarios.length) {
        const tr = document.createElement("tr");
        tr.className = "sin-tickets";

        const td = document.createElement("td");
        td.colSpan = COLUMNAS.length + 2; // +1 por el estado y +1 por las acciones
        td.textContent = "No hay usuarios registrados";

        tr.append(td);
        tbody.append(tr);
        return;
    }

    for (const usuario of usuarios) {
        const tr = document.createElement("tr");

        for (const columna of COLUMNAS) {
            const td = document.createElement("td");
            // el _id es un uuid largo, se muestran los primeros 8
            if (columna === "_id") {
                td.textContent = String(usuario._id).slice(0, 8);
                td.title = usuario._id;
            } else {
                td.textContent = usuario[columna] ?? "-";
            }
            tr.append(td);
        }

        tr.append(pintarEstado(usuario.activo));
        tr.append(crearAcciones(usuario, yo));

        tbody.append(tr);
    }
}

async function cargarUsuarios() {
    let yo;

    try {
        yo = await obtenerYo();
    } catch (error) {
        console.error(error);
        return;
    }

    try {
        pintarUsuarios(await obtenerUsuarios(), yo);
    } catch (error) {
        console.error(error);
    }
}

// Primera carga al abrir la pagina
cargarUsuarios();

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
