/**
 * ============================================================================
 * SCHEDULING ALGORITHM - Ramadan 8 Shifts Version
 * ============================================================================
 *
 * Developer: Khalid Ahmad Alhajj
 * Version: 2.0.0 (Rewritten from scratch)
 * Last Updated: February 2026
 *
 * Scheduling algorithm for Ramadan 8-shift scheme where each rider works 10 hours/day
 *
 * Shift Structure:
 * - Day shifts (6 hours each): slot3 (4AM-10AM), slot4 (10AM-4PM)
 * - Night shifts (2 hours each): slot1, slot2, slot5, slot6, slot7, slot8
 *
 * Methods (each = 10 hours):
 * - Method 1: 1 day shift (6h) + slot1 + slot2 (early morning, 4h) = 10h
 * - Method 2: 1 day shift (6h) + 2 consecutive evening night shifts (4h) = 10h
 * - Method 3: 5 out of 6 night shifts (2h × 5) = 10h (Primary - ~90% of riders)
 *
 * Distribution Target: ~90% Night-only / ~10% Day+Night
 *
 * ============================================================================
 */

import { timeSlotsRamadan } from './validationRamadan';

// Night slot keys
const NIGHT_SLOTS = ['slot1', 'slot2', 'slot5', 'slot6', 'slot7', 'slot8'];
// Day slot keys
const DAY_SLOTS = ['slot3', 'slot4'];

/**
 * All valid Method 3 patterns (5 night shifts = 10 hours)
 * There are C(6,5) = 6 ways to choose 5 from 6 night shifts
 */
const METHOD_3_PATTERNS = [
  ['slot1', 'slot2', 'slot5', 'slot6', 'slot7'], // Skip slot8
  ['slot1', 'slot2', 'slot5', 'slot6', 'slot8'], // Skip slot7
  ['slot1', 'slot2', 'slot5', 'slot7', 'slot8'], // Skip slot6
  ['slot1', 'slot2', 'slot6', 'slot7', 'slot8'], // Skip slot5
  ['slot1', 'slot5', 'slot6', 'slot7', 'slot8'], // Skip slot2
  ['slot2', 'slot5', 'slot6', 'slot7', 'slot8'], // Skip slot1
];

/**
 * Method 1 patterns: Day shift + early morning (slot1 + slot2)
 */
const METHOD_1_PATTERNS = [
  ['slot3', 'slot1', 'slot2'], // Daytime1 + Early Suhoor + Suhoor
  ['slot4', 'slot1', 'slot2'], // Daytime2 + Early Suhoor + Suhoor
];

/**
 * Method 2 patterns: Day shift + 2 consecutive evening shifts
 */
const METHOD_2_PATTERNS = [
  ['slot3', 'slot5', 'slot6'], // Daytime1 + PreIftar + Iftar
  ['slot3', 'slot6', 'slot7'], // Daytime1 + Iftar + PostIftar
  ['slot3', 'slot7', 'slot8'], // Daytime1 + PostIftar + LateNight
  ['slot4', 'slot5', 'slot6'], // Daytime2 + PreIftar + Iftar
  ['slot4', 'slot6', 'slot7'], // Daytime2 + Iftar + PostIftar
  ['slot4', 'slot7', 'slot8'], // Daytime2 + PostIftar + LateNight
];

/**
 * Get the scheduling method for a pattern
 */
export const getPatternMethod = (shifts) => {
  const sortedShifts = [...shifts].sort();
  const key = sortedShifts.join(',');

  for (const pattern of METHOD_3_PATTERNS) {
    if ([...pattern].sort().join(',') === key) {
      return { method: 3, name: 'Night-Only' };
    }
  }

  for (const pattern of METHOD_1_PATTERNS) {
    if ([...pattern].sort().join(',') === key) {
      return { method: 1, name: 'Day + Early Night' };
    }
  }

  for (const pattern of METHOD_2_PATTERNS) {
    if ([...pattern].sort().join(',') === key) {
      return { method: 2, name: 'Day + Evening Night' };
    }
  }

  return { method: 0, name: 'Unknown' };
};

/**
 * Check if pattern has consecutive night shifts
 */
export const hasConsecutiveNightShifts = (shifts) => {
  const consecutivePairs = [
    ['slot1', 'slot2'],
    ['slot5', 'slot6'],
    ['slot6', 'slot7'],
    ['slot7', 'slot8'],
  ];

  for (const [s1, s2] of consecutivePairs) {
    if (shifts.includes(s1) && shifts.includes(s2)) {
      return true;
    }
  }
  return false;
};

