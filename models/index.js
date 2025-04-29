'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.js')[env];
const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

fs.readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach(file => {
    const modelModule = require(path.join(__dirname, file));
    
  
    let model;
    if (typeof modelModule === 'function') {
      model = modelModule(sequelize, Sequelize.DataTypes);
    } else {
      model = new modelModule(sequelize, Sequelize.DataTypes);
    }
    
    db[model.name] = model;
  });

db.user = require('./user')(sequelize, Sequelize.DataTypes);
db.Invitation = require('./invitation')(sequelize, Sequelize.DataTypes);
db.Invitation.belongsTo(db.user, { foreignKey: 'senderId', as: 'sender' });
db.Invitation.belongsTo(db.user, { foreignKey: 'receiverId', as: 'receiver' });
db.user.hasMany(db.Invitation, { foreignKey: 'senderId', as: 'sentInvitations' });
db.user.hasMany(db.Invitation, { foreignKey: 'receiverId', as: 'receivedInvitations' });

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;