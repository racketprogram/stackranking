const dbService = require('../services/dbService');
const redisService = require('../services/redisService');

exports.createUser = async (username) => {
    const result = await dbService.query(
        'INSERT INTO users(username, apple, banana, kiwi, last_update) VALUES($1, 0, 0, 0, NOW()) RETURNING id, username, apple, banana, kiwi, last_update',
        [username]
    );
    const user = result.rows[0];
    await redisService.updateSingleUserScore(user.id, user.apple, user.banana, user.kiwi);
    return user;
};

exports.stake = async (userId, apple, banana, kiwi) => {
    const result = await dbService.query(
        'UPDATE users SET apple = apple + $2, banana = banana + $3, kiwi = kiwi + $4, last_update = NOW() WHERE id = $1 RETURNING *',
        [userId, apple || 0, banana || 0, kiwi || 0]
    );
    const user = result.rows[0];
    await redisService.updateSingleUserScore(user.id, user.apple, user.banana, user.kiwi);
    return user;
};

exports.withdraw = async (userId, apple, banana, kiwi) => {
    const result = await dbService.query(
        'UPDATE users SET apple = apple - $2, banana = banana - $3, kiwi = kiwi - $4, last_update = NOW() WHERE id = $1 AND apple >= $2 AND banana >= $3 AND kiwi >= $4 RETURNING *',
        [userId, apple || 0, banana || 0, kiwi || 0]
    );
    if (result.rows.length === 0) {
        throw new Error('Insufficient assets');
    }
    const user = result.rows[0];
    await redisService.updateSingleUserScore(user.id, user.apple, user.banana, user.kiwi);
    return user;
};

exports.getUserAssets = async (userId) => {
    const result = await dbService.query('SELECT * FROM users WHERE id = $1', [userId]);
    const user = result.rows[0];
    if (!user) {
        throw new Error('User not found');
    }

    const redisData = await redisService.updateScoreAndGetRank(userId);

    return {
        ...user,
        score: redisData.score,
        rank: redisData.rank
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
        result.push({ userId, username, score });
    }

    return result;
};