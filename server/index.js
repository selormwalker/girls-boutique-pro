require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const cloudinary = require('cloudinary').v2;

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

cloudinary.config({
  cloudinary_url: process.env.CLOUDINARY_URL
});

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Initial Settings Seeder
const initSettings = async () => {
  const count = await prisma.setting.count();
  if (count === 0) {
    await prisma.setting.create({
      data: {
        id: 'shop-settings',
        whatsapp: '233552850088',
        promoMessage: 'FREE DELIVERY IN ACCRA ON ALL ORDERS OVER ₵500!',
        shopName: 'GIRLS BOUTIQUE GH'
      }
    });
    console.log('Seed: Initial Settings Created');
  }
};
initSettings();

app.post('/api/admin/login', async (req, res) => {
  const { password } = req.body;
  if (password === process.env.ADMIN_PASSWORD) {
    const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '24h' });
    return res.json({ token });
  }
  res.status(401).json({ message: 'Invalid credentials' });
});

// Products
app.get('/api/products', async (req, res) => {
  try {
    const products = await prisma.product.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(products.map(p => ({ ...p, colors: p.colors ? p.colors.split(',') : [] })));
  } catch (error) { res.status(500).json([]); }
});

app.post('/api/products', authenticateToken, async (req, res) => {
  try {
    let imageUrl = req.body.image;
    if (imageUrl && imageUrl.startsWith('data:image')) {
      const uploadRes = await cloudinary.uploader.upload(imageUrl, { folder: 'girls_boutique' });
      imageUrl = uploadRes.secure_url;
    }
    const product = await prisma.product.create({
      data: {
        name: req.body.name,
        description: req.body.description || '',
        price: Number(req.body.price),
        category: req.body.category,
        colors: req.body.colors || '',
        image: imageUrl || ''
      }
    });
    res.status(201).json({ ...product, colors: product.colors.split(',') });
  } catch (error) { res.status(400).json({ message: error.message }); }
});

app.put('/api/products/:id', authenticateToken, async (req, res) => {
  try {
    let imageUrl = req.body.image;
    if (imageUrl && imageUrl.startsWith('data:image')) {
      const uploadRes = await cloudinary.uploader.upload(imageUrl, { folder: 'girls_boutique' });
      imageUrl = uploadRes.secure_url;
    }
    const data = {};
    if (req.body.name) data.name = req.body.name;
    if (req.body.description !== undefined) data.description = req.body.description;
    if (req.body.price) data.price = Number(req.body.price);
    if (req.body.category) data.category = req.body.category;
    if (req.body.colors !== undefined) data.colors = req.body.colors;
    if (imageUrl) data.image = imageUrl;

    const product = await prisma.product.update({ where: { id: req.params.id }, data });
    res.json({ ...product, colors: product.colors.split(',') });
  } catch (error) { res.status(400).json({ message: error.message }); }
});

app.delete('/api/products/:id', authenticateToken, async (req, res) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (product && product.image && product.image.includes('cloudinary.com')) {
      const publicId = product.image.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`girls_boutique/${publicId}`);
    }
    await prisma.product.delete({ where: { id: req.params.id } });
    res.json({ message: 'Deleted' });
  } catch (error) { res.status(400).json({ message: error.message }); }
});

// Orders
app.post('/api/orders', async (req, res) => {
  try {
    await prisma.order.create({
      data: {
        items: JSON.stringify(req.body.items),
        total: Number(req.body.total),
        status: req.body.status || 'pending',
        customerName: req.body.customerName || 'Website Customer'
      }
    });
    res.json({ success: true });
  } catch (error) { res.status(400).json({ success: false }); }
});

app.get('/api/orders', authenticateToken, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(orders.map(o => ({ ...o, items: JSON.parse(o.items) })));
  } catch (error) { res.status(500).json([]); }
});

app.put('/api/orders/:id', authenticateToken, async (req, res) => {
  try {
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status: req.body.status }
    });
    res.json(order);
  } catch (error) { res.status(400).json({ message: error.message }); }
});

// Newsletter
app.post('/api/newsletter', async (req, res) => {
  try {
    await prisma.newsletter.create({ data: { email: req.body.email } });
    res.json({ success: true });
  } catch (error) { res.json({ success: false }); }
});

app.get('/api/newsletter', authenticateToken, async (req, res) => {
  try {
    const subs = await prisma.newsletter.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(subs);
  } catch (error) { res.status(500).json([]); }
});

// Settings
app.get('/api/settings', async (req, res) => {
  try {
    const settings = await prisma.setting.findUnique({ where: { id: 'shop-settings' } });
    res.json(settings);
  } catch (error) { res.status(500).json({}); }
});

app.put('/api/settings', authenticateToken, async (req, res) => {
  try {
    const settings = await prisma.setting.update({
      where: { id: 'shop-settings' },
      data: req.body
    });
    res.json(settings);
  } catch (error) { res.status(400).json({ message: error.message }); }
});

// Analytics
app.get('/api/analytics', authenticateToken, async (req, res) => {
  try {
    const productCount = await prisma.product.count();
    const orderCount = await prisma.order.count();
    const subscriberCount = await prisma.newsletter.count();
    const totalRev = await prisma.order.aggregate({ _sum: { total: true } });
    
    // Get daily sales for chart
    const last7Days = await prisma.order.groupBy({
      by: ['createdAt'],
      _sum: { total: true },
      where: {
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }
    });

    res.json({ productCount, orderCount, subscriberCount, revenue: totalRev._sum.total || 0, chartData: last7Days });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.listen(PORT, () => { console.log(`Server is running on port ${PORT}`); });
