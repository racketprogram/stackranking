const axios = require('axios');
const { expect } = require('chai');

const API_URL = 'http://localhost:3000/api'; // 替换为你的API地址

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

describe('Staking Points API Tests', function () {
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

    it('should get user assets', async () => {
        const response = await axios.get(`${API_URL}/user/${userId}/assets`);

        // console.log("userId: ", userId)
        // console.log("score: ", response.data.score)
        // console.log("rank: ", response.data.rank)
        expect(response.status).to.equal(200);
        expect(response.data).to.have.property('apple', 1);
        expect(response.data).to.have.property('banana', 0);
        expect(response.data).to.have.property('kiwi', 0);
        expect(response.data).to.have.property('score');
        expect(response.data).to.have.property('rank');
    });

      it('should get leaderboard', async () => {
        const response = await axios.get(`${API_URL}/leaderboard?limit=300`);

        // for (const d of response.data) {
        //     console.log(d.rank, d.userId, d.scores)
        // }
        
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

      it('should fail when withdrawing more than available', async () => {
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
