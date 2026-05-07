const express = require('express');
const router = express.Router();
const { getSessions, createSession, updateSessionStatus } = require('../controllers/sessionController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

router.get('/', getSessions);
router.post('/', createSession);
router.patch('/:id/status', updateSessionStatus);

module.exports = router;
