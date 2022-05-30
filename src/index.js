const express = require('express');
const axios = require('axios');
const { createClient } = require('redis');
const responseTime = require('response-time');

const client = createClient({
    host: "127.0.0.1",
    port: 6379
});

client.on("error", function (err) {
    console.error("Error encountered: ", err);
});

client.on("connect", () => {
    console.log("Redis connected");
});

const app = express();

app.use(responseTime());

app.get("/character", async (req, res) => {
    try {
        const reply = await client.get("characters");

        if (reply) {
            return res.json(JSON.parse(reply));
        }

        const response = await axios.get("https://rickandmortyapi.com/api/character");

        await client.set('characters', JSON.stringify(response.data));

        res.json(response.data);
    } catch (error) {
        return res.status(error.response.status).json({ message: error.message });
    }
});

app.get('/character/:id', async (req, res) => {
    try {
        const reply = await client.get(req.originalUrl);

        if (reply) return res.json(JSON.parse(reply));

        const response = await axios.get(
            `https://rickandmortyapi.com/api/character/${req.params.id}`
        );

        await client.set(req.originalUrl, JSON.stringify(response.data));

        return res.json(response.data);
    } catch (error) {
        return res.status(error.response.code).json({ message: error.message });
    }
});

async function main() {
    await client.connect();
    app.listen(3000);

    console.log('Server on port 3000');
}

main();