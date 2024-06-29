const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

// Function to generate a random integer between 0 and max (inclusive)
const getRandomInt = (max) => {
    return Math.floor(Math.random() * (max + 1));
};

const createUsersAndStake = async () => {
    try {
        // Array to store all concurrent requests
        const requests = [];

        for (let i = 1; i <= 1000000; i++) {
            // Register new user
            const username = `testuser_${Date.now()}_${i}`;
            async function run() {
                try {
                    const registerResponse = await axios.post(`${API_URL}/register`, { username })
                    if (registerResponse.status === 201) {
                        const userId = registerResponse.data.id;

                        // Stake assets for the user
                        const apple = getRandomInt(100); // Random number between 0 and 100
                        const banana = getRandomInt(100); // Random number between 0 and 100
                        const kiwi = getRandomInt(100); // Random number between 0 and 100

                        await axios.post(`${API_URL}/user/${userId}/stake`, {
                            apple,
                            banana,
                            kiwi
                        });
                        console.log(`User ${username} (ID: ${userId}) created and assets staked.`);
                    }
                } catch (err) {
                    console.error(err)
                }
            }

            requests.push(run());

            // Limit concurrent requests to 100 for better performance
            if (requests.length >= 100) {
                await Promise.all(requests); // Wait for the current batch to complete
                requests.length = 0; // Clear the array
            }
        }
        console.log('All users registered and assets staked.');
    } catch (error) {
        console.error('Error occurred:', error.message);
    }
};

createUsersAndStake();
