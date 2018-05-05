/*!
 * ZAP CLI
 * Copyright(c) 2018 Kudriavtsev Sergey @ smartum.pro
 * MIT Licensed
 */
'use strict';
const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');

const env = process.env.NODE_ENV || 'production';
const config = require('./config/db.json')[env];
const modelsPath = __dirname + '/models';
const db = {};
db.Sequelize = Sequelize;

/**
 * [exports description]
 * @param  {[type]} storage [description]
 * @return {[type]}         [description]
 */
module.exports = async (storage) => {
  if (!db.sequelize) {
    config.storage = storage || config.storage;
    db.sequelize = await new Sequelize(config.database, config.username, config.password, config);
    // console.log(`Start Initial DBConnect to: ${config.database} on host: ${config.storage}`);

    // import all models
    fs
      .readdirSync(modelsPath)
      .filter(file => (file.indexOf('.') > 0))
      .forEach((file) => {
        const model = db.sequelize.import(path.join(modelsPath, file));
        db[model.name] = model;
      });

    // init link models
    Object.keys(db).forEach((modelName) => {
      if ('associate' in db[modelName]) {
        db[modelName].associate(db);
      }
    });

    // Sync Database
    await db.sequelize.sync().catch((err) => {
      console.log(err, 'Something went wrong with the Database Update!');
    });

  }

  return db;
};
