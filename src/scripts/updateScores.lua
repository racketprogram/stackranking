-- 計算分數的輔助函數
local function calculateScore(apple, banana, kiwi, timeDiff)
    return apple * 100 * timeDiff + banana * 20 * timeDiff + kiwi * 10 * timeDiff
end

-- 更新单个用户的分数
local function updateSingleUserScore(KEYS, ARGV)
    local USER_SCORES_SET = KEYS[1]
    local userId = ARGV[1]
    local finalApple = tonumber(ARGV[2])
    local finalBanana = tonumber(ARGV[3])
    local finalKiwi = tonumber(ARGV[4])
    local now = tonumber(ARGV[5])

    -- 獲取用戶當前的數據
    local userData = redis.call('HGET', USER_SCORES_SET .. ':data', userId)
    local currentScore, oldApple, oldBanana, oldKiwi, lastUpdate = 0, 0, 0, 0, now

    if userData then
        currentScore, oldApple, oldBanana, oldKiwi, lastUpdate = string.match(userData, "(%d+):(%d+),(%d+),(%d+),(%d+)")
        currentScore, oldApple, oldBanana, oldKiwi, lastUpdate = tonumber(currentScore), tonumber(oldApple), tonumber(oldBanana), tonumber(oldKiwi), tonumber(lastUpdate)
    end

    -- 計算舊水果的得分
    local timeDiff = now - lastUpdate
    local oldScore = calculateScore(oldApple, oldBanana, oldKiwi, timeDiff)

    -- 更新總分
    local newScore = currentScore + oldScore

    -- 創建新的用戶數據
    local newUserData = string.format("%d:%d,%d,%d,%d", newScore, finalApple, finalBanana, finalKiwi, now)

    -- 更新 sorted set，使用新的總分作為分數
    redis.call('ZADD', USER_SCORES_SET, newScore, userId)
    -- 更新用户数据
    redis.call('HSET', USER_SCORES_SET .. ':data', userId, newUserData)

    return newScore
end

-- 更新所有用戶的分數
local function updateAllScores(KEYS, ARGV)
    local USER_SCORES_SET = KEYS[1]
    local now = tonumber(ARGV[1])

    local cursor = "0"
    local count = 0

    repeat
        local result = redis.call("ZSCAN", USER_SCORES_SET, cursor, "COUNT", 1000)
        cursor = result[1]
        local members = result[2]
        
        for i = 1, #members, 2 do
            local userId = members[i]
            local userData = redis.call('HGET', USER_SCORES_SET .. ':data', userId)
            local currentScore, apple, banana, kiwi, lastUpdate = string.match(userData, "(%d+):(%d+),(%d+),(%d+),(%d+)")
            
            currentScore, apple, banana, kiwi, lastUpdate = tonumber(currentScore), tonumber(apple), tonumber(banana), tonumber(kiwi), tonumber(lastUpdate)
            
            local timeDiff = now - lastUpdate
            local newScore = currentScore + calculateScore(apple, banana, kiwi, timeDiff)
            
            local newUserData = string.format("%d:%d,%d,%d,%d", newScore, apple, banana, kiwi, now)
            
            redis.call('ZADD', USER_SCORES_SET, newScore, userId)
            redis.call('HSET', USER_SCORES_SET .. ':data', userId, newUserData)
            
            count = count + 1
        end
    until cursor == "0"

    return count
end


-- 更新分數並獲取排名，不改變水果數量
local function updateScoreAndGetRank(KEYS, ARGV)
    local USER_SCORES_SET = KEYS[1]
    local userId = ARGV[1]
    local now = tonumber(ARGV[2])

    -- 獲取用戶當前的數據
    local userData = redis.call('HGET', USER_SCORES_SET .. ':data', userId)
    if not userData then
        return {0, -1}  -- 如果用戶不存在，返回分數 0 和排名 -1
    end

    local currentScore, apple, banana, kiwi, lastUpdate = string.match(userData, "(%d+):(%d+),(%d+),(%d+),(%d+)")
    currentScore, apple, banana, kiwi, lastUpdate = tonumber(currentScore), tonumber(apple), tonumber(banana), tonumber(kiwi), tonumber(lastUpdate)

    -- 計算新的分數
    local timeDiff = now - lastUpdate
    local scoreIncrease = calculateScore(apple, banana, kiwi, timeDiff)
    local newScore = currentScore + scoreIncrease

    -- 更新用戶數據
    local newUserData = string.format("%d:%d,%d,%d,%d", newScore, apple, banana, kiwi, now)
    redis.call('ZADD', USER_SCORES_SET, newScore, userId)
    redis.call('HSET', USER_SCORES_SET .. ':data', userId, newUserData)

    -- 獲取更新後的排名
    local rank = redis.call('ZREVRANK', USER_SCORES_SET, userId)

    return {newScore, rank}
end


-- 根據傳入的參數決定執行哪個函數
if #ARGV == 1 then
    return updateAllScores(KEYS, ARGV)
elseif #ARGV == 5 then
    return updateSingleUserScore(KEYS, ARGV)
elseif #ARGV == 2 then
    return updateScoreAndGetRank(KEYS, ARGV)
else
    return redis.error_reply("Invalid number of arguments")
end
