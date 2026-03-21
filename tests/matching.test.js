/**
 * Unit tests for the matching algorithm.
 * These run without MongoDB — we test the pure scoring functions.
 */

// We need to extract the scoring helpers. Since they're not exported,
// we test them through a lightweight wrapper that mimics User objects.
// For a real suite you'd refactor the helpers into a shared module.

const { getMatches } = require('../services/matchingService');

// ── Mock mongoose to avoid DB dependency ──
jest.mock('../models/User', () => {
  let mockUsers = [];
  return {
    findById: jest.fn((id) => {
      const user = mockUsers.find((u) => u._id === id);
      return Promise.resolve(user || null);
    }),
    find: jest.fn(() => {
      return Promise.resolve(mockUsers.filter((u) => u._id !== 'user1'));
    }),
    __setMockUsers: (users) => {
      mockUsers = users;
    },
  };
});

const User = require('../models/User');

describe('Matching Service', () => {
  const userA = {
    _id: 'user1',
    name: 'Alice',
    age: 25,
    gender: 'female',
    occupation: 'Engineer',
    verified: true,
    preferences: {
      budgetMin: 5000,
      budgetMax: 15000,
      preferredLocation: 'Mumbai',
      lifestyle: { smoking: false, drinking: true, pets: false, sleepSchedule: 'night-owl' },
      interests: ['gaming', 'cooking', 'reading'],
    },
  };

  const userB = {
    _id: 'user2',
    name: 'Bob',
    age: 28,
    gender: 'male',
    occupation: 'Designer',
    verified: false,
    preferences: {
      budgetMin: 8000,
      budgetMax: 12000,
      preferredLocation: 'Mumbai',
      lifestyle: { smoking: false, drinking: true, pets: false, sleepSchedule: 'night-owl' },
      interests: ['gaming', 'music', 'reading'],
    },
  };

  const userC = {
    _id: 'user3',
    name: 'Charlie',
    age: 35,
    gender: 'male',
    occupation: 'Doctor',
    verified: true,
    preferences: {
      budgetMin: 20000,
      budgetMax: 30000,
      preferredLocation: 'Delhi',
      lifestyle: { smoking: true, drinking: false, pets: true, sleepSchedule: 'early-bird' },
      interests: ['yoga', 'travel'],
    },
  };

  beforeEach(() => {
    User.__setMockUsers([userA, userB, userC]);
    User.find.mockImplementation(() =>
      Promise.resolve([userB, userC]) // exclude userA (the requester)
    );
  });

  test('returns matches sorted by score descending', async () => {
    const matches = await getMatches('user1');
    expect(matches).toHaveLength(2);
    expect(matches[0].matchScore).toBeGreaterThanOrEqual(matches[1].matchScore);
  });

  test('similar users have higher score than dissimilar', async () => {
    const matches = await getMatches('user1');
    const bobMatch = matches.find((m) => m.user._id === 'user2');
    const charlieMatch = matches.find((m) => m.user._id === 'user3');
    expect(bobMatch.matchScore).toBeGreaterThan(charlieMatch.matchScore);
  });

  test('scores are between 0 and 100', async () => {
    const matches = await getMatches('user1');
    for (const match of matches) {
      expect(match.matchScore).toBeGreaterThanOrEqual(0);
      expect(match.matchScore).toBeLessThanOrEqual(100);
    }
  });

  test('each match includes explanation breakdown', async () => {
    const matches = await getMatches('user1');
    for (const match of matches) {
      expect(match.explanation).toBeDefined();
      expect(match.explanation.budget).toHaveProperty('score');
      expect(match.explanation.budget).toHaveProperty('maxScore', 30);
      expect(match.explanation.budget).toHaveProperty('detail');
      expect(match.explanation.location).toHaveProperty('maxScore', 25);
      expect(match.explanation.lifestyle).toHaveProperty('maxScore', 25);
      expect(match.explanation.interests).toHaveProperty('maxScore', 20);
    }
  });

  test('throws if user not found', async () => {
    await expect(getMatches('nonexistent')).rejects.toThrow('User not found');
  });

  test('throws if user has no preferences', async () => {
    User.__setMockUsers([{ _id: 'nopref', name: 'No Prefs' }]);
    User.findById.mockResolvedValueOnce({ _id: 'nopref', name: 'No Prefs' });
    await expect(getMatches('nopref')).rejects.toThrow('Set your preferences first');
  });
});
