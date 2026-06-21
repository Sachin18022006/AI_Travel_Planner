const express = require('express');
const {
  createTrip,
  getTrips,
  getTripById,
  updateTrip,
  regenerateTripDay,
  deleteTrip
} = require('../controllers/tripController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();


router.use(requireAuth);

router.route('/').get(getTrips).post(createTrip);

router.route('/:id').get(getTripById).put(updateTrip).delete(deleteTrip);

router.post('/:id/days/:dayNumber/regenerate', regenerateTripDay);

module.exports = router;
