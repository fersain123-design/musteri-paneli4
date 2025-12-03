const { sequelize, User, Product } = require('./models');
const bcrypt = require('bcrypt');

(async () => {
  await sequelize.sync({ force: true });
  const pass = await bcrypt.hash('password123', 10);
  const seller = await User.create({ name: 'Test Seller', email: 'seller@example.com', passwordHash: pass, role: 'seller' });
  const customer = await User.create({ name: 'Test Customer', email: 'customer@example.com', passwordHash: pass, role: 'customer' });
  await Product.create({ sellerId: seller.id, title: 'Demo Product', description: 'Example product', price: 9.99, stock: 100 });
  console.log('Seed completed.');
  process.exit(0);
})();