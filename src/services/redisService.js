const redisClients = require('../config/redis');
const fs = require('fs');
const path = require('path');

const updateScoresScript = fs.readFileSync(path.join(__dirname, '../scripts/updateScores.lua'), 'utf8');

// 函數：為單個 Redis 客戶端加載腳本
async function loadScriptForClient(client) {
  try {
    const sha1 = await client.script('LOAD', updateScoresScript);
    client.scriptSHA1 = sha1;
  } catch (error) {
    console.error('Error loading script for client:', error);
    throw error
  }
}

// 為所有 Redis 客戶端加載腳本
async function loadScriptsForAllClients() {
  const loadPromises = redisClients.map(loadScriptForClient);
  await Promise.all(loadPromises);
  console.log('Scripts loaded for all Redis clients');
}

// 在模塊初始化時加載腳本
loadScriptsForAllClients();

const SHARD_COUNT = 10;

// 輔助函數：獲取分片 key 和對應的 Redis 客戶端
function getShardInfo(userId) {
  const shardIndex = userId % SHARD_COUNT;
  return {
    shardKey: `user_scores:${shardIndex}`,
    client: redisClients[shardIndex]
  };
}

module.exports = {
  zrevrange: async (userId, start, stop, withScores) => {
    const { shardKey, client } = getShardInfo(userId);
    return client.zrevrange(shardKey, start, stop, withScores);
  },

  zscore: async (userId, member) => {
    const { shardKey, client } = getShardInfo(userId);
    return client.zscore(shardKey, member);
  },

  updateAllScores: async (now) => {
    const updatePromises = Array.from({ length: SHARD_COUNT }, (_, i) => {
      const shardKey = `user_scores:${i}`;
      const client = redisClients[i];
      return client.evalsha(client.scriptSHA1, 1, shardKey, now);
    });

    const results = await Promise.all(updatePromises);

    const totalCount = results.reduce((sum, count) => sum + count, 0);

    return totalCount;
  },

  updateSingleUserScore: async (userId, xApple, xBanana, xKiwi, now) => {
    const { shardKey, client } = getShardInfo(userId);
    const [score, apple, banana, kiwi] = await client.evalsha(client.scriptSHA1, 1, shardKey, userId, xApple, xBanana, xKiwi, now);
    return { score, apple, banana, kiwi };
  },

  updateScoreAndGetRank: async (userId, now) => {
    const { shardKey, client } = getShardInfo(userId);
    let [score, rank, apple, banana, kiwi] = await client.evalsha(client.scriptSHA1, 1, shardKey, userId, now);
    rank = rank !== null ? rank + 1 : -1; // 加1使排名從1開始
    return { score, rank, apple, banana, kiwi };
  },

  // 获取所有分片的前 limit 个成员并合并排序
  zrevrangeAcrossShards: async (limit, withScores) => {
    const shardKeys = Array.from({ length: SHARD_COUNT }, (_, i) => `user_scores:${i}`);
    const promises = shardKeys.map((shardKey, i) => redisClients[i].zrevrange(shardKey, 0, limit - 1, 'WITHSCORES'));
    const results = await Promise.all(promises);

    // 合併結果並轉換為 [userId, score] 對
    let combinedResults = [];
    results.forEach(result => {
      for (let i = 0; i < result.length; i += 2) {
        combinedResults.push([result[i], parseFloat(result[i + 1])]);
      }
    });

    // 根據分數排序
    combinedResults.sort((a, b) => b[1] - a[1]);

    // 只保留前 limit 個結果
    combinedResults = combinedResults.slice(0, limit);

    // 將結果轉換回原始格式
    const finalResult = [];
    combinedResults.forEach(([userId, score]) => {
      finalResult.push(userId);
      finalResult.push(score.toString()); // 將分數轉回字符串
    });

    return finalResult;
  }
};
