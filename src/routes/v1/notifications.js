const express = require('express');

const router = express.Router();

router.get('/notifications', (req, res) => {
    const result = {
        "success": 1,
        "admin_message": {
            "unread_count": 0
        },
        "mission": {
            "unread_count": 0
        },
        "news": {
            "unread_count": 0
        },
        "message": {
            "unread_count": 1
        }
    };

    res.json(result);
});

module.exports = router;