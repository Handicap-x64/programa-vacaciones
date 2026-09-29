const API_URL_CREAR = "/api/register";

function mostrarMensaje(texto, color) {
    const mensaje = document.getElementById("mensaje");
    mensaje.textContent = texto;
    mensaje.style.color = color;
}

// El backend puede mandar { error } o, cuando falla el zod, { errores: [issues] }
function leerError(datos, response) {
    if (datos?.error) return datos.error;
    if (datos?.errores?.length) return datos.errores[0].message;
    return `Error ${response.status}`;
}

document.getElementById('form-usuario').addEventListener('submit', async (e) => {
    e.preventDefault();

    const form = e.target;
    const payload = {
        username: document.getElementById('username').value.trim(),
        nombre: document.getElementById('nombre').value.trim(),
        apellido: document.getElementById('apellido').value.trim(),
        ci: document.getElementById('ci').value.trim(),
        email: document.getElementById('email').value.trim(),
        password: document.getElementById('password').value,
        role: document.getElementById('role').value
    };

    const btn = document.getElementById('btn-guardar');
    btn.disabled = true;

    try {
        const response = await fetch(API_URL_CREAR, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const datos = await response.json().catch(() => ({}));
            throw new Error(leerError(datos, response));
        }

        mostrarMensaje(
            `Usuario creado. Cuando entre con su email y contraseña se le manda el código para activarlo.`,
            "green"
        );
        form.reset();
    } catch (error) {
        mostrarMensaje(error.message, "#d64545");
    } finally {
        btn.disabled = false;
    }
});

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
