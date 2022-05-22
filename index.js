const express = require('express');
const cors = require('cors');
const axios = require('axios');
const Redis = require('redis');

const redisClient = Redis.createClient("redis://127.0.0.1:6379");

redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisClient.connect();

const DEFAULT_EXPIRATION = 3600;

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Its working');
})


app.get("/photos", async (req, res) => {
    const albumId = req.query.albumId;

    const cacheData = await redisClient.get(`photos?albumId=${albumId}`, (error, photos) => {
        if (error) console.error(error);
        if (photos != null) {
            console.log('Cache Hit');
            return photos;
        }
    })

    if (cacheData) {
        console.log('Cache Hit');
        return res.json(JSON.parse(cacheData));
    } else {
        console.log('Cache Miss');
        const {data} = await axios.get(`https://jsonplaceholder.typicode.com/photos`,{
            params: {albumId: albumId}
        });
        await redisClient.setEx(`photos?albumId=${albumId}`, DEFAULT_EXPIRATION, JSON.stringify(data));
        return res.send(data);
    }

})

app.listen(8080, () => {
    console.log('Server is running on port 8080');
})