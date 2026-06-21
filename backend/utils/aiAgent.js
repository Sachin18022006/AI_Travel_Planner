const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const GEMINI_URL = (model) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;


async function withRetry(fn, retries = 4, delay = 1000) {
  try {
    return await fn();
  } catch (err) {
    if (retries <= 0) throw err;
    await new Promise((resolve) => setTimeout(resolve, delay));
    return withRetry(fn, retries - 1, delay * 2);
  }
}

async function callGemini(prompt) {
  const response = await fetch(GEMINI_URL(GEMINI_MODEL), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.8
      }
    })
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => '');
    const error = new Error(`Gemini API responded with status ${response.status}: ${errBody}`);
    error.statusCode = response.status === 429 ? 429 : 502;
    throw error;
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('Gemini API returned an empty or unexpected response.');
  }

  return JSON.parse(text);
}

function buildItineraryPrompt({ destination, durationDays, budgetTier, interests, travelMonth }) {
  return `
You are an expert travel planning agent. Create a realistic, structured day-by-day
travel plan for a ${durationDays}-day trip to "${destination}".

Traveler preferences:
- Budget tier: ${budgetTier} (Low = budget hostels/street food, Medium = 3-star comfort, High = premium/luxury)
- Interests: ${interests && interests.length ? interests.join(', ') : 'general sightseeing'}
- Approximate travel month: ${travelMonth || 'unspecified, assume a pleasant season'}

Return ONLY a single valid JSON object (no markdown, no commentary) with EXACTLY this shape:
{
  "itinerary": [
    {
      "dayNumber": 1,
      "theme": "Short theme for the day, e.g. 'Old Town & Local Flavors'",
      "activities": [
        { "title": "Activity name", "description": "1-2 sentence description", "estimatedCostUSD": 20, "timeOfDay": "Morning" }
      ]
    }
  ],
  "hotels": [
    { "name": "Hotel name", "tier": "Budget Friendly | Mid Range | Luxury", "estimatedCostNightUSD": 85, "rating": "4.5/5", "description": "1 sentence why it fits" }
  ],
  "estimatedBudget": {
    "transport": 120,
    "accommodation": 300,
    "food": 150,
    "activities": 100,
    "total": 670
  },
  "packingList": [
    { "item": "Passport", "category": "Documents" },
    { "item": "Rain jacket", "category": "Clothing" }
  ]
}

Rules:
- Produce exactly ${durationDays} day objects, dayNumber starting at 1.
- Each day should have 2-4 activities matching the traveler's interests.
- estimatedBudget.total must equal the sum of the four category values.
- hotels must contain exactly 3 options spanning Budget Friendly, Mid Range, and Luxury.
- packingList must reflect both the activities planned AND the likely climate of
  ${destination} during ${travelMonth || 'the trip'} — this is critical, it powers
  our Weather-Aware Packing Assistant feature. Include a "Documents" category item
  for "Passport / ID" and at least one "Gear" item if any outdoor/adventure activity
  is present. Provide 8-14 items total.
- All costs must be realistic numbers (not placeholders) appropriate for the ${budgetTier} tier.
- Do not include any text outside the JSON object.
`.trim();
}

function buildRegenerateDayPrompt({ destination, budgetTier, interests, dayNumber, instruction, existingDay }) {
  return `
You are revising a single day of an existing travel itinerary for a trip to "${destination}"
(budget tier: ${budgetTier}, traveler interests: ${interests && interests.length ? interests.join(', ') : 'general sightseeing'}).

The current plan for Day ${dayNumber} is:
${JSON.stringify(existingDay)}

The traveler's instruction for how to change this day is:
"${instruction}"

Return ONLY a single valid JSON object (no markdown, no commentary) with EXACTLY this shape,
replacing Day ${dayNumber} according to the instruction while keeping costs realistic for the
${budgetTier} budget tier:
{
  "dayNumber": ${dayNumber},
  "theme": "Short theme for the revised day",
  "activities": [
    { "title": "Activity name", "description": "1-2 sentence description", "estimatedCostUSD": 20, "timeOfDay": "Morning" }
  ]
}
Produce 2-4 activities. Do not include any text outside the JSON object.
`.trim();
}


