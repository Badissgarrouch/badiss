'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Notification extends Model {
    static associate(models) {
      Notification.belongsTo(models.user, { foreignKey: 'userId', as: 'user' });
      Notification.belongsTo(models.invitation, { foreignKey: 'invitationId', as: 'invitation' });
    }
  }

  Notification.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'user',
        key: 'id'
      }
    },
    type: {
      type: DataTypes.ENUM('new_invitation', 'invitation_accepted'),
      allowNull: false
    },
    message: {
      type: DataTypes.STRING,
      allowNull: false
    },
    invitationId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
    deletedAt: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'notification',
    paranoid: true,
    freezeTableName: true
  });

  return Notification;
};