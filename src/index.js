const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const logger = require('./logger');
const { connectDB } = require('./database');

dotenv.config();

const app = express();

const routes = require('./routes');

app.use(express.json());

app.use(express.urlencoded({
  extended: true,
  limit: '1mb'
}));

app.use('/v1', routes);

app.listen(process.env.PORT, async () => {
  connectDB();
  logger.success(`Miiverse API started on port ${process.env.PORT}`);
});