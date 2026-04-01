require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const storeSchema = new mongoose.Schema({
  domain: { type: String, required: true },
  kode_toko: { type: String, required: true }
});

const Store = mongoose.model('Store', storeSchema);

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
