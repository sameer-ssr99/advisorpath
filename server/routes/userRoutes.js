const express = require('express');
const router = express.Router();
const { getUsers, getUser, getMyStudents, updateUserRole, updateCompletedCourses } = require('../controllers/userController');
const { verifyToken } = require('../middleware/auth');
const { checkRole } = require('../middleware/roleGuard');

router.use(verifyToken);

router.get('/', checkRole(['admin']), getUsers);
router.get('/my-students', checkRole(['advisor', 'admin']), getMyStudents);
router.get('/:id', checkRole(['admin', 'advisor']), getUser);
router.put('/:id/role', checkRole(['admin']), updateUserRole);
router.put('/:id/completed-courses', updateCompletedCourses);

module.exports = router;
