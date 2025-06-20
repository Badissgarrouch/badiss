'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('evaluation', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      senderId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'user',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      receiverId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'user',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      creditCommunicationStars: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 5,
        },
      },
      paymentTimelinessStars: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 5,
        },
      },
      transactionProfessionalismStars: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 5,
        },
      },
      totalStars: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      averageStars: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      satisfactionStatus: {
        type: Sequelize.ENUM('not_satisfied', 'normal', 'satisfied'),
        allowNull: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      deletedAt: {
        type: Sequelize.DATE,
      },
    });

    await queryInterface.addIndex('evaluation', ['senderId']);
    await queryInterface.addIndex('evaluation', ['receiverId']);
    await queryInterface.addIndex('evaluation', ['satisfactionStatus']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('evaluation');
  },
};