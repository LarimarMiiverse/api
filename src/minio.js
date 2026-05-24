const Minio = require('minio');
const dotenv = require('dotenv');
const logger = require('./logger');

dotenv.config();

const minioClient = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT,
    port: process.env.MINIO_PORT,
    useSSL: false,
    accessKey: process.env.MINIO_ACCESSKEY,
    secretKey: process.env.MINIO_SECRETKEY
});

(async () => {
    try {
        await minioClient.listBuckets();
        logger.success('MinIO connected!');
    } catch (err) {
        logger.error('MinIO connection error:', err.message);
    }
})();

module.exports = minioClient;