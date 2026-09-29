
const loginForm = document.getElementById('form'); // Formulario de inicio de sesión

const passwordInput = document.getElementById('password'); // Campo de contraseña
const togglePassword = document.getElementById('toggle-password'); // Botón para mostrar/ocultar la contraseña


// Boton para mostrar/ocultar la contraseña
togglePassword?.addEventListener('click', () => {
  const showingPassword = passwordInput.type === 'text';

  passwordInput.type = showingPassword ? 'password' : 'text';
  togglePassword.textContent = showingPassword ? 'Mostrar' : 'Ocultar';
  togglePassword.setAttribute(
    'aria-label',
    showingPassword ? 'Mostrar contraseña' : 'Ocultar contraseña',
  );
});

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const formData = Object.fromEntries(new FormData(loginForm));

  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.error ?? 'No se pudo iniciar sesión');
    }

    globalThis.location.assign('/2fa');
  } catch (err) {
    console.error(err);
    globalThis.alert(err.message ?? 'Error al iniciar sesión');
  }
});