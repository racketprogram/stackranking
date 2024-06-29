const pool = require('../config/database');

module.exports = {
  query: (text, params) => pool.query(text, params),
};
