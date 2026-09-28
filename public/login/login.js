
const loginForm = document.getElementById('form'); // Formulario de inicio de sesión

const emailInput = document.getElementById('email'); // Campo de correo electrónico o teléfono
const identifierLabel = document.querySelector('label[for="email"]'); // Label del campo de correo electrónico o teléfono
const toggleIdentifier = document.getElementById('toggle-identifier'); // Botón para cambiar entre correo electrónico y teléfono
const passwordInput = document.getElementById('password'); // Campo de contraseña
const togglePassword = document.getElementById('toggle-password'); // Botón para mostrar/ocultar la contraseña

// Boton para cambiar entre correo y teléfono
toggleIdentifier?.addEventListener('click', () => {
  const usingPhone = emailInput.type !== 'tel';

  emailInput.type = usingPhone ? 'tel' : 'email';
  emailInput.name = 'identificador';
  if (usingPhone) emailInput.setAttribute('pattern', '[0-9]+');
  else emailInput.removeAttribute('pattern');
  emailInput.autocomplete = usingPhone ? 'tel' : 'email';
  emailInput.placeholder = usingPhone ? 'Número de teléfono' : 'Correo electrónico';
  identifierLabel.textContent = usingPhone ? 'Teléfono' : 'Correo electrónico';
  toggleIdentifier.textContent = usingPhone ? 'Usar correo' : 'Usar teléfono';
  toggleIdentifier.setAttribute(
    'aria-label',
    usingPhone ? 'Cambiar a correo electrónico' : 'Cambiar a teléfono',
  );
});

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

emailInput.addEventListener('input', () => {
  if (emailInput.type === 'tel') {
    emailInput.value = emailInput.value.replace(/[^0-9]/g, '');
  }
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
    const result = await response

    if (!response.ok) {
      throw new Error(result.error ?? 'No se pudo iniciar sesión');
    }

    globalThis.location.assign('/');
  } catch (err) {
    console.error(err);
    globalThis.alert(err.message ?? 'Error al iniciar sesión');
  }   
});