const router = require('express').Router();
const c = require('../controllers/progressController');
const auth = require('../middleware/auth');

router.get('/student/:id', auth, c.getStudentProgress);

module.exports = router;
