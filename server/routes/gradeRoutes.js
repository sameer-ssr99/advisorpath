const router = require('express').Router();
const c = require('../controllers/gradeController');
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');

router.get('/student/:id', auth, c.getStudentGrades);
router.post('/', auth, roleGuard('advisor', 'admin'), c.createGrade);
router.put('/:id', auth, roleGuard('advisor', 'admin'), c.updateGrade);

module.exports = router;
