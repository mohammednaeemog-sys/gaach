// Scoring weights for ranking trees that pass the hard filters (NFR-5.2).
// Change these numbers to tune the recommendation without touching the engine.
export const WEIGHTS = {
  // Soil the tree is listed as suited to
  soilMatch: 30,
  // Purpose the user asked for: full points if it is the tree's main purpose,
  // the secondary share if it is one of its other purposes
  purposePrimary: 35,
  purposeSecondary: 22,
  // Extra points when the region has a risk the tree handles well
  regionStrength: 6, // per matching risk (flood, drought, salinity), with HIGH tolerance
  // Points for room to spare: full when the tree uses at most `comfortableShare` of the space
  spaceFit: 12,
  comfortableShare: 0.8,
  // Points when the user's sunlight is the tree's first listed (preferred) level
  sunPreferred: 5,
};

// Score bands (out of 100) that become the match level shown to the user
export const MATCH_LEVELS = [
  { min: 75, level: "Excellent match" },
  { min: 50, level: "Good match" },
  { min: 0, level: "Fair match" },
] as const;