/**
 * Count consecutive pairs in a pattern
 */
export const countConsecutivePairs = (shifts) => {
  const consecutivePairs = [
    ['slot1', 'slot2'],
    ['slot5', 'slot6'],
    ['slot6', 'slot7'],
    ['slot7', 'slot8'],
  ];

  let count = 0;
  for (const [s1, s2] of consecutivePairs) {
    if (shifts.includes(s1) && shifts.includes(s2)) {
      count++;
    }
  }
  return count;
};

/**
 * Get total hours for a rider's shifts
 */
export const getTotalHours = (shifts) => {
  return shifts.reduce((total, slotKey) => {
    const slot = timeSlotsRamadan.find(s => s.key === slotKey);
    return total + (slot?.duration || 0);
  }, 0);
};

/**
 * Check if a pattern can be scheduled given remaining capacity
 */
const canSchedulePattern = (pattern, remaining) => {
  return pattern.every(slot => remaining[slot] > 0);
};

/**
 * Score a pattern based on how well it fills targets
 * Higher score = better choice
 */
const scorePattern = (pattern, targetRemaining, maxRemaining) => {
  let score = 0;

  // Primary: Count how many slots with unfilled targets this pattern fills
  const targetsHelped = pattern.filter(slot => targetRemaining[slot] > 0).length;
  score += targetsHelped * 10000;

  // Secondary: Prefer patterns that help the slots with highest remaining targets
  const totalTargetRemaining = pattern.reduce((sum, slot) => sum + Math.max(0, targetRemaining[slot]), 0);
  score += totalTargetRemaining * 100;

  // Tertiary: Prefer consecutive shifts for rider convenience
  const consecutiveCount = countConsecutivePairs(pattern);
  score += consecutiveCount * 50;

  // Balance: Avoid creating bottlenecks (prefer slots with more remaining capacity)
  const minCapacity = Math.min(...pattern.map(slot => maxRemaining[slot]));
  score += minCapacity;

  return score;
};

/**
 * Select the best pattern from a list of patterns
 */
const selectBestPattern = (patterns, targetRemaining, maxRemaining) => {
  let bestPattern = null;
  let bestScore = -Infinity;

  for (const pattern of patterns) {
    if (!canSchedulePattern(pattern, maxRemaining)) continue;

    const score = scorePattern(pattern, targetRemaining, maxRemaining);
    if (score > bestScore) {
      bestScore = score;
      bestPattern = pattern;
    }
  }

  return bestPattern;
};

/**
 * Main scheduling algorithm for Ramadan
 *
 * Strategy:
 * 1. Calculate how many day riders are needed based on day shift targets
 * 2. Schedule day riders first (Method 1 or 2) to fill day slots
 * 3. Schedule remaining riders as night-only (Method 3)
 * 4. If more riders remain, schedule extras using any available pattern
 */
