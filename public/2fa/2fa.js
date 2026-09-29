const tfaForm = document.getElementById("twofa-form");

tfaForm.addEventListener("submit", async e => {
    e.preventDefault();

    const data = Object.fromEntries(new FormData(tfaForm));

    try {
        await fetch("/api/2fa", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({codigo: data.codigo}),
        })
    } catch (err) {
        console.error(err);
    }

    globalThis.location.assign("/")
})

const inputCode = document.getElementById("codigo");
inputCode.addEventListener("input", e => {
    e.target.value = e.target.value.replace(/[^0-9]/g, '');
})
