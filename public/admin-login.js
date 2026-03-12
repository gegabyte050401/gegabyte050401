const form = document.getElementById('admin-login-form');
const messageEl = document.getElementById('admin-login-message');

function redirectIfLoggedIn() {
  const token = localStorage.getItem('byc_admin_token');
  if (token) {
    window.location.href = '/admin';
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  messageEl.textContent = '';

  const payload = {
    username: document.getElementById('admin-username').value.trim(),
    password: document.getElementById('admin-password').value.trim()
  };

  const response = await fetch('/api/login/admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (!response.ok) {
    messageEl.textContent = data.error || 'Unable to log in.';
    return;
  }

  localStorage.setItem('byc_admin_token', data.token);
  window.location.href = '/admin';
});

redirectIfLoggedIn();
