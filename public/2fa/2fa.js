const tfaForm = document.getElementById("twofa-form");

tfaForm.addEventListener("submit", async e => {
    e.preventDefault();

    const data = Object.fromEntries(new FormData(tfaForm));

    try {
        const response = await fetch("/api/2fa", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({codigo: data.codigo}),
        });

        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(result.error ?? 'No se pudo verificar el código');
        }

        globalThis.location.assign("/");
    } catch (err) {
        console.error(err);
        globalThis.alert(err.message ?? 'Error al verificar el código');
    }
})

const inputCode = document.getElementById("codigo");
inputCode.addEventListener("input", e => {
    e.target.value = e.target.value.replace(/[^0-9]/g, '');
})
