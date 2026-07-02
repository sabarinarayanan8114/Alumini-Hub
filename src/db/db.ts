import { Sequelize } from 'sequelize';
import path from 'path';

// Establish a Sequelize connection to a local SQLite database
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(process.cwd(), 'alumni-hub.sqlite'),
  logging: false, // Set to console.log to see SQL queries in the logs
});

export default sequelize;
