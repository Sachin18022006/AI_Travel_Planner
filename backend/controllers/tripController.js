const Trip = require('../models/Trip');
const asyncHandler = require('../utils/asyncHandler');
const { generateItinerary, regenerateDay } = require('../utils/aiAgent');
const TIME_OF_DAY_VALUES = ['Morning', 'Afternoon', 'Evening'];
const PACKING_CATEGORY_VALUES = ['Documents', 'Clothing', 'Gear', 'Other'];

const titleCase = (s) =>
  typeof s === 'string' && s.length ? s[0].toUpperCase() + s.slice(1).toLowerCase() : s;


function normalizeDay(day, fallbackDayNumber) {
  return {
    dayNumber: Number(day.dayNumber) || fallbackDayNumber,
    theme: day.theme || '',
    activities: (day.activities || []).map((act) => {
      const time = titleCase(act.timeOfDay);
      return {
        title: act.title || 'Activity',
        description: act.description || '',
        estimatedCostUSD: Number(act.estimatedCostUSD) || 0,
        timeOfDay: TIME_OF_DAY_VALUES.includes(time) ? time : 'Morning'
      };
    })
  };
}

function normalizePackingList(packingList) {
  return (packingList || []).map((p) => {
    const cat = titleCase(p.category);
    return {
      item: p.item || 'Item',
      category: PACKING_CATEGORY_VALUES.includes(cat) ? cat : 'Other',
      isPacked: false
    };
  });
}


const createTrip = asyncHandler(async (req, res) => {
  const { destination, durationDays, budgetTier, interests, travelMonth } = req.body;

  if (!destination || !durationDays || !budgetTier) {
    return res.status(400).json({ message: 'destination, durationDays, and budgetTier are required.' });
  }
  if (durationDays < 1 || durationDays > 60) {
    return res.status(400).json({ message: 'durationDays must be between 1 and 60.' });
  }

  const aiResult = await generateItinerary({
    destination,
    durationDays: Number(durationDays),
    budgetTier,
    interests: Array.isArray(interests) ? interests : [],
    travelMonth
  });

  const normalizedItinerary = (aiResult.itinerary || []).map((day, idx) => normalizeDay(day, idx + 1));
  const normalizedPackingList = normalizePackingList(aiResult.packingList);

  const trip = await Trip.create({
    userId: req.user.id,
    destination,
    durationDays,
    budgetTier,
    interests: Array.isArray(interests) ? interests : [],
    travelMonth: travelMonth || '',
    itinerary: normalizedItinerary,
    hotels: aiResult.hotels,
    estimatedBudget: aiResult.estimatedBudget,
    packingList: normalizedPackingList,
    status: 'ready'
  });

  res.status(201).json(trip);
});


const getTrips = asyncHandler(async (req, res) => {
  const trips = await Trip.find({ userId: req.user.id }).sort({ createdAt: -1 });
  res.json(trips);
});


const getTripById = asyncHandler(async (req, res) => {
  const trip = await Trip.findOne({ _id: req.params.id, userId: req.user.id });
  if (!trip) {
    return res.status(404).json({ message: 'Trip not found.' });
  }
  res.json(trip);
});


const updateTrip = asyncHandler(async (req, res) => {
  const allowedFields = ['itinerary', 'packingList', 'hotels', 'estimatedBudget', 'destination', 'interests'];
  const updates = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }

  const trip = await Trip.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id },
    { $set: updates },
    { new: true, runValidators: true }
  );

  if (!trip) {
    return res.status(404).json({ message: 'Trip not found.' });
  }
  res.json(trip);
});


const regenerateTripDay = asyncHandler(async (req, res) => {
  const { instruction } = req.body;
  const dayNumber = Number(req.params.dayNumber);

  if (!instruction || !instruction.trim()) {
    return res.status(400).json({ message: 'An instruction is required to regenerate a day.' });
  }

  const trip = await Trip.findOne({ _id: req.params.id, userId: req.user.id });
  if (!trip) {
    return res.status(404).json({ message: 'Trip not found.' });
  }

  const existingDay = trip.itinerary.find((d) => d.dayNumber === dayNumber);
  if (!existingDay) {
    return res.status(404).json({ message: `Day ${dayNumber} not found on this trip.` });
  }

  const newDay = await regenerateDay({
    destination: trip.destination,
    budgetTier: trip.budgetTier,
    interests: trip.interests,
    dayNumber,
    instruction,
    existingDay
  });

  trip.itinerary = trip.itinerary.map((d) =>
    d.dayNumber === dayNumber ? normalizeDay(newDay, dayNumber) : d
  );
  await trip.save();

  res.json(trip);
});


const deleteTrip = asyncHandler(async (req, res) => {
  const trip = await Trip.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
  if (!trip) {
    return res.status(404).json({ message: 'Trip not found.' });
  }
  res.json({ message: 'Trip deleted.' });
});

module.exports = {
  createTrip,
  getTrips,
  getTripById,
  updateTrip,
  regenerateTripDay,
  deleteTrip
};