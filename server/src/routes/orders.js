const express = require('express');
const router = express.Router();
const { Order } = require('../models');
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

router.post('/', auth, async (req, res) => {
  // customer places order
  if (req.user.role !== 'customer') return res.status(403).send('Only customers can create orders');
  const { items, total, sellerId } = req.body;
  const order = await Order.create({
    customerId: req.user.id,
    sellerId,
    items,
    total
  });
  // Later: push notification to seller via Socket.IO or email
  res.json(order);
});

router.get('/', auth, async (req, res) => {
  const { sellerId, customerId } = req.query;
  const where = {};
  if (sellerId) where.sellerId = sellerId;
  if (customerId) where.customerId = customerId;
  const orders = await Order.findAll({ where });
  res.json(orders);
});

module.exports = router;