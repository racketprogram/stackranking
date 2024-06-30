const Redis = require('ioredis');

const redisClients = [
  new Redis({ host: 'localhost', port: 6379 }),
  new Redis({ host: 'localhost', port: 6380 }),
  new Redis({ host: 'localhost', port: 6381 }),
  new Redis({ host: 'localhost', port: 6382 }),
  new Redis({ host: 'localhost', port: 6383 }),
  new Redis({ host: 'localhost', port: 6384 }),
  new Redis({ host: 'localhost', port: 6385 }),
  new Redis({ host: 'localhost', port: 6386 }),
  new Redis({ host: 'localhost', port: 6387 }),
  new Redis({ host: 'localhost', port: 6388 }),
];

module.exports = redisClients;