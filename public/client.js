const accountEl = document.getElementById('client-account');
const logoutButton = document.getElementById('client-logout');
const ordersEl = document.getElementById('client-orders');
const highlightsEl = document.getElementById('client-highlights');

const INR = String.fromCharCode(8377);

function formatINR(value) {
  return `${INR}${Number(value).toFixed(0)}`;
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleString();
}

function getClientSession() {
  const token = localStorage.getItem('byc_client_token');
  const userRaw = localStorage.getItem('byc_client_user');
  if (!token || !userRaw) return null;
  try {
    const user = JSON.parse(userRaw);
    return { token, user };
  } catch {
    return null;
  }
}

function requireClientSession() {
  const session = getClientSession();
  if (!session) {
    window.location.href = '/client-login';
    return null;
  }
  accountEl.textContent = `Signed in as ${session.user.name} (${session.user.phone}).`;
  return session;
}

logoutButton.addEventListener('click', () => {
  localStorage.removeItem('byc_client_token');
  localStorage.removeItem('byc_client_user');
  window.location.href = '/client-login';
});

async function loadOrders(session) {
  const response = await fetch('/api/orders/client', {
    headers: { Authorization: `Bearer ${session.token}` }
  });
  const orders = await response.json();

  ordersEl.innerHTML = '';
  if (!orders.length) {
    ordersEl.innerHTML = '<li class="notice">No orders yet for this account.</li>';
    return;
  }

  orders.slice(0, 6).forEach((order) => {
    const li = document.createElement('li');
    li.innerHTML = `<span>${order._id} · ${formatINR(order.total)} · ${order.status}</span><span>${formatDate(order.createdAt)}</span>`;
    ordersEl.appendChild(li);
  });
}

async function loadHighlights() {
  const response = await fetch('/api/products');
  const products = await response.json();

  highlightsEl.innerHTML = '';
  products.slice(0, 6).forEach((product) => {
    const li = document.createElement('li');
    li.innerHTML = `<span>${product.name}</span><span>${formatINR(product.price)}</span>`;
    highlightsEl.appendChild(li);
  });
}

const session = requireClientSession();
if (session) {
  loadOrders(session);
  loadHighlights();
}
