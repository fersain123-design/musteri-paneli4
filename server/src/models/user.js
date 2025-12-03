const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: DataTypes.STRING,
    email: { type: DataTypes.STRING, unique: true },
    passwordHash: DataTypes.STRING,
    role: { type: DataTypes.ENUM('customer','seller','admin'), defaultValue: 'customer' }
  }, {
    tableName: 'users',
    timestamps: true
  });

  User.prototype.verifyPassword = function(password) {
    return bcrypt.compare(password, this.passwordHash);
  };

  return User;
};