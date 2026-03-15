const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const crypto = require('crypto');

const PORT = Number(process.env.PORT || 3000);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bake_your_cake';
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'bake123';

const app = express();
const ROOT = path.join(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');

app.use(express.json({ limit: '1mb' }));
app.use(express.static(PUBLIC_DIR));

const productSchema = new mongoose.Schema({
  code: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  description: { type: String, default: '' },
  image: { type: String, default: '' }

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const orderSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  items: [
    {
      code: String,
      name: String,
      price: Number,
      quantity: Number
    }
  ],
  total: { type: Number, required: true },
  status: { type: String, default: 'RECEIVED' },
  createdAt: { type: Date, default: Date.now }
});

const Product = mongoose.model('Product', productSchema);
const User = mongoose.model('User', userSchema);
const Order = mongoose.model('Order', orderSchema);

const seedProducts = [
  {
    code: 'burger-buns',
    name: 'Burger Buns (6)',
    price: 120,
    category: 'Breads',
    description: 'Soft, golden buns for burgers and sliders.',
    image: '/images/burger-buns.svg'
  },
  {
    code: 'flat-bread',
    name: 'Flat Bread',
    price: 60,
    category: 'Breads',
    description: 'Light, fluffy flat bread perfect for wraps.',
    image: '/images/flat-bread.svg'
  },
  {
    code: 'cream-puffs',
    name: 'Cream Puffs (4)',
    price: 180,
    category: 'Desserts',
    description: 'Choux pastry filled with vanilla cream.',
    image: '/images/cream-puffs.svg'
  },
  {
    code: 'gulab-jamun',
    name: 'Gulab Jamun (8)',
    price: 220,
    category: 'Indian Delicacies',
    description: 'Milk-solid dumplings soaked in rose syrup.',
    image: '/images/gulab-jamun.svg'
  },
  {
    code: 'jalebi',
    name: 'Jalebi (250g)',
    price: 200,
    category: 'Indian Delicacies',
    description: 'Crispy spirals dipped in saffron syrup.',
    image: '/images/jalebi.svg'
  },
  {
    code: 'nankhatai',
    name: 'Nankhatai (6)',
    price: 160,
    category: 'Indian Delicacies',
    description: 'Traditional shortbread cookies with cardamom.',
    image: '/images/nankhatai.svg'
  },
  {
    code: 'khari',
    name: 'Khari (200g)',
    price: 140,
    category: 'Indian Delicacies',
    description: 'Flaky, buttery puff biscuits.',
    image: '/images/khari.svg'
  }
];

const sessions = new Map();

function createSession(payload) {
  const token = crypto.randomBytes(24).toString('hex');
  sessions.set(token, { ...payload, createdAt: Date.now() });
  return token;
}

function requireRole(role) {
  return (req, res, next) => {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token || !sessions.has(token)) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }
    const session = sessions.get(token);
    if (role && session.role !== role) {
      return res.status(403).json({ error: 'Forbidden.' });
    }
    req.session = session;
    return next();
  };
}

async function ensureProducts() {
  const count = await Product.countDocuments();
  if (count === 0) {
    await Product.insertMany(seedProducts);
  }
}

function sanitizeString(value) {
  return String(value || '').trim();
}

function validateItems(items) {
  if (!Array.isArray(items) || items.length === 0) return { error: 'At least one item is required.' };
  const normalized = items
    .map((item) => ({
      code: sanitizeString(item.code),
      quantity: Number(item.quantity)
    }))
    .filter((item) => item.code && Number.isInteger(item.quantity) && item.quantity > 0);

  if (normalized.length !== items.length) {
    return { error: 'One or more items are invalid.' };
  }

  return { items: normalized };
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, db: mongoose.connection.readyState });
});

