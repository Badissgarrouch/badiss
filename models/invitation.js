'use strict';
const { Model } = require('sequelize');


module.exports = (sequelize, DataTypes) => {
  class Invitation extends Model {
    static associate(models) {
      Invitation.belongsTo(models.user, { foreignKey: 'senderId', as: 'sender' });
      Invitation.belongsTo(models.user, { foreignKey: 'receiverId', as: 'receiver' });
    }
  }
  
  Invitation.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
      defaultValue: 'pending',
      allowNull: false
    },
    senderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'user',
        key: 'id'
      }
    },
    receiverId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'user',
        key: 'id'
      }
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
    deletedAt: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'invitation',
    paranoid: true,
    freezeTableName: true
  });

  return Invitation;
};