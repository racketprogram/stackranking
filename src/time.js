exports.getTimenow = function () {
    const currentTimeMillis = Date.now(); // 獲取當前時間的毫秒級別時間戳
    const currentTimeSeconds = Math.floor(currentTimeMillis / 1000); // 將毫秒級別時間戳轉換為秒級別時間戳
    return currentTimeSeconds
}
