// Este script controla el login con usuario administrador.
document.addEventListener('DOMContentLoaded', () => {
  const ADMIN_USER = {
    username: 'admin',
    password: 'admin123',
  };

  const loginForm = document.getElementById('form');

  if (loginForm) {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const togglePassword = document.getElementById('toggle-password');

    togglePassword?.addEventListener('click', () => {
      const showingPassword = passwordInput.type === 'text';

      passwordInput.type = showingPassword ? 'password' : 'text';
      togglePassword.textContent = showingPassword ? 'Mostrar' : 'Ocultar';
      togglePassword.setAttribute(
        'aria-label',
        showingPassword ? 'Mostrar contraseña' : 'Ocultar contraseña',
      );
    });

    loginForm.addEventListener('submit', (event) => {
      event.preventDefault();

      const enteredUser = (emailInput ? emailInput.value : '').trim().toLowerCase();
      const enteredPassword = (passwordInput ? passwordInput.value : '').trim();

      if (
        (enteredUser === ADMIN_USER.username || enteredUser === 'admin@orichuna.com') &&
        enteredPassword === ADMIN_USER.password
      ) {
        alert('Bienvenido administrador');
        return;
      }

      alert('Credenciales incorrectas. Usuario admin: admin / Contraseña: admin123');
    });
  }
});
