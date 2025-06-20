'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('notification', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'user',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      type: {
        type: Sequelize.ENUM('new_invitation', 'invitation_accepted'),
        allowNull: false
      },
      message: {
        type: Sequelize.STRING,
        allowNull: false
      },
      invitationId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'invitation',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      read: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      deletedAt: {
        type: Sequelize.DATE
      }
    });

    await queryInterface.addIndex('notification', ['userId']);
    await queryInterface.addIndex('notification', ['type']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('notification');
  }
};