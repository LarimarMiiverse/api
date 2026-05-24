const express = require('express');

const router = express.Router();

router.get('/:user_id/notifications', (req, res) => {
    const { user_id } = req.params;

    const result = {
        "success": 1,
        "admin_message": {
            "unread_count": 2
        },
        "mission": {
            "unread_count": 2
        },
        "news": {
            "unread_count": 2
        },
        "message": {
            "unread_count": 2
        }
    };

    return res.status(200).json(result);
});

router.get('/check_can_post', (req, res) => {
    const { user_id } = req.query;

    if (user_id === req.user.id) {
        const result = {
            success: 1
        };
        return res.status(200).json(result);
    } else {
        return res.status(200).send();
    }
});

module.exports = router;