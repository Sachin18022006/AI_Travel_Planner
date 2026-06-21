const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    estimatedCostUSD: { type: Number, default: 0, min: 0 },
    timeOfDay: {
      type: String,
      enum: ['Morning', 'Afternoon', 'Evening'],
      default: 'Morning'
    }
  },
  { _id: true }
);

const DaySchema = new mongoose.Schema(
  {
    dayNumber: { type: Number, required: true },
    theme: { type: String, default: '' },
    activities: [ActivitySchema]
  },
  { _id: false }
);

const HotelSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    tier: { type: String, default: '' },
    estimatedCostNightUSD: { type: Number, default: 0 },
    rating: { type: String, default: '' },
    description: { type: String, default: '' }
  },
  { _id: false }
);

const PackingItemSchema = new mongoose.Schema(
  {
    item: { type: String, required: true },
    category: {
      type: String,
      enum: ['Documents', 'Clothing', 'Gear', 'Other'],
      default: 'Other'
    },
    isPacked: { type: Boolean, default: false }
  },
  { _id: true }
);

const TripSchema = new mongoose.Schema(
  {
    
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    destination: { type: String, required: true, trim: true },
    durationDays: { type: Number, required: true, min: 1, max: 60 },
    budgetTier: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      required: true
    },
    interests: [{ type: String }],
    travelMonth: { type: String, default: '' }, 
    itinerary: [DaySchema],
    hotels: [HotelSchema],
    estimatedBudget: {
      transport: { type: Number, default: 0 },
      accommodation: { type: Number, default: 0 },
      food: { type: Number, default: 0 },
      activities: { type: Number, default: 0 },
      total: { type: Number, default: 0 }
    },
    
    packingList: [PackingItemSchema],
    status: {
      type: String,
      enum: ['generating', 'ready', 'failed'],
      default: 'generating'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Trip', TripSchema);
