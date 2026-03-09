const productsEl = document.getElementById('products');
const cartEl = document.getElementById('cart-items');
const totalEl = document.getElementById('total');
const messageEl = document.getElementById('message');
const recentOrdersEl = document.getElementById('recent-orders');
const form = document.getElementById('order-form');

const cart = new Map();

function renderCart() {
  cartEl.innerHTML = '';
  let total = 0;

  for (const item of cart.values()) {
    const li = document.createElement('li');
    li.innerHTML = `<span>${item.name} x ${item.quantity}</span><span>$${(item.price * item.quantity).toFixed(2)}</span>`;
    cartEl.appendChild(li);
    total += item.price * item.quantity;
  }

  totalEl.textContent = `$${total.toFixed(2)}`;
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
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <div class="emoji">${p.image}</div>
      <h3>${p.name}</h3>
      <p>${p.category}</p>
      <p><strong>$${p.price.toFixed(2)}</strong></p>
      <button class="add-btn">Add to cart</button>
      <div class="qty">
        <button class="minus">-</button>
        <span>Adjust</span>
        <button class="plus">+</button>
      </div>
    `;
    card.querySelector('.add-btn').addEventListener('click', () => changeQuantity(p, 1));
    card.querySelector('.plus').addEventListener('click', () => changeQuantity(p, 1));
    card.querySelector('.minus').addEventListener('click', () => changeQuantity(p, -1));
    productsEl.appendChild(card);
  }
}

async function loadRecentOrders() {
  const res = await fetch('/api/orders');
  const orders = await res.json();

  recentOrdersEl.innerHTML = '';
  if (!orders.length) {
    recentOrdersEl.innerHTML = '<li class="muted">No orders yet.</li>';
    return;
  }

  orders.slice(0, 5).forEach((order) => {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${order.id}</strong> · $${Number(order.total).toFixed(2)}<br /><span class="muted">${new Date(order.createdAt).toLocaleString()}</span>`;
    recentOrdersEl.appendChild(li);
  });
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  messageEl.textContent = '';

  if (cart.size === 0) {
    messageEl.textContent = 'Please add at least one item.';
    return;
  }

  const payload = {
    customerName: document.getElementById('customerName').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    address: document.getElementById('address').value.trim(),
    items: [...cart.values()].map(({ id, name, price, quantity }) => ({ id, name, price, quantity }))
  };

  const res = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (!res.ok) {
    messageEl.textContent = data.error || 'Could not place order.';
    return;
  }

  messageEl.textContent = `✅ ${data.order.id} placed!`;
  form.reset();
  cart.clear();
  renderCart();
  await loadRecentOrders();
});

loadProducts();
loadRecentOrders();