export const createScheduleRamadan = (numRiders, shiftData) => {
  const riderSchedule = [];
  let riderIndex = 0;

  // Initialize capacity tracking
  const targetRemaining = {};
  const maxRemaining = {};

  Object.keys(shiftData).forEach(key => {
    targetRemaining[key] = shiftData[key].target;
    maxRemaining[key] = shiftData[key].max;
  });

  // Track how many riders we've scheduled
  const scheduledCounts = {};
  Object.keys(shiftData).forEach(key => scheduledCounts[key] = 0);

  // ============================================================================
  // PHASE 1: Schedule day riders (Method 1 & 2) to fill day shift targets
  // ============================================================================
  // Each day rider fills exactly 1 day slot + 2 night slots
  // We need to fill both slot3 and slot4 targets

  const dayPatterns = [...METHOD_1_PATTERNS, ...METHOD_2_PATTERNS];

  // Keep scheduling day riders while there are unfilled day slot targets AND capacity
  while (true) {
    // Check if any day slot still needs riders
    const slot3NeedsMore = targetRemaining['slot3'] > 0;
    const slot4NeedsMore = targetRemaining['slot4'] > 0;

    if (!slot3NeedsMore && !slot4NeedsMore) {
      // Day targets are met
      break;
    }

    // Filter patterns to prioritize slots that need more riders
    let candidatePatterns = dayPatterns;
    if (slot3NeedsMore && !slot4NeedsMore) {
      // Only use slot3 patterns
      candidatePatterns = dayPatterns.filter(p => p.includes('slot3'));
    } else if (!slot3NeedsMore && slot4NeedsMore) {
      // Only use slot4 patterns
      candidatePatterns = dayPatterns.filter(p => p.includes('slot4'));
    }

    const bestPattern = selectBestPattern(candidatePatterns, targetRemaining, maxRemaining);

    if (!bestPattern) {
      // No valid day pattern available (capacity exhausted)
      break;
    }

    // Schedule this rider
    const methodInfo = getPatternMethod(bestPattern);
    riderSchedule.push({
      riderId: ++riderIndex,
      shifts: [...bestPattern],
      method: methodInfo.method,
      methodName: methodInfo.name,
      isExtra: false
    });

    // Update remaining counts
    for (const slot of bestPattern) {
      targetRemaining[slot]--;
      maxRemaining[slot]--;
      scheduledCounts[slot]++;
    }
  }

  const dayRidersScheduled = riderIndex;

  // ============================================================================
  // PHASE 2: Schedule night-only riders (Method 3) for remaining riders
  // ============================================================================

  const remainingRiders = numRiders - dayRidersScheduled;

  for (let i = 0; i < remainingRiders; i++) {
    const bestPattern = selectBestPattern(METHOD_3_PATTERNS, targetRemaining, maxRemaining);

    if (!bestPattern) {
      // No valid night pattern available (capacity exhausted)
      break;
    }

    // Schedule this rider
    riderSchedule.push({
      riderId: ++riderIndex,
      shifts: [...bestPattern],
      method: 3,
      methodName: 'Night-Only',
      isExtra: false
    });

    // Update remaining counts
    for (const slot of bestPattern) {
      targetRemaining[slot]--;
      maxRemaining[slot]--;
      scheduledCounts[slot]++;
    }
  }

  // ============================================================================
  // PHASE 3: If we still haven't scheduled all riders, use any available pattern
  // ============================================================================

  const allPatterns = [...METHOD_3_PATTERNS, ...METHOD_1_PATTERNS, ...METHOD_2_PATTERNS];

  while (riderSchedule.length < numRiders) {
    const bestPattern = selectBestPattern(allPatterns, targetRemaining, maxRemaining);

    if (!bestPattern) {
      // No valid pattern available at all
      break;
    }

    const methodInfo = getPatternMethod(bestPattern);
    const allTargetsMet = Object.values(targetRemaining).every(v => v <= 0);

    riderSchedule.push({
      riderId: ++riderIndex,
      shifts: [...bestPattern],
      method: methodInfo.method,
      methodName: methodInfo.name,
      isExtra: allTargetsMet
    });

    // Update remaining counts
    for (const slot of bestPattern) {
      targetRemaining[slot]--;
      maxRemaining[slot]--;
      scheduledCounts[slot]++;
    }
  }

  // ============================================================================
  // Calculate statistics
  // ============================================================================

  let method1Count = 0;
  let method2Count = 0;
  let method3Count = 0;
  let consecutiveCount = 0;

  riderSchedule.forEach(rider => {
    if (rider.method === 1) method1Count++;
    else if (rider.method === 2) method2Count++;
    else if (rider.method === 3) method3Count++;

    if (hasConsecutiveNightShifts(rider.shifts)) {
      consecutiveCount++;
    }
  });

  const totalScheduled = riderSchedule.length;
  const extraRiders = riderSchedule.filter(r => r.isExtra).length;

  return {
    success: true,
    schedule: riderSchedule,
    statistics: {
      totalScheduled,
      method1Count,
      method2Count,
      method3Count,
      dayRiders: method1Count + method2Count,
      nightOnlyRiders: method3Count,
      dayPercentage: totalScheduled > 0 ? ((method1Count + method2Count) / totalScheduled * 100).toFixed(1) : '0.0',
      nightPercentage: totalScheduled > 0 ? (method3Count / totalScheduled * 100).toFixed(1) : '0.0',
      consecutiveCount,
      extraRiders
    },
    scheduledCounts,
    targetRemaining,
    warning: null
  };
};

// Export pattern arrays for use in validation
export const VALID_COMBINATIONS = {
  night_patterns: METHOD_3_PATTERNS,
  method1_patterns: METHOD_1_PATTERNS,
  method2_patterns: METHOD_2_PATTERNS,
};
