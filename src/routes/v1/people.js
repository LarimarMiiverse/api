const express = require('express');
const axios = require('axios');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const logger = require('../../logger');
const { pool } = require('../../database');
const minioClient = require('../../minio');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

/* CREATE ACCOUNT */
router.post('/', async (req, res) => {
    const { user_id, password, country } = req.body;

    const param_pack = req.headers['x-nintendo-parampack'];
    const service_token = req.headers['x-nintendo-servicetoken'];

    if (!user_id || !password) {
        return res.status(400).json({ success: 0, message: 'Missing required fields' });
    }

    if (!param_pack || !service_token) {
        return res.status(400).json({ success: 0, message: 'Missing required headers' });
    }

    try {
        const [rows] = await pool.query(
            'SELECT id FROM accounts WHERE user_id = ?',
            [user_id]
        );

        if (rows.length > 0) {
            return res.status(403).json({ success: 0, message: 'User already exists' });
        }

        const salt = crypto.randomBytes(8).toString('hex');
        const password_hash = await bcrypt.hash(password + salt, 10);

        const img_id = uuidv4();

        let mii_data;
        try {
            const response = await axios.get(
                `https://mii-unsecure.ariankordi.net/mii_data/${user_id}?api_id=1`
            );
            mii_data = response.data;
        } catch (error) {
            logger.error(`API Error: ${error.message}`);
            return res.status(500).json({ success: 0, message: 'External API Error' });
        }

        const expressions = [
            'normal','happy','surprised','puzzled',
            'frustrated','like','blink','smile'
        ];

        const base_url = `https://mii-unsecure.ariankordi.net/miis/image.png?nnid=${user_id}&api_id=1`;

        const uploaded_urls = {};

        await Promise.all(expressions.map(async (expression) => {
            try {
                const img_response = await axios.get(
                    `${base_url}&expression=${expression}`,
                    { responseType: 'arraybuffer' }
                );

                const buffer = Buffer.from(img_response.data);
                const file_name = `${img_id}_${expression}.png`;

                await minioClient.putObject(
                    'miis',
                    file_name,
                    buffer,
                    { 'Content-Type': 'image/png' }
                );

                uploaded_urls[expression] =
                    `https://cdn.olv.innoverse.club/olv/miis/${file_name}`;

            } catch (err) {
                logger.error(`Error expression ${expression}: ${err.message}`);
            }
        }));

        const mii_url = uploaded_urls.normal;

        const [result] = await pool.query(
            `INSERT INTO accounts (pid, user_id, password, screen_name, mii_url, country)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                mii_data.pid,
                user_id,
                password_hash,
                mii_data.name,
                mii_url,
                country
            ]
        );

        const new_account_id = result.insertId;

        if (req.platform === '3ds') {
            await pool.query(
                'UPDATE accounts SET service_token_3ds = ? WHERE user_id = ?',
                [service_token, user_id]
            );
        } else {
            await pool.query(
                'UPDATE accounts SET service_token_wiiu = ? WHERE user_id = ?',
                [service_token, user_id]
            );
        }

        logger.info(`New account created: ${user_id} + ID: ${new_account_id}`);
        return res.status(200).json({ success: 1 });

    } catch (error) {
        logger.error(`Database error: ${error.message}`);
        return res.status(500).json({ success: 0, message: 'Internal Server Error' });
    }
});


/* LOGIN */
router.post('/login', async (req, res) => {
    const { user_id, password } = req.body;

    const param_pack = req.headers['x-nintendo-parampack'];
    const service_token = req.headers['x-nintendo-servicetoken'];

    if (!user_id || !password) {
        return res.status(400).json({ success: 0, message: 'Missing User ID or password' });
    }

    if (!param_pack || !service_token) {
        return res.status(400).json({ success: 0, message: 'Missing required headers' });
    }

    try {
        const [rows] = await pool.query(
            'SELECT * FROM accounts WHERE user_id = ?',
            [user_id]
        );

        if (rows.length === 0) {
            return res.status(401).json({ success: 0, message: 'Invalid credentials' });
        }

        const user = rows[0];

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ success: 0, message: 'Invalid credentials' });
        }

        await pool.query(
            'UPDATE accounts SET param_pack = ? WHERE user_id = ?',
            [param_pack, user_id]
        );

        req.session.user = {
            pid: user.pid,
            user_id: user.user_id,
            screen_name: user.screen_name,
            mii_url: user.mii_url
        };

        return res.status(200).json({ success: 1 });

    } catch (error) {
        logger.error(`Login error: ${error.message}`);
        return res.status(500).json({ success: 0, message: 'Internal Server Error' });
    }
});

module.exports = router;