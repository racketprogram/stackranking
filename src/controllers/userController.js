const userModel = require('../models/userModel');

exports.register = async (req, res) => {
  try {
    const { username } = req.body;
    const user = await userModel.createUser(username);
    res.status(201).json(user);
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: error.message });
  }
};

exports.stake = async (req, res) => {
  try {
    const { userId } = req.params;
    const { apple, banana, kiwi } = req.body;
    const result = await userModel.stake(userId, apple, banana, kiwi);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.withdraw = async (req, res) => {
  try {
    const { userId } = req.params;
    const { apple, banana, kiwi } = req.body;
    const result = await userModel.withdraw(userId, apple, banana, kiwi);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUserAssets = async (req, res) => {
  try {
    const { userId } = req.params;
    const assets = await userModel.getUserAssets(userId);
    res.json(assets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getLeaderboard = async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    const leaderboard = await userModel.getLeaderboard(parseInt(limit));
    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
