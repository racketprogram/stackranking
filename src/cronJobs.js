const cron = require('node-cron');
const redisService = require('./services/redisService');
const {getTimenow} = require('./time')

let task;

// 导出定时任务的控制接口，以便在应用程序中手动启动和停止
module.exports = {
  start: () => {
    task = cron.schedule('*/30 * * * * *', async () => {
      try {
        const startTime = new Date();
        const updatedCount = await redisService.updateAllScores(getTimenow());
        const endTime = new Date();
        const elapsedTime = endTime - startTime;
        console.log(`Updated scores for ${updatedCount} users in ${elapsedTime} ms`);
      } catch (error) {
        console.error('Error updating scores:', error);
      }
    });

    console.log('task started.');
  },
  stop: () => {
    if (task) {
      task.stop();
      console.log('task stopped.');
    } else {
      console.log('task is not running.');
    }
  },
};
