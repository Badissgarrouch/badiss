const bcrypt = require('bcrypt');

module.exports = {
    up: (queryInterface, Sequelize) => {
        let password = process.env.ADMIN_PASSWORD;
        const hashPassword = bcrypt.hashSync(password, 10);
        return queryInterface.bulkInsert('user', [
            {
                userType: '0',
                firstName: 'Badiss',
                lastName: 'Garrouch',
                email: process.env.ADMIN_EMAIL,
                phone:'58878133',
                password: hashPassword,
                createdAt: new Date(),
                updatedAt: new Date(),
                isEmailVerified:true,
                
            },
        ]);
    },
    down: (queryInterface, Sequelize) => {
        return queryInterface.bulkDelete('user', { userType: '0' }, {});
    },
};
