const express = require('express');
const userController = require('../controllers/userController');

const router = express.Router();

router.post('/register', userController.register);
router.post('/user/:userId/stake', userController.stake);
router.post('/user/:userId/withdraw', userController.withdraw);
router.get('/user/:userId/assets', userController.getUserAssets);
router.get('/leaderboard', userController.getLeaderboard);

module.exports = router;
