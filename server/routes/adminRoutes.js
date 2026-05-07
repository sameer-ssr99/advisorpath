const router = require('express').Router();
const c = require('../controllers/adminController');
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');

router.get('/dashboard', auth, roleGuard('admin'), c.dashboard);
router.put('/users/:id/active', auth, roleGuard('admin'), c.toggleUser);
router.get('/requirements', auth, roleGuard('admin'), c.getRequirements);
router.put('/requirements', auth, roleGuard('admin'), c.upsertRequirement);

module.exports = router;
