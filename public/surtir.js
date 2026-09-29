const API_URL_SURTIR = "/api/surtidas/create";

// El orden de estas claves tiene que calzar con los <th> de surtir_estacion.html
const COLUMNAS_SURTIDA = ["horaInicio", "horaCierre", "asigMoto", "asigAuto", "asigCamion", "totalCombustible"];

async function obtenerSurtidas() {
    const response = await fetch("/api/surtidas")
    if (!response.ok) throw new Error("Error al obtener las surtidas")

    return response.json()
}

function pintarSurtidas(surtidas) {
    const tbody = document.getElementById("surtidas-table-body");
    tbody.replaceChildren();

    if (!surtidas.length) {
        const tr = document.createElement("tr");
        tr.className = "sin-tickets";

        const td = document.createElement("td");
        td.colSpan = COLUMNAS_SURTIDA.length + 1; // +1 por la columna del ID
        td.textContent = "No hay surtidas registradas";

        tr.append(td);
        tbody.append(tr);
        return;
    }

    for (const surtida of surtidas) {
        const tr = document.createElement("tr");

        // el _id es un uuid de 36 caracteres, se muestran los primeros 8
        const tdId = document.createElement("td");
        tdId.textContent = surtida._id.slice(0, 8);
        tdId.title = surtida._id;
        tr.append(tdId);

        for (const columna of COLUMNAS_SURTIDA) {
            const td = document.createElement("td");
            td.textContent = surtida[columna] ?? "-";
            tr.append(td);
        }

        tbody.append(tr);
    }
}

async function cargarSurtidas() {
    try {
        pintarSurtidas(await obtenerSurtidas());
    } catch (error) {
        console.error(error);
    }
}

function mostrarMensaje(texto, color) {
    const mensaje = document.getElementById("surtir-mensaje");
    mensaje.textContent = texto;
    mensaje.style.color = color;
}

document.getElementById('form-surtir').addEventListener('submit', async (e) => {
    e.preventDefault();

    const form = e.target;
    const payload = {
        totalCombustible: document.getElementById('totalCombustible').value,
        horaInicio: document.getElementById('horaInicio').value,
        horaCierre: document.getElementById('horaCierre').value,
        asigMoto: document.getElementById('asigMoto').value,
        asigAuto: document.getElementById('asigAuto').value,
        asigCamion: document.getElementById('asigCamion').value
    };

    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;

    try {
        const res = await fetch(API_URL_SURTIR, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        // antes se mostraba "guardado" sin mirar la respuesta, y mientia si fallaba
        if (!res.ok) {
            const { error } = await res.json().catch(() => ({}));
            throw new Error(error ?? `Error ${res.status}`);
        }

        mostrarMensaje("Surtido guardado con éxito.", "green");
        form.reset();
        await cargarSurtidas();
    } catch (error) {
        mostrarMensaje(`No se pudo guardar el surtido: ${error.message}`, "#d64545");
    } finally {
        btn.disabled = false;
    }
});

// Primera carga al abrir la pagina
cargarSurtidas();

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
