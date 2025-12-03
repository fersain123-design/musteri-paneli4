const express = require('express');
const router = express.Router();
const { Product } = require('../models');
const jwt = require('jsonwebtoken');

function auth(req, res, next) {
  const h = req.headers.authorization;
  if (!h) return res.status(401).send('No token');
  const token = h.replace('Bearer ', '');
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) { res.status(401).send('Invalid token'); }
}

router.get('/', async (req, res) => {
  const products = await Product.findAll();
  res.json(products);
});

router.post('/', auth, async (req, res) => {
  if (req.user.role !== 'seller') return res.status(403).send('Only sellers can add products');
  const payload = { ...req.body, sellerId: req.user.id };
  const p = await Product.create(payload);
  res.json(p);
});

module.exports = router;