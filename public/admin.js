const ordersTableBody = document.querySelector('#orders-table tbody');
const usersTableBody = document.querySelector('#users-table tbody');
const overviewEl = document.getElementById('overview');
const logoutButton = document.getElementById('admin-logout');

const INR = String.fromCharCode(8377);

function formatINR(value) {
  return `${INR}${Number(value).toFixed(0)}`;
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleString();
}

function getAdminToken() {
  return localStorage.getItem('byc_admin_token');
}

function requireAdminToken() {
  const token = getAdminToken();
  if (!token) {
    window.location.href = '/admin-login';
    return null;
  }
  return token;
}

logoutButton.addEventListener('click', () => {
  localStorage.removeItem('byc_admin_token');
  window.location.href = '/admin-login';
});

async function loadOrders(token) {
  const response = await fetch('/api/orders', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const orders = await response.json();

  ordersTableBody.innerHTML = '';
  if (!orders.length) {
    ordersTableBody.innerHTML = '<tr><td colspan="5">No orders yet.</td></tr>';
    return [];
  }

  orders.forEach((order) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${order._id}</td>
      <td>${order.customerName}</td>
      <td>${formatINR(order.total)}</td>
      <td><span class="tag">${order.status}</span></td>
      <td>${formatDate(order.createdAt)}</td>
    `;
    ordersTableBody.appendChild(row);
  });

  return orders;
}

async function loadUsers(token) {
  const response = await fetch('/api/users', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const users = await response.json();

  usersTableBody.innerHTML = '';
  if (!users.length) {
    usersTableBody.innerHTML = '<tr><td colspan="3">No registrations yet.</td></tr>';
    return [];
  }

  users.forEach((user) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${user.name}</td>
      <td>${user.phone}</td>
      <td>${formatDate(user.createdAt)}</td>
    `;
    usersTableBody.appendChild(row);
  });

  return users;
}

async function loadOverview() {
  const token = requireAdminToken();
  if (!token) return;

  const orders = await loadOrders(token);
  await loadUsers(token);

  if (!orders.length) {
    overviewEl.textContent = 'No orders placed yet today.';
    return;
  }

  const todayLabel = new Date().toDateString();
  const todaysOrders = orders.filter((order) => new Date(order.createdAt).toDateString() === todayLabel);
  const total = todaysOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);

  overviewEl.textContent = `Orders today: ${todaysOrders.length} | Sales today: ${formatINR(total)}`;
}

loadOverview();
