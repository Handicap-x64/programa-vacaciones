const API_URL_ASIGNACION = "/api/tickets/create"; //has tu magia francisco

//clases y herencia
class Vehiculo {
    constructor(tipo, marca, modelo, placa, color) {
        Object.assign(this, { tipo, marca, modelo, placa, color });
    }
}

class Ticket {
    constructor() {
        document.getElementById('ticket-container').style.display = 'block';
        document.getElementById('t-fecha').textContent = new Date().toLocaleString();
    }
    
    pintarHTML(turno, vehiculo, estatus, codigo) {
        document.getElementById('t-turno').textContent = turno;
        document.getElementById('t-vehiculo').textContent = vehiculo;
        document.getElementById('t-estatus').innerHTML = estatus;
        document.getElementById('t-codigo').textContent = codigo;
    }

    generar() {} //polimorfismo
}

class TicketExito extends Ticket {
    constructor(vehiculo, litros) {
        super();
        this.vehiculo = vehiculo;
        this.litros = litros;
    }
    
    generar() {
        const turno = Math.floor(Math.random() * 20) + 1;
        const det = `Placa: ${this.vehiculo.placa} | Modelo: ${this.vehiculo.modelo} | Color: ${this.vehiculo.color}`;
        const est = `<strong style="color:green">Aceptado</strong> <br> <small>${this.vehiculo.tipo.toUpperCase()} - ${this.litros} Lts</small>`;
        const cod = Math.floor(100 + Math.random() * 900);
        this.pintarHTML(`Turno: ${turno}`, det, est, cod);
    }
}

class TicketError extends Ticket {
    constructor(motivo) {
        super();
        this.motivo = motivo;
    }
    
    generar() {
        this.pintarHTML("N/A", "N/A", `<strong style="color:red;">Cancelado: ${this.motivo}</strong>`, "N/A");
    }
}

//temporizador
let tiempoRestante = 180; 
let timerInterval;
let tiempoAgotado = false;

function iniciarTemporizador() {
    timerInterval = setInterval(() => {
        tiempoRestante--;
        const minutos = Math.floor(tiempoRestante / 60).toString().padStart(2, '0');
        const segundos = (tiempoRestante % 60).toString().padStart(2, '0');
        document.getElementById('tiempo').textContent = `${minutos}:${segundos}`;

        if (tiempoRestante <= 0) {
            clearInterval(timerInterval);
            tiempoAgotado = true;
            document.getElementById('btn-procesar').disabled = true;
            document.getElementById('form-asignacion').reset();

            // alert es bloqueante: la redireccion solo pasa cuando le dan OK
            alert("tiempo agotado");
            globalThis.location.assign("/");
        }
    }, 1000);
}

iniciarTemporizador();

//enviar
document.getElementById('form-asignacion').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (tiempoAgotado) return;

    clearInterval(timerInterval);

    const miVehiculo = new Vehiculo(
        document.getElementById('tipoVehiculo').value,
        document.getElementById('marca').value,
        document.getElementById('modelo').value,
        document.getElementById('placa').value,
        document.getElementById('color').value
    );

    const cantidadCombustible = document.getElementById('cantidadCombustible').value;

    const btn = document.getElementById('btn-procesar');
    btn.disabled = true;

    try {
        const response = await fetch(API_URL_ASIGNACION, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ ...miVehiculo, estado: "Aceptado", cantidadCombustible }) 
        });

        if (!response.ok) {
            // el 400 del repo manda {error}, y el 500 manda {} porque json() de un Error da {}
            const { error } = await response.json().catch(() => ({}));
            throw new Error(error ?? `Error ${response.status}`);
        }

        // se muestran los litros reales que se mandaron, no un valor fijo
        new TicketExito(miVehiculo, Number(cantidadCombustible)).generar();
    } catch (error) {
        btn.disabled = false; // si fallo, que pueda reintentar
        new TicketError(error.message).generar();
    }
});

// LOGOUT
document.getElementById("logout").addEventListener("click", async e => {
    e.preventDefault();

    if (!confirm("¿Seguro que quieres cerrar la sesion?")) return

    await fetch("/api/logout", { method: "POST" });
    globalThis.location.assign("/login");
})