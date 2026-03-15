const productsEl = document.getElementById('products');
const cartEl = document.getElementById('cart-items');
const totalEl = document.getElementById('total');
const messageEl = document.getElementById('message');
const recentOrdersEl = document.getElementById('recent-orders');
const form = document.getElementById('order-form');
const submitBtn = form.querySelector('button[type="submit"]');

const INR = 'INR ';
const cart = new Map();

function formatINR(value) {
  return `${INR}${Number(value).toFixed(2)}`;
}

function getClientToken() {
  return localStorage.getItem('byc_client_token');
}

function getClientUser() {
  const raw = localStorage.getItem('byc_client_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
}

function syncClientState() {
  const token = getClientToken();
  const user = getClientUser();

  if (user) {
    const nameInput = document.getElementById('customerName');
    const phoneInput = document.getElementById('phone');
    if (!nameInput.value) nameInput.value = user.name || '';
    if (!phoneInput.value) phoneInput.value = user.phone || '';
  }

  if (!token) {
    submitBtn.disabled = true;
    submitBtn.classList.add('disabled');
    if (!messageEl.textContent) {
      messageEl.textContent = 'Please log in as a client to place an order.';
      messageEl.classList.add('muted');
    }
  } else {
    submitBtn.disabled = false;
    submitBtn.classList.remove('disabled');
    if (messageEl.textContent === 'Please log in as a client to place an order.') {
      messageEl.textContent = '';
      messageEl.classList.remove('muted');
    }
  }
}

function renderCart() {
  cartEl.innerHTML = '';
  let total = 0;

  for (const item of cart.values()) {
    const li = document.createElement('li');
    li.innerHTML = `<span>${item.name} x ${item.quantity}</span><span>${formatINR(item.price * item.quantity)}</span>`;
    cartEl.appendChild(li);
    total += item.price * item.quantity;
  }

  totalEl.textContent = formatINR(total);
}

function changeQuantity(product, delta) {
  const existing = cart.get(product.id);
  if (!existing && delta < 0) return;

  if (!existing) {
    cart.set(product.id, { ...product, quantity: 1 });
  } else {
    existing.quantity += delta;
    if (existing.quantity <= 0) cart.delete(product.id);
  }
  renderCart();
}

async function loadProducts() {
  const res = await fetch('/api/products');
  const products = await res.json();

  productsEl.innerHTML = '';
  for (const p of products) {
    const imageUrl = p.image || `/images/${p.id}.svg`;
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <img class="product-image" src="${imageUrl}" alt="${p.name}" loading="lazy" />
      <h3>${p.name}</h3>
      <p>${p.category}</p>
      <p><strong>${formatINR(p.price)}</strong></p>
      <button class="add-btn" type="button">Add to cart</button>
      <div class="qty">
        <button class="minus" type="button">-</button>
        <span>Adjust</span>
        <button class="plus" type="button">+</button>
      </div>
    `;
    card.querySelector('.add-btn').addEventListener('click', () => changeQuantity(p, 1));
    card.querySelector('.plus').addEventListener('click', () => changeQuantity(p, 1));
    card.querySelector('.minus').addEventListener('click', () => changeQuantity(p, -1));
    productsEl.appendChild(card);
  }
}

async function loadRecentOrders() {
  const token = getClientToken();
  recentOrdersEl.innerHTML = '';

  if (!token) {
    recentOrdersEl.innerHTML = '<li class="muted">Log in as a client to see your recent orders.</li>';
    return;
  }

  const res = await fetch('/api/orders/client', {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    recentOrdersEl.innerHTML = '<li class="muted">Unable to load recent orders.</li>';
    return;
  }

  const orders = await res.json();

  if (!orders.length) {
    recentOrdersEl.innerHTML = '<li class="muted">No orders yet.</li>';
    return;
  }

  orders.slice(0, 5).forEach((order) => {
    const li = document.createElement('li');
    const created = new Date(order.createdAt).toLocaleString();
    const orderId = order.id || order._id;
    li.innerHTML = `<strong>${orderId}</strong> - ${formatINR(order.total)}<br /><span class="muted">${created}</span>`;
    recentOrdersEl.appendChild(li);
  });
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  messageEl.textContent = '';
  messageEl.classList.remove('muted');

  const token = getClientToken();
  if (!token) {
    messageEl.textContent = 'Please log in as a client to place an order.';
    messageEl.classList.add('muted');
    return;
  }

  if (cart.size === 0) {
    messageEl.textContent = 'Please add at least one item.';
    return;
  }

  const payload = {
    customerName: document.getElementById('customerName').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    address: document.getElementById('address').value.trim(),
    items: [...cart.values()].map(({ id, name, price, quantity }) => ({ code: id, name, price, quantity }))
  };

  const res = await fetch('/api/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (!res.ok) {
    messageEl.textContent = data.error || 'Could not place order.';
    return;
  }

  const orderId = data.order?.id || data.order?._id || 'unknown';
  messageEl.textContent = `Order placed: ${orderId}`;
  form.reset();
  cart.clear();
  renderCart();
  await loadRecentOrders();
  syncClientState();
});

syncClientState();
loadProducts();
loadRecentOrders();
