const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define('Order', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    customerId: { type: DataTypes.INTEGER, allowNull: false },
    sellerId: { type: DataTypes.INTEGER, allowNull: false },
    items: { type: DataTypes.JSONB, allowNull: false }, // [{productId, qty, price}]
    total: DataTypes.FLOAT,
    status: { type: DataTypes.STRING, defaultValue: 'pending' }
  }, {
    tableName: 'orders',
    timestamps: true
  });
};