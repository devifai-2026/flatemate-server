const User = require('../models/User');
const AppError = require('../utils/AppError');

/**
 * Matching Algorithm
 * ─────────────────
 * Compares the requesting user against every other user with preferences set.
 * The match score (0–100) is computed across four weighted dimensions:
 *
 *   1. Budget overlap   (30%) — how much the two users' budget ranges overlap
 *   2. Location match   (25%) — case-insensitive substring match on preferred location
 *   3. Lifestyle compat (25%) — agreement on smoking, drinking, pets, sleep schedule
 *   4. Interest overlap  (20%) — Jaccard similarity of interest arrays
 *
 * Each match includes a human-readable explanation of the score breakdown.
 */

const getMatches = async (userId) => {
  const currentUser = await User.findById(userId);
  if (!currentUser) throw new AppError('User not found', 404);
  if (!currentUser.preferences) {
    throw new AppError('Set your preferences first to get matches', 400);
  }

  const candidates = await User.find({
    _id: { $ne: userId },
    preferences: { $exists: true, $ne: null },
  });

  const results = candidates.map((candidate) => {
    const { score, explanation } = computeMatchScore(currentUser, candidate);
    return {
      user: {
        _id: candidate._id,
        name: candidate.name,
        age: candidate.age,
        gender: candidate.gender,
        occupation: candidate.occupation,
        bio: candidate.bio,
        profileImage: candidate.profileImage,
        verified: candidate.verified,
        preferences: candidate.preferences,
      },
      matchScore: score,
      explanation,
    };
  });

  results.sort((a, b) => b.matchScore - a.matchScore);
  return results;
};

// ── Score computation ──

function computeMatchScore(userA, userB) {
  const budget = calcBudgetScore(userA.preferences, userB.preferences);
  const location = calcLocationScore(userA.preferences, userB.preferences);
  const lifestyle = calcLifestyleScore(userA.preferences, userB.preferences);
  const interests = calcInterestScore(userA.preferences, userB.preferences);

  const score = Math.round(
    budget.score * 0.3 +
    location.score * 0.25 +
    lifestyle.score * 0.25 +
    interests.score * 0.2
  );

  const explanation = {
    budget: { score: Math.round(budget.score * 0.3), maxScore: 30, detail: budget.detail },
    location: { score: Math.round(location.score * 0.25), maxScore: 25, detail: location.detail },
    lifestyle: { score: Math.round(lifestyle.score * 0.25), maxScore: 25, detail: lifestyle.detail },
    interests: { score: Math.round(interests.score * 0.2), maxScore: 20, detail: interests.detail },
  };

  return { score, explanation };
}

/**
 * Budget overlap score (0–100).
 */
function calcBudgetScore(prefA, prefB) {
  const aMin = prefA.budgetMin ?? 0;
  const aMax = prefA.budgetMax ?? Infinity;
  const bMin = prefB.budgetMin ?? 0;
  const bMax = prefB.budgetMax ?? Infinity;

  const overlapStart = Math.max(aMin, bMin);
  const overlapEnd = Math.min(aMax, bMax);

  if (overlapStart >= overlapEnd) {
    return { score: 0, detail: 'No budget overlap' };
  }

  const overlap = overlapEnd - overlapStart;
  const totalRange = Math.max(aMax, bMax) - Math.min(aMin, bMin);
  const score = totalRange === 0 ? 100 : Math.min(100, (overlap / totalRange) * 100);

  return {
    score,
    detail: `Budget overlap ₹${overlapStart}–₹${overlapEnd}`,
  };
}

/**
 * Location score (0, 75, or 100).
 */
function calcLocationScore(prefA, prefB) {
  const locA = (prefA.preferredLocation || '').toLowerCase().trim();
  const locB = (prefB.preferredLocation || '').toLowerCase().trim();

  if (!locA || !locB) return { score: 0, detail: 'Location not set' };
  if (locA === locB) return { score: 100, detail: `Exact match: ${locA}` };
  if (locA.includes(locB) || locB.includes(locA)) {
    return { score: 75, detail: `Partial match: ${locA} / ${locB}` };
  }
  return { score: 0, detail: `No match: ${locA} vs ${locB}` };
}

/**
 * Lifestyle compatibility (0–100). 25 pts per matching field.
 */
function calcLifestyleScore(prefA, prefB) {
  const lsA = prefA.lifestyle || {};
  const lsB = prefB.lifestyle || {};

  const matches = [];
  const mismatches = [];

  const check = (field, label) => {
    if (lsA[field] === lsB[field]) matches.push(label);
    else mismatches.push(label);
  };

  check('smoking', 'smoking');
  check('drinking', 'drinking');
  check('pets', 'pets');
  check('sleepSchedule', 'sleep schedule');

  const score = matches.length * 25;
  const parts = [];
  if (matches.length) parts.push(`Agree on: ${matches.join(', ')}`);
  if (mismatches.length) parts.push(`Differ on: ${mismatches.join(', ')}`);

  return { score, detail: parts.join('. ') || 'No lifestyle data' };
}

/**
 * Interest similarity (0–100) using Jaccard index.
 */
function calcInterestScore(prefA, prefB) {
  const a = new Set((prefA.interests || []).map((i) => i.toLowerCase()));
  const b = new Set((prefB.interests || []).map((i) => i.toLowerCase()));

  if (a.size === 0 && b.size === 0) {
    return { score: 50, detail: 'Neither user listed interests' };
  }
  if (a.size === 0 || b.size === 0) {
    return { score: 0, detail: 'One user has no interests listed' };
  }

  const shared = [...a].filter((x) => b.has(x));
  const union = new Set([...a, ...b]).size;
  const score = Math.round((shared.length / union) * 100);

  return {
    score,
    detail: shared.length
      ? `Shared: ${shared.join(', ')}`
      : 'No shared interests',
  };
}

module.exports = { getMatches };
