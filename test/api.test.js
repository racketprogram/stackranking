const axios = require('axios');
const { expect } = require('chai');

const API_URL = 'http://localhost:3000/api';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function calculateScore(apple, banana, kiwi, timeDiff) {
  return apple * 100 * timeDiff + banana * 20 * timeDiff + kiwi * 10 * timeDiff;
}

describe('Staking Points API Tests - Part 1', function () {
  this.timeout(100000)
  let userId;

  it('should register a new user', async () => {
    const response = await axios.post(`${API_URL}/register`, {
      username: `testuser_${Date.now()}`
    });

    expect(response.status).to.equal(201);
    expect(response.data).to.have.property('id');
    expect(response.data).to.have.property('username');

    userId = response.data.id;
  });

  it('should stake assets for the user', async () => {
    const response = await axios.post(`${API_URL}/user/${userId}/stake`, {
      apple: 1,
      banana: 0,
      kiwi: 0
    });

    expect(response.status).to.equal(200);
    expect(response.data).to.have.property('apple', 1);
    expect(response.data).to.have.property('banana', 0);
    expect(response.data).to.have.property('kiwi', 0);
  });

  it('should get user assets and verify them', async () => {
    const response = await axios.get(`${API_URL}/user/${userId}/assets`);

    expect(response.status).to.equal(200);
    expect(response.data).to.have.property('apple', 1);
    expect(response.data).to.have.property('banana', 0);
    expect(response.data).to.have.property('kiwi', 0);
    expect(response.data).to.have.property('score');
    expect(response.data).to.have.property('rank');
  });

  it('should retrieve the leaderboard', async () => {
    const response = await axios.get(`${API_URL}/leaderboard?limit=300`);

    expect(response.status).to.equal(200);
    expect(response.data).to.be.an('array');
    expect(response.data.length).to.be.at.most(300);
    expect(response.data[0]).to.have.all.keys('rank', 'userId', 'name', 'scores');
  });

  it('should withdraw assets for the user', async () => {
    const response = await axios.post(`${API_URL}/user/${userId}/withdraw`, {
      apple: 1,
      banana: 0,
      kiwi: 0
    });

    expect(response.status).to.equal(200);
    expect(response.data).to.have.property('apple', 0);
    expect(response.data).to.have.property('banana', 0);
    expect(response.data).to.have.property('kiwi', 0);
  });

  it('should fail when trying to withdraw more assets than available', async () => {
    try {
      await axios.post(`${API_URL}/user/${userId}/withdraw`, {
        apple: 10,
        banana: 10,
        kiwi: 10
      });
    } catch (error) {
      expect(error.response.status).to.equal(500);
      expect(error.response.data).to.have.property('error', 'Insufficient assets');
    }
  });
});

describe('Staking Points API Tests - Part 2', function () {
  this.timeout(100000)
  let userId;

  it('should register a new user', async () => {
    const response = await axios.post(`${API_URL}/register`, {
      username: `testuser_${Date.now()}`
    });

    expect(response.status).to.equal(201);
    expect(response.data).to.have.property('id');
    expect(response.data).to.have.property('username');

    userId = response.data.id;
  });

  it('should stake more assets and check score after 10 seconds', async () => {
    // Stake more assets
    const stakeResponse = await axios.post(`${API_URL}/user/${userId}/stake`, {
      apple: 1,
      banana: 0,
      kiwi: 1
    });

    expect(stakeResponse.status).to.equal(200);
    expect(stakeResponse.data).to.have.property('apple', 1);
    expect(stakeResponse.data).to.have.property('banana', 0);
    expect(stakeResponse.data).to.have.property('kiwi', 1);

    await sleep(2 * 1000)

    // Check the score
    const assetsResponse = await axios.get(`${API_URL}/user/${userId}/assets`);

    expect(assetsResponse.status).to.equal(200);
    expect(assetsResponse.data).to.have.property('apple', 1);
    expect(assetsResponse.data).to.have.property('banana', 0);
    expect(assetsResponse.data).to.have.property('kiwi', 1);
    expect(assetsResponse.data).to.have.property('score');
    expect(assetsResponse.data.score).to.be.at.least(calculateScore(1, 0, 1, 2));
    expect(assetsResponse.data).to.have.property('rank');
  });
});


describe('Staking Points API Tests - Part 3', function () {
  this.timeout(100000)
  let userId;

  it('should register a new user', async () => {
    const response = await axios.post(`${API_URL}/register`, {
      username: `testuser_${Date.now()}`
    });

    expect(response.status).to.equal(201);
    expect(response.data).to.have.property('id');
    expect(response.data).to.have.property('username');

    userId = response.data.id;
  });

  it('should stake, withdraw assets, and check score stability', async () => {
    // Stake more assets
    const stakeResponse = await axios.post(`${API_URL}/user/${userId}/stake`, {
      apple: 1,
      banana: 0,
      kiwi: 1
    });

    expect(stakeResponse.status).to.equal(200);
    expect(stakeResponse.data).to.have.property('apple', 1);
    expect(stakeResponse.data).to.have.property('banana', 0);
    expect(stakeResponse.data).to.have.property('kiwi', 1);

    await sleep(2 * 1000);

    // Withdraw all stakes
    const withdrawResponse = await axios.post(`${API_URL}/user/${userId}/withdraw`, {
      apple: 1,
      banana: 0,
      kiwi: 1
    });

    expect(withdrawResponse.status).to.equal(200);
    expect(withdrawResponse.data).to.have.property('apple', 0);
    expect(withdrawResponse.data).to.have.property('banana', 0);
    expect(withdrawResponse.data).to.have.property('kiwi', 0);

    // Check the score
    const assetsResponse = await axios.get(`${API_URL}/user/${userId}/assets`);
    expect(assetsResponse.status).to.equal(200);
    expect(assetsResponse.data).to.have.property('apple', 0);
    expect(assetsResponse.data).to.have.property('banana', 0);
    expect(assetsResponse.data).to.have.property('kiwi', 0);
    expect(assetsResponse.data).to.have.property('score');
    expect(assetsResponse.data).to.have.property('rank');
    let score = assetsResponse.data.score;

    // Ensure the score does not increase anymore
    await sleep(2 * 1000);
    {
      const assetsResponse = await axios.get(`${API_URL}/user/${userId}/assets`);
      expect(assetsResponse.status).to.equal(200);
      expect(assetsResponse.data).to.have.property('apple', 0);
      expect(assetsResponse.data).to.have.property('banana', 0);
      expect(assetsResponse.data).to.have.property('kiwi', 0);
      expect(assetsResponse.data).to.have.property('score');
      expect(assetsResponse.data).to.have.property('rank');
      expect(assetsResponse.data.score).to.equal(score);
    }
  });
});
