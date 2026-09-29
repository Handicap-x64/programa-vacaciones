document.getElementById('form-surtir').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        totalCombustible: document.getElementById('totalCombustible').value,
        horaInicio: document.getElementById('horaInicio').value,
        horaCierre: document.getElementById('horaCierre').value,
        asigMoto: document.getElementById('asigMoto').value,
        asigAuto: document.getElementById('asigAuto').value,
        asigCamion: document.getElementById('asigCamion').value
    };

    try {
        const res = await fetch(API_URL_SURTIR, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        alert("Surtido guardado con éxito.");
    } catch (error) {
        alert("Error de conexión al guardar surtido.");
    }
});