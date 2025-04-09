'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      userType: {
        type: Sequelize.ENUM('0', '1', '2'),
      },
      firstName: {
        type: Sequelize.STRING,
        allowNull:false,
      },
      lastName: {
        type: Sequelize.STRING,
        allowNull:false,
      },
      email: {
        type: Sequelize.STRING,
        allowNull:false,
      },
      password: {
        type: Sequelize.STRING,
        allowNull:false,
      },
      phone: {
          type:Sequelize.STRING,
          allowNull:false,
        },
        carteCin: {  
          type: Sequelize.STRING,
          allowNull: false,
          
        },
      businessName: {  // New field for merchants
        type: Sequelize.STRING,
        allowNull: true,  // Only merchants will fill this field
      },
      businessAddress: {  // New field for merchants
        type: Sequelize.STRING,
        allowNull: true,  // Only merchants will fill this field
      },
      sectorOfActivity: {  // New field for merchants
        type: Sequelize.STRING,
        allowNull: true,
        // Only merchants will fill this field
      },
      
      otpCode: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      otpExpires: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      passwordResetToken: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      passwordResetExpires: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      isEmailVerified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
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
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('user');
  }
};
