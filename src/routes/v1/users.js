const express = require('express');

const router = express.Router();

router.get('/check_can_post', (req, res) => {
    const result = {
        success: 1
    };

    res.json(result);
});

module.exports = router;