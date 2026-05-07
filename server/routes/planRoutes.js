const express = require('express');
const router = express.Router();
const { getPlans, getPlan, createPlan, updatePlan, deletePlan, validate, submitPlan, approvePlan, rejectPlan } = require('../controllers/planController');
const { verifyToken } = require('../middleware/auth');
const { checkRole } = require('../middleware/roleGuard');

router.use(verifyToken);

router.get('/', getPlans);
router.post('/', checkRole(['student']), createPlan);

router.get('/:id', getPlan);
router.put('/:id', checkRole(['student']), updatePlan);
router.delete('/:id', checkRole(['student']), deletePlan);

router.post('/:id/validate', validate);
router.post('/:id/submit', checkRole(['student']), submitPlan);
router.post('/:id/approve', checkRole(['advisor', 'admin']), approvePlan);
router.post('/:id/reject', checkRole(['advisor', 'admin']), rejectPlan);

module.exports = router;
