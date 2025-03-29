const { Model, Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');
const sequelize = require('../config/database');

module.exports = sequelize.define('user', {
  id: {
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    type: DataTypes.INTEGER,
  },
  userType: {
    type: DataTypes.ENUM('0', '1', '2'),
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull:false,
    validate:{
      notNull:{
        msg:'user can not be null'
      },
      notEmpty:{
        msg:'user can not be empty'
      },
    },
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull:false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull:false,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull:false,
  },
  password: {
    type: DataTypes.STRING,
    allowNull:false,
  },
  confirmPassword: {
    type: DataTypes.VIRTUAL,
    set(value) {
      if (value !== this.password) {
        throw new Error('Les mots de passe ne correspondent pas');
      }
      // Le hachage est déjà géré par le hook beforeCreate
    }
  },
  businessName: {  // New field for merchants
    type: DataTypes.STRING,
    allowNull: true,  // Only merchants will fill this field
  },
  businessAddress: {  // New field for merchants
    type: DataTypes.STRING,
    allowNull: true,  // Only merchants will fill this field
  },
  sectorOfActivity: {  // New field for merchants
    type: DataTypes.STRING,
    allowNull: true,  // Only merchants will fill this field
  },
  otpCode: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  otpExpires: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  passwordResetToken: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  passwordResetExpires: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  isEmailVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },

  createdAt: {
    allowNull: false,
    type: DataTypes.DATE,
  },
  updatedAt: {
    allowNull: false,
    type: DataTypes.DATE,
  },
  deletedAt: {
    type: DataTypes.DATE,
  },
}, {
  paranoid: true,
  modelName: 'user',
  freezeTableName: true,
});
