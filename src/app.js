const express = require('express');
const morgan = require('morgan');
const userRoutes = require('./routes/userRoutes');
const cronJobs = require('./cronJobs'); // 导入定时任务模块

const app = express();

// 使用 morgan 中间件记录日志
app.use(morgan('dev'));

app.use(express.json());
app.use('/api', userRoutes);

// 启动每分钟的定时任务
cronJobs.start();

// 可选：在应用程序关闭时停止定时任务
process.on('SIGINT', () => {
  cronJobs.stop();
  process.exit();
});

module.exports = app;
