const form = document.getElementById('client-login-form');
const messageEl = document.getElementById('client-login-message');

function redirectIfLoggedIn() {
  const token = localStorage.getItem('byc_client_token');
  const user = localStorage.getItem('byc_client_user');
  if (token && user) {
    window.location.href = '/client';
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  messageEl.textContent = '';

  const payload = {
    name: document.getElementById('client-name').value.trim(),
    phone: document.getElementById('client-phone').value.trim()
  };

  const response = await fetch('/api/login/client', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (!response.ok) {
    messageEl.textContent = data.error || 'Unable to log in.';
    return;
  }

  localStorage.setItem('byc_client_token', data.token);
  localStorage.setItem('byc_client_user', JSON.stringify(data.user));
  window.location.href = '/client';
});

redirectIfLoggedIn();
