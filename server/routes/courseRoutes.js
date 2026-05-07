const express = require('express');
const router = express.Router();
const { getCourses, getCourse, createCourse, updateCourse, deleteCourse, getCoursePrereqChain } = require('../controllers/courseController');
const { verifyToken } = require('../middleware/auth');
const { checkRole } = require('../middleware/roleGuard');

router.use(verifyToken);

router.get('/', getCourses);
router.post('/', checkRole(['admin']), createCourse);

router.get('/:id', getCourse);
router.put('/:id', checkRole(['admin']), updateCourse);
router.delete('/:id', checkRole(['admin']), deleteCourse);

router.get('/:id/prereq-chain', getCoursePrereqChain);

module.exports = router;
