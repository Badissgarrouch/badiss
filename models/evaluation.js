'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Evaluation extends Model {
    static associate(models) {
      Evaluation.belongsTo(models.user, { foreignKey: 'senderId', as: 'sender' });
      Evaluation.belongsTo(models.user, { foreignKey: 'receiverId', as: 'receiver' });
      models.user.hasMany(Evaluation, { foreignKey: 'senderId', as: 'sentEvaluations' });
      models.user.hasMany(Evaluation, { foreignKey: 'receiverId', as: 'receivedEvaluations' });
    }
  }

  Evaluation.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    senderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'user',
        key: 'id',
      },
    },
    receiverId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'user',
        key: 'id',
      },
    },
    creditCommunicationStars: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },
    paymentTimelinessStars: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },
    transactionProfessionalismStars: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },
    totalStars: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    averageStars: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    satisfactionStatus: {
      type: DataTypes.ENUM('not_satisfied', 'normal', 'satisfied'),
      allowNull: false,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
    deletedAt: DataTypes.DATE,
  }, {
    sequelize,
    modelName: 'evaluation',
    paranoid: true,
    freezeTableName: true,
  });

  return Evaluation;
};