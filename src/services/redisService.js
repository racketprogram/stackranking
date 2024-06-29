const redisClient = require('../config/redis');
const fs = require('fs');
const path = require('path');

const updateScoresScript = fs.readFileSync(path.join(__dirname, '../scripts/updateScores.lua'), 'utf8');

module.exports = {
  zrevrange: (key, start, stop, withScores) => redisClient.zrevrange(key, start, stop, withScores),
  zscore: (key, member) => redisClient.zscore(key, member),
  
  updateAllScores: async () => {
    const sha1 = await redisClient.script('LOAD', updateScoresScript);
    return redisClient.evalsha(sha1, 1, 'user_scores', Date.now());
  },

  updateSingleUserScore: async (userId, apple, banana, kiwi) => {
    const sha1 = await redisClient.script('LOAD', updateScoresScript);
    return redisClient.evalsha(sha1, 1, 'user_scores', userId, apple, banana, kiwi, Date.now());
  },

  updateScoreAndGetRank: async (userId) => {
    const sha1 = await redisClient.script('LOAD', updateScoresScript);
    const results = await redisClient.evalsha(sha1, 1, 'user_scores', userId, Date.now());
    
    const score = results[0];
    const rank = results[1] !== null ? results[1] + 1 : -1; // 加1使排名從1開始
  
    return { score, rank };
  },
};
