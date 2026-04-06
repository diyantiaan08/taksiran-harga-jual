require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
app.use(cors());

const storeSchema = new mongoose.Schema({
  domain: { type: String, required: true },
  kode_toko: { type: String, required: true },
  qr_link: { type: String }
});

const Store = mongoose.model('Store', storeSchema);

const userSchema = new mongoose.Schema({
  user_id: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true }
});

const User = mongoose.model('tm_user', userSchema, 'tm_user');

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

app.post('/stores', async (req, res) => {
  const { domain, kode_toko } = req.body;
  if (!domain || !kode_toko) return res.status(400).json({ message: 'domain dan kode_toko wajib diisi' });
  const exists = await Store.findOne({ domain, kode_toko });
  if (exists) return res.status(400).json({ message: 'Domain dan kode toko sudah terdaftar.' });
  const store = new Store({ domain, kode_toko });
  await store.save();
  res.json(store);
});

app.get('/stores', async (req, res) => {
  const stores = await Store.find({}, { _id: 0, __v: 0 });
  res.json({ stores });
});

app.patch('/stores/qr', async (req, res) => {
  const { kode_toko, qr_link } = req.body || {};
  if (!kode_toko || !qr_link) {
    return res.status(400).json({ message: 'kode_toko dan qr_link wajib diisi' });
  }
  const updated = await Store.findOneAndUpdate(
    { kode_toko },
    { $set: { qr_link } },
    { new: true, projection: { _id: 0, __v: 0 } }
  );
  if (!updated) return res.status(404).json({ message: 'Store tidak ditemukan' });
  return res.json({ store: updated });
});

const requireAuth = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    return next();
  } catch (e) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

app.post('/auth/login', async (req, res) => {
  const { user_id, password } = req.body || {};
  if (!user_id || !password) {
    return res.status(400).json({ message: 'user_id dan password wajib diisi' });
  }
  const user = await User.findOne({ user_id });
  if (!user) return res.status(401).json({ message: 'User tidak ditemukan' });
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ message: 'Password salah' });
  const token = jwt.sign({ user_id }, process.env.JWT_SECRET, { expiresIn: '12h' });
  return res.json({ token, user_id });
});

app.get('/auth/me', requireAuth, async (req, res) => {
  res.json({ user_id: req.user.user_id });
});

app.get('/qr/resolve', async (req, res) => {
  const { url } = req.query;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ message: 'url wajib diisi' });
  }
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 7000);
    const response = await fetch(url, { redirect: 'follow', signal: controller.signal });
    clearTimeout(timer);

    const finalUrl = response.url || url;
    const contentType = response.headers.get('content-type') || '';
    const body = await response.text();

    let extracted = '';
    if (contentType.includes('text/plain')) {
      extracted = body.trim();
    } else {
      const titleMatch = body.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch) {
        extracted = titleMatch[1].trim();
      }
      if (!extracted) {
        const dataMatch = body.match(/data-qr[^=]*="([^"]+)"/i);
        if (dataMatch) extracted = dataMatch[1].trim();
      }
      if (!extracted) {
        const plain = body.replace(/<script[\s\S]*?<\/script>/gi, ' ')
          .replace(/<style[\s\S]*?<\/style>/gi, ' ')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        const candidate = plain.match(/[A-Z0-9][A-Z0-9\s\-_/]{2,50}/);
        if (candidate) extracted = candidate[0].trim();
      }
    }

    res.json({ finalUrl, extracted });
  } catch (err) {
    res.status(500).json({ message: 'Gagal resolve QR' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
