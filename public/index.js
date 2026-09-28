const logoutBtn = document.getElementById("logout");

logoutBtn?.addEventListener("click", async  e => {
    const response = await fetch('/api/logout', {
        method: 'POST',
        credentials: "include", // manda la cookie actual, necesario para que el server sepa cuál borrar
    });
    if (response.ok) globalThis.location.assign('/login')
})