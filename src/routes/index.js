const express = require('express');

const router = express.Router();

const people = require('./v1/people');
const users = require('./v1/users');
const topics = require('./v1/topics');

router.use('/people', people);
router.use('/users', users);
router.use('/topics', topics);

module.exports = router;