function buildMockItinerary({ destination, durationDays, budgetTier, interests, travelMonth }) {
  const tierCosts = { Low: 1, Medium: 1.8, High: 3.2 };
  const multiplier = tierCosts[budgetTier] || 1.8;
  const days = Array.from({ length: durationDays }, (_, i) => ({
    dayNumber: i + 1,
    theme: `Exploring ${destination} — Day ${i + 1}`,
    activities: [
      {
        title: `Discover a landmark in ${destination}`,
        description: `A guided walk through a highlight area suited to ${interests?.[0] || 'sightseeing'}.`,
        estimatedCostUSD: Math.round(15 * multiplier),
        timeOfDay: 'Morning'
      },
      {
        title: `Local cuisine experience`,
        description: `Sample regional dishes at a well-reviewed spot near the day's activities.`,
        estimatedCostUSD: Math.round(20 * multiplier),
        timeOfDay: 'Afternoon'
      },
      {
        title: `Evening leisure time`,
        description: `Relax, shop, or enjoy nightlife depending on your interests.`,
        estimatedCostUSD: Math.round(10 * multiplier),
        timeOfDay: 'Evening'
      }
    ]
  }));

  const accommodation = Math.round(60 * multiplier * durationDays);
  const food = Math.round(35 * multiplier * durationDays);
  const activities = Math.round(25 * multiplier * durationDays);
  const transport = Math.round(80 * multiplier);

  return {
    itinerary: days,
    hotels: [
      { name: `${destination} Budget Inn`, tier: 'Budget Friendly', estimatedCostNightUSD: Math.round(35 * multiplier), rating: '4.1/5', description: 'Clean, simple, well located.' },
      { name: `${destination} Central Hotel`, tier: 'Mid Range', estimatedCostNightUSD: Math.round(75 * multiplier), rating: '4.5/5', description: 'Great balance of comfort and price.' },
      { name: `${destination} Grand Resort`, tier: 'Luxury', estimatedCostNightUSD: Math.round(180 * multiplier), rating: '4.8/5', description: 'Premium amenities and service.' }
    ],
    estimatedBudget: {
      transport,
      accommodation,
      food,
      activities,
      total: transport + accommodation + food + activities
    },
    packingList: [
      { item: 'Passport / ID', category: 'Documents' },
      { item: 'Travel insurance documents', category: 'Documents' },
      { item: 'Comfortable walking shoes', category: 'Clothing' },
      { item: 'Weather-appropriate jacket', category: 'Clothing' },
      { item: 'Phone charger & adapter', category: 'Other' },
      { item: 'Reusable water bottle', category: 'Gear' },
      { item: 'Sunscreen', category: 'Other' },
      { item: 'Daypack', category: 'Gear' }
    ]
  };
}

async function generateItinerary(params) {
  if (!process.env.GEMINI_API_KEY) {
    console.warn('[aiAgent] GEMINI_API_KEY not set — using offline mock generator.');
    return buildMockItinerary(params);
  }
  const prompt = buildItineraryPrompt(params);
  return withRetry(() => callGemini(prompt));
}

async function regenerateDay(params) {
  if (!process.env.GEMINI_API_KEY) {
    console.warn('[aiAgent] GEMINI_API_KEY not set — using offline mock generator.');
    const mock = buildMockItinerary({ ...params, durationDays: 1 });
    return { ...mock.itinerary[0], dayNumber: params.dayNumber };
  }
  const prompt = buildRegenerateDayPrompt(params);
  return withRetry(() => callGemini(prompt));
}

module.exports = { generateItinerary, regenerateDay };
