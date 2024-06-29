const dbService = require('../services/dbService');
const redisService = require('../services/redisService');
const { getTimenow } = require('../time')

function formatTimestamp(seconds) {
    const date = new Date(seconds * 1000); // 将秒数转换为毫秒数
    const isoString = date.toISOString(); // 获取 ISO 8601 格式的字符串
    return isoString;
}

exports.createUser = async (username) => {
    const now = getTimenow()
    const result = await dbService.query(
        'INSERT INTO users(username, last_update) VALUES($1, to_timestamp($2)) RETURNING id, username, last_update',
        [username, now]
    );
    const user = result.rows[0];
    await redisService.updateSingleUserScore(user.id, 0, 0, 0, now);
    return user;
};

exports.stake = async (userId, apple, banana, kiwi) => {
    const now = getTimenow()
    const result = await redisService.updateSingleUserScore(userId, apple, banana, kiwi, now);
    return result;
};

exports.withdraw = async (userId, apple, banana, kiwi) => {
    const now = getTimenow()
    try {
        const result = await redisService.updateSingleUserScore(userId, -apple || 0, -banana || 0, -kiwi || 0, now);
        return result;
    } catch (err) {
        throw new Error('Insufficient assets');
    }
};

exports.getUserAssets = async (userId) => {
    const now = getTimenow()
    const result = await dbService.query('SELECT id, username FROM users WHERE id = $1', [userId]);
    const user = result.rows[0];
    if (!user) {
        throw new Error('User not found');
    }

    const redisData = await redisService.updateScoreAndGetRank(userId, now);

    return {
        ...user,
        last_update: formatTimestamp(now),
        ...redisData,
    };
};

exports.getLeaderboard = async (limit) => {
    const leaderboard = await redisService.zrevrange('user_scores', 0, limit - 1, 'WITHSCORES');

    // 提取所有用戶 ID
    const userIds = leaderboard.filter((_, index) => index % 2 === 0).map(item => item.split(':')[0]);

    // 一次性獲取所有用戶名
    const usernameResult = await dbService.query(
        'SELECT id, username FROM users WHERE id = ANY($1)',
        [userIds]
    );

    // 創建一個 userId 到 username 的映射
    const usernameMap = usernameResult.rows.reduce((map, user) => {
        map[user.id] = user.username;
        return map;
    }, {});

    const result = [];
    for (let i = 0; i < leaderboard.length; i += 2) {
        const [userId] = leaderboard[i].split(':');
        const score = parseFloat(leaderboard[i + 1]);
        const username = usernameMap[userId] || 'Unknown User';
        result.push({ rank: i / 2 + 1, userId, name: username, scores: score });
    }

    return result;
};
