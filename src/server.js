const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = Number(process.env.PORT || 3000);
const ROOT = path.join(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const DATA_DIR = path.join(ROOT, 'data');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');

const products = [
  { id: 'croissant', name: 'Butter Croissant', price: 3.5, image: '🥐', category: 'Pastries' },
  { id: 'sourdough', name: 'Sourdough Loaf', price: 6.0, image: '🍞', category: 'Bread' },
  { id: 'cupcake', name: 'Vanilla Cupcake', price: 4.0, image: '🧁', category: 'Desserts' },
  { id: 'cookie-box', name: 'Cookie Box (6)', price: 12.0, image: '🍪', category: 'Treats' },
  { id: 'cheesecake', name: 'Mini Cheesecake', price: 5.5, image: '🍰', category: 'Desserts' },
  { id: 'baguette', name: 'French Baguette', price: 4.5, image: '🥖', category: 'Bread' }
];

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8'
};

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(ORDERS_FILE)) fs.writeFileSync(ORDERS_FILE, '[]', 'utf8');
}

function readOrders() {
  ensureDataFile();
  const raw = fs.readFileSync(ORDERS_FILE, 'utf8');
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeOrders(orders) {
  ensureDataFile();
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
}

function sendJson(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(JSON.stringify(body));
}

function notFound(res) {
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not found');
}

function serveStatic(res, pathname) {
  const requested = pathname === '/' ? '/index.html' : pathname;
  const normalized = path.posix.normalize(requested);
  if (normalized.includes('..')) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  const filePath = path.join(PUBLIC_DIR, normalized);
  fs.readFile(filePath, (err, data) => {
    if (err) return notFound(res);
    const ext = path.extname(filePath);
    res.writeHead(200, {
      'Content-Type': contentTypes[ext] || 'application/octet-stream',
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600'
    });
    res.end(data);
  });
}

function validateOrderPayload(payload) {
  const errors = [];
  if (!payload || typeof payload !== 'object') return ['Invalid payload.'];

  const customerName = String(payload.customerName || '').trim();
  const phone = String(payload.phone || '').trim();
  const address = String(payload.address || '').trim();
  const items = Array.isArray(payload.items) ? payload.items : [];

  if (customerName.length < 2) errors.push('Customer name is required.');
  if (phone.length < 5) errors.push('Phone is required.');
  if (address.length < 5) errors.push('Address is required.');
  if (items.length === 0) errors.push('At least one item is required.');

  const sanitizedItems = items
    .map((item) => {
      const id = String(item.id || '');
      const name = String(item.name || '').trim();
      const price = Number(item.price);
      const quantity = Number(item.quantity);
      const valid = id && name && Number.isFinite(price) && price >= 0 && Number.isInteger(quantity) && quantity > 0;
      return valid ? { id, name, price, quantity } : null;
    })
    .filter(Boolean);

  if (sanitizedItems.length !== items.length) errors.push('One or more items are invalid.');

  return errors.length > 0
    ? errors
    : { customerName, phone, address, items: sanitizedItems };
}

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (req.method === 'GET' && parsedUrl.pathname === '/api/health') {
    return sendJson(res, 200, { ok: true });
  }

  if (req.method === 'GET' && parsedUrl.pathname === '/api/products') {
    return sendJson(res, 200, products);
  }

  if (req.method === 'GET' && parsedUrl.pathname === '/api/orders') {
    const orders = readOrders().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return sendJson(res, 200, orders);
  }

  if (req.method === 'POST' && parsedUrl.pathname === '/api/orders') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
      if (body.length > 1_000_000) req.socket.destroy();
    });

    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const valid = validateOrderPayload(payload);
        if (Array.isArray(valid)) return sendJson(res, 400, { error: valid.join(' ') });

        const total = valid.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const orders = readOrders();
        const order = {
          id: `ORD-${Date.now()}`,
          customerName: valid.customerName,
          phone: valid.phone,
          address: valid.address,
          items: valid.items,
          total: Number(total.toFixed(2)),
          createdAt: new Date().toISOString(),
          status: 'RECEIVED'
        };
        orders.push(order);
        writeOrders(orders);
        return sendJson(res, 201, { message: 'Order placed successfully!', order });
      } catch {
        return sendJson(res, 400, { error: 'Invalid JSON body.' });
      }
    });
    return;
  }

  serveStatic(res, parsedUrl.pathname);
});

server.listen(PORT, () => {
  console.log(`Sweet Crumbs Bakery running at http://localhost:${PORT}`);
});
