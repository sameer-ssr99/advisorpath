const router = require('express').Router();
const c = require('../controllers/advisorController');
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');

router.get('/dashboard', auth, roleGuard('advisor', 'admin'), c.dashboard);

module.exports = router;
