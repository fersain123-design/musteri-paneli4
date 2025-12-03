const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define('Product', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    sellerId: { type: DataTypes.INTEGER, allowNull: false },
    title: DataTypes.STRING,
    description: DataTypes.TEXT,
    price: DataTypes.FLOAT,
    stock: DataTypes.INTEGER
  }, {
    tableName: 'products',
    timestamps: true
  });
};