app.get('/api/products', async (_req, res) => {
  try {
    const products = await Product.find().sort({ category: 1, name: 1 });
    res.json(
      products.map((product) => ({
        id: product.code,
        name: product.name,
        price: product.price,
        category: product.category,
        description: product.description,
        image: product.image || '/images/' + product.code + '.svg'
      }))
    );
  } catch (error) {
    res.status(500).json({ error: 'Unable to load products.' });
  }
});

app.post('/api/login/admin', (req, res) => {
  const username = sanitizeString(req.body.username);
  const password = sanitizeString(req.body.password);

  if (username !== ADMIN_USER || password !== ADMIN_PASS) {
    return res.status(401).json({ error: 'Invalid admin credentials.' });
  }

  const token = createSession({ role: 'admin' });
  res.json({ token });
});

app.post('/api/login/client', async (req, res) => {
  const name = sanitizeString(req.body.name);
  const phone = sanitizeString(req.body.phone);

  if (name.length < 2) {
    return res.status(400).json({ error: 'Name is required.' });
  }
  if (phone.length < 5) {
    return res.status(400).json({ error: 'Phone placeholder is required.' });
  }

  try {
    const user = await User.findOneAndUpdate(
      { phone },
      { name, phone },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    const token = createSession({ role: 'client', userId: user._id });
    res.json({ token, user: { id: user._id, name: user.name, phone: user.phone } });
  } catch (error) {
    res.status(500).json({ error: 'Unable to log in client.' });
  }
});

app.get('/api/users', requireRole('admin'), async (_req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).limit(50);
    res.json(
      users.map((user) => ({
        id: user._id,
        name: user.name,
        phone: user.phone,
        createdAt: user.createdAt
      }))
    );
  } catch (error) {
    res.status(500).json({ error: 'Unable to load users.' });
  }
});

app.post('/api/orders', requireRole('client'), async (req, res) => {
  const payload = req.body || {};
  const customerName = sanitizeString(payload.customerName);
  const phone = sanitizeString(payload.phone);
  const address = sanitizeString(payload.address);

  if (customerName.length < 2) return res.status(400).json({ error: 'Customer name is required.' });
  if (phone.length < 5) return res.status(400).json({ error: 'Phone placeholder is required.' });
  if (address.length < 5) return res.status(400).json({ error: 'Address is required.' });

  const { items, error } = validateItems(payload.items);
  if (error) return res.status(400).json({ error });

  try {
    const productDocs = await Product.find({ code: { $in: items.map((item) => item.code) } });
    const productMap = new Map(productDocs.map((product) => [product.code, product]));

    const orderItems = items.map((item) => {
      const product = productMap.get(item.code);
      return product
        ? {
            code: product.code,
            name: product.name,
            price: product.price,
            quantity: item.quantity
          }
        : null;
    });

    if (orderItems.some((item) => item === null)) {
      return res.status(400).json({ error: 'One or more items are unavailable.' });
    }

    const total = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const order = await Order.create({
      customerName,
      phone,
      address,
      userId: req.session.userId || null,
      items: orderItems,
      total,
      status: 'RECEIVED'
    });

    res.status(201).json({ message: 'Order placed successfully!', order });
  } catch (error) {
    res.status(500).json({ error: 'Unable to place order.' });
  }
});

app.get('/api/orders', requireRole('admin'), async (_req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).limit(50);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Unable to load orders.' });
  }
});

app.get('/api/orders/client', requireRole('client'), async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.session.userId }).sort({ createdAt: -1 }).limit(25);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Unable to load client orders.' });
  }
});

app.get('/customer', (_req, res) => {
  res.redirect('/');
});

app.get('/client', (_req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'client.html'));
});

app.get('/admin', (_req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'admin.html'));
});

app.get('/client-login', (_req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'client-login.html'));
});

app.get('/admin-login', (_req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'admin-login.html'));
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

mongoose
  .connect(MONGODB_URI)
  .then(async () => {
    await ensureProducts();
    app.listen(PORT, () => {
      console.log(`Bake Your Cake running at http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  });








