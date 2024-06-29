const redisClient = require('../config/redis');
const fs = require('fs');
const path = require('path');

const updateScoresScript = fs.readFileSync(path.join(__dirname, '../scripts/updateScores.lua'), 'utf8');

module.exports = {
  zrevrange: (key, start, stop, withScores) => redisClient.zrevrange(key, start, stop, withScores),
  zscore: (key, member) => redisClient.zscore(key, member),

  updateAllScores: async (now) => {
    const sha1 = await redisClient.script('LOAD', updateScoresScript);
    return redisClient.evalsha(sha1, 1, 'user_scores', now);
  },

  updateSingleUserScore: async (userId, xApple, xBanana, xKiwi, now) => {
    const sha1 = await redisClient.script('LOAD', updateScoresScript);
    const [score, apple, banana, kiwi] = await redisClient.evalsha(sha1, 1, 'user_scores', userId, xApple, xBanana, xKiwi, now);
    return { score, apple, banana, kiwi }
  },

  updateScoreAndGetRank: async (userId, now) => {
    const sha1 = await redisClient.script('LOAD', updateScoresScript);
    let [score, rank, apple, banana, kiwi] = await redisClient.evalsha(sha1, 1, 'user_scores', userId, now);
    rank = rank !== null ? rank + 1 : -1; // 加1使排名從1開始
    return { score, rank, apple, banana, kiwi };
  },
};
