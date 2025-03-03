const line = require('@line/bot-sdk');
const express = require('express');
const dotenv = require('dotenv');
const { initializeAgent, getResponse } = require('./agent.js');
const { summarizeResponse } = require('./summarize.js');
const axios = require('axios');
const { calculator } = require('./testcalculator.js');
const logger = require('./logbackup.js'); // Import the logger
dotenv.config();

const env = dotenv.config().parsed;
const app = express();

const lineConfig = {
    channelAccessToken: env.ACCESS_TOKEN,
    channelSecret: env.SECRET_TOKEN
};
const client = new line.Client(lineConfig);

let agents = {};

const getAgentForUser = async (userId) => {
    if (!agents[userId]) {
        agents[userId] = await initializeAgent();
    }
    return agents[userId];
};

app.post('/webhook', line.middleware(lineConfig), async (req, res) => {
    try {
        const events = req.body.events;
        logger.info(`Events received: ${JSON.stringify(events)}`);

        if (events && events.length > 0) {
            await Promise.all(events.map(async (event) => {
                await handleEvent(event);
            }));
        }

        res.status(200).send('OK');
    } catch (error) {
        logger.error(`Error processing events: ${error.message}`);
        res.status(500).end();
    }
});

async function sendLoadingAnimation(id) {
    const lineLoadingUrl = 'https://api.line.me/v2/bot/chat/loading/start';
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.ACCESS_TOKEN}`,
    };

    const body = {
        chatId: id,
        loadingSeconds: 60,
    };

    try {
        const response = await axios.post(lineLoadingUrl, body, { headers });
        if (response.status === 202) {
            logger.info('Loading animation request accepted. Waiting for processing.');
        } else {
            logger.warn(`Failed to send loading animation. Status code: ${response.status}`);
        }
    } catch (error) {
        logger.error(`Error sending loading animation: ${error.message}`);
    }
};

const handleEvent = async (event) => {
    if (event.type !== 'message' || event.message.type !== 'text') {
        return null;
    } else if (event.type === 'message') {
        const userQuery = event.message.text;
        const userId = event.source.userId;

        await sendLoadingAnimation(userId);

        try {
            const agent = await getAgentForUser(userId);
            logger.info("User Agent Success load.");
            const responseText = await getResponse(agent, userQuery);
            logger.info("responseText Success load.");
            const calculated = await calculator(responseText);
            logger.info("This is Total price found : " + calculated);
            const summaryResponse = await summarizeResponse(responseText, calculated);
            logger.info("summaryResponse Success load.");

            await client.replyMessage(event.replyToken, [{
                type: 'text',
                text: summaryResponse,
            }]);
        } catch (error) {
            logger.error(`Error getting or processing response for userId: ${userId}, error: ${error.message}`);
            await client.replyMessage(event.replyToken, {
                type: 'text',
                text: 'An error occurred while processing your request.'
            });
        }
    }
};

app.listen(8000, () => {
    logger.info("----------------------------------------");
    logger.info('Server started and listening on port 8000');
    logger.info("----------------------------------------");
});
