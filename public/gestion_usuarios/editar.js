function mostrarMensaje(texto, color) {
    const mensaje = document.getElementById("mensaje");
    mensaje.textContent = texto;
    mensaje.style.color = color;
}

function leerError(datos, response) {
    if (datos?.error) return datos.error;
    if (datos?.errores?.length) return datos.errores[0].message;
    return `Error ${response.status}`;
}

const CAMPOS = ["username", "nombre", "apellido", "ci", "email", "role"];

const idUsuario = new URLSearchParams(globalThis.location.search).get("id");

async function cargarUsuario() {
    if (!idUsuario) {
        mostrarMensaje("No se indicó qué usuario editar.", "#d64545");
        return;
    }

    try {
        const response = await fetch(`/api/users/${encodeURIComponent(idUsuario)}`);

        if (!response.ok) {
            const datos = await response.json().catch(() => ({}));
            throw new Error(leerError(datos, response));
        }

        const usuario = await response.json();

        if (!usuario) {
            mostrarMensaje("Ese usuario no existe.", "#d64545");
            return;
        }

        for (const campo of CAMPOS) {
            document.getElementById(campo).value = usuario[campo] ?? "";
        }

        // El password se deja vacío a propósito: el hash de bcrypt nunca va en un input.
        // Vacío le dice al backend "no la cambies", y ahí conserva la que ya tenía.
        document.getElementById('password').value = "";

        document.getElementById("subtitulo").textContent =
            `${usuario.nombre} ${usuario.apellido} (${usuario.username})`;

        await revisarRol(usuario);
    } catch (error) {
        mostrarMensaje(`No se pudo cargar el usuario: ${error.message}`, "#d64545");
    }
}

// Si te estas editando a vos y sos el unico admin, el select de rol se apaga:
// degradarte a empleado te dejaria sin acceso a esta pagina. El backend lo rechaza igual.
async function revisarRol(usuario) {
    try {
        const [yo, usuarios] = await Promise.all([
            fetch("/api/me").then(r => r.json()),
            fetch("/api/users").then(r => r.json())
        ]);

        if (yo._id !== usuario._id) return;

        const admins = usuarios.filter(u => u.role === "admin" && u.activo !== false);
        if (admins.length > 1) return;

        const select = document.getElementById("role");
        select.value = "admin";
        select.disabled = true;

        const aviso = document.createElement("small");
        aviso.className = "ayuda";
        aviso.textContent = "Sos el único administrador, por eso el rol no se puede cambiar acá.";
        select.parentElement.appendChild(aviso);
    } catch (error) {
        // si no se puede consultar, el backend sigue siendo el que bloquea
        console.error(error);
    }
}

document.getElementById('form-usuario').addEventListener('submit', async (e) => {
    e.preventDefault();

    const btn = document.getElementById('btn-guardar');
    const payload = {
        username: document.getElementById('username').value.trim(),
        nombre: document.getElementById('nombre').value.trim(),
        apellido: document.getElementById('apellido').value.trim(),
        ci: document.getElementById('ci').value.trim(),
        email: document.getElementById('email').value.trim(),
        password: document.getElementById('password').value,
        role: document.getElementById('role').value
    };

    btn.disabled = true;

    try {
        const response = await fetch(`/api/users/update/${encodeURIComponent(idUsuario)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const datos = await response.json().catch(() => ({}));
            throw new Error(leerError(datos, response));
        }

        mostrarMensaje("Usuario actualizado.", "green");
        document.getElementById('password').value = "";
    } catch (error) {
        mostrarMensaje(error.message, "#d64545");
    } finally {
        btn.disabled = false;
    }
});

// Llena los campos apenas abre la pagina
cargarUsuario();

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
