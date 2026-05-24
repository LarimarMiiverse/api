const express = require('express');

const router = express.Router();

const notifications = require('./v1/notifications');
const users = require('./v1/users');

router.use('/notifications', notifications);
router.use('/users', users);

module.exports = router;