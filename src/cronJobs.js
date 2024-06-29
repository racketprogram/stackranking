const cron = require('node-cron');
const redisService = require('./services/redisService');

let fiveSecondsTask;

// 导出定时任务的控制接口，以便在应用程序中手动启动和停止
module.exports = {
  start: () => {
    fiveSecondsTask = cron.schedule('*/30 * * * * *', async () => {
      try {
        const startTime = new Date();
        const updatedCount = await redisService.updateAllScores();
        const endTime = new Date();
        const elapsedTime = endTime - startTime;
        console.log(`Updated scores for ${updatedCount} users in ${elapsedTime} ms`);
      } catch (error) {
        console.error('Error updating scores:', error);
      }
    });

    console.log('Five seconds task started.');
  },
  stop: () => {
    if (fiveSecondsTask) {
      fiveSecondsTask.stop();
      console.log('Five seconds task stopped.');
    } else {
      console.log('Five seconds task is not running.');
    }
  },
};
