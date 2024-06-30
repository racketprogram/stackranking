const Redis = require('ioredis');

const redisClient = new Redis.Cluster([
  { host: 'redis-node1', port: 7000 },
  { host: 'redis-node2', port: 7001 },
  { host: 'redis-node3', port: 7002 },
  { host: 'redis-node4', port: 7003 },
  { host: 'redis-node5', port: 7004 },
  { host: 'redis-node6', port: 7005 },
], {
  redisOptions: {
    // password: 'your_password' // 如果有密碼
  },
  clusterRetryStrategy: (times) => {
    console.log(`Cluster retry attempt: ${times}`);
    return Math.min(times * 100, 3000);
  },
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
  slotsRefreshTimeout: 10000,
});

redisClient.on('error', (err) => {
  console.error('Redis Cluster Error:', err);
});

redisClient.on('connect', () => {
  console.log('Connected to Redis Cluster');
});

redisClient.on('ready', () => {
  console.log('Redis Cluster is ready');
});

redisClient.on('close', () => {
  console.log('Connection to Redis Cluster closed');
});

redisClient.on('reconnecting', () => {
  console.log('Reconnecting to Redis Cluster');
});

redisClient.on('end', () => {
  console.log('Redis Cluster connection ended');
});

redisClient.ping().then(() => {
  console.log('Successfully connected to Redis Cluster');
}).catch((err) => {
  console.error('Failed to connect to Redis Cluster:', err);
});

module.exports = redisClient;