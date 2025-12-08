/**
 * ============================================================================
 * SCHEDULING ALGORITHM - 6 Shifts Version
 * ============================================================================
 *
 * Developer: Khalid Ahmad Alhajj
 * Version: 1.0.0 (6 Shifts Implementation)
 * Last Updated: November 2024
 *
 * Scheduling algorithm for 6-shift scheme where each rider works 3 shifts per day
 * Optimized for consecutive shift assignments (11-13 hours total per rider)
 *
 * ============================================================================
 */

const SHIFTS_PER_RIDER = 3;

/**
 * PRE-COMPUTED PARTNERS MAP for 6 shifts
 */
const PARTNERS_MAP = {
  slot1: ['slot2', 'slot6', 'slot3', 'slot4', 'slot5'],
  slot2: ['slot1', 'slot3', 'slot4', 'slot5', 'slot6'],
  slot3: ['slot2', 'slot4', 'slot1', 'slot5', 'slot6'],
  slot4: ['slot3', 'slot5', 'slot1', 'slot2', 'slot6'],
  slot5: ['slot4', 'slot6', 'slot1', 'slot2', 'slot3'],
  slot6: ['slot5', 'slot1', 'slot2', 'slot3', 'slot4']
};

/**
 * Consecutive triplets - preferred shift combinations for 6-shift scheme
 * These represent 3 consecutive shifts that form an optimal work block
 */
const CONSECUTIVE_TRIPLETS = [
  ['slot1', 'slot2', 'slot3'], // Midnight + Early Morning + Morning (12AM-12PM = 12 hours)
  ['slot2', 'slot3', 'slot4'], // Early Morning + Morning + Lunch (3AM-4PM = 13 hours)
  ['slot3', 'slot4', 'slot5'], // Morning + Lunch + Evening (8AM-8PM = 12 hours)
  ['slot4', 'slot5', 'slot6'], // Lunch + Evening + Dinner (12PM-12AM = 12 hours)
  ['slot5', 'slot6', 'slot1'], // Evening + Dinner + Midnight (4PM-3AM = 11 hours)
  ['slot6', 'slot1', 'slot2'], // Dinner + Midnight + Early Morning (8PM-8AM = 12 hours)
];

/**
 * Checks if three shifts form a consecutive triplet
 */
export const isConsecutiveTriplet = (shift1, shift2, shift3) => {
  const sortedShifts = [shift1, shift2, shift3].sort();

  return CONSECUTIVE_TRIPLETS.some(triplet => {
    const sortedTriplet = [...triplet].sort();
    return sortedShifts[0] === sortedTriplet[0] &&
           sortedShifts[1] === sortedTriplet[1] &&
           sortedShifts[2] === sortedTriplet[2];
  });
};

/**
 * Consecutive pairs definition
 */
const CONSECUTIVE_PAIRS = [
  ['slot1', 'slot2'],
  ['slot2', 'slot3'],
  ['slot3', 'slot4'],
  ['slot4', 'slot5'],
  ['slot5', 'slot6'],
  ['slot6', 'slot1'], // wrap around
];

/**
 * Checks if two shifts are consecutive
 */
export const isConsecutivePair = (shift1, shift2) => {
  return CONSECUTIVE_PAIRS.some(([s1, s2]) =>
    (shift1 === s1 && shift2 === s2) || (shift1 === s2 && shift2 === s1)
  );
};

/**
 * Counts how many consecutive pairs exist in a triplet of shifts
 * Returns 0, 1, or 2 (if all 3 are consecutive, there are 2 consecutive pairs)
 */
export const countConsecutivePairs = (shifts) => {
  let count = 0;
  for (let i = 0; i < shifts.length; i++) {
    for (let j = i + 1; j < shifts.length; j++) {
      if (isConsecutivePair(shifts[i], shifts[j])) {
        count++;
      }
    }
  }
  return count;
};

/**
 * Determines the consecutive status of a rider's shifts
 * Returns: 'consecutive' | 'partial' | 'non-consecutive'
 */
export const getConsecutiveStatus = (shifts) => {
  if (isConsecutiveTriplet(shifts[0], shifts[1], shifts[2])) {
    return 'consecutive';
  }
  const pairCount = countConsecutivePairs(shifts);
  if (pairCount >= 1) {
    return 'partial';
  }
  return 'non-consecutive';
};

/**
 * Checks if shifts have any consecutive pair (legacy function for compatibility)
 */
export const hasConsecutivePair = (shifts) => {
  return countConsecutivePairs(shifts) > 0;
};

/**
 * Validates if remaining shifts can be paired into valid triplets
 */
const canFormValidTriplets = (remaining) => {
  const totalRemaining = Object.values(remaining).reduce((a, b) => a + b, 0);
  if (totalRemaining === 0) return true;
  if (totalRemaining % SHIFTS_PER_RIDER !== 0) return false;

  // Check each shift has enough capacity in other slots
  for (const shift in remaining) {
    if (remaining[shift] > 0) {
      const partners = PARTNERS_MAP[shift];
      const partnerCap = partners.reduce((sum, p) => sum + (remaining[p] || 0), 0);
      // Each rider needs 2 other slots, so partner capacity should be at least 2x the shift demand
      if (remaining[shift] * 2 > partnerCap) {
        return false;
      }
    }
  }
  return true;
};

/**
 * Get all possible triplet combinations for scheduling
 */
const getAllPossibleTriplets = () => {
  const slots = ['slot1', 'slot2', 'slot3', 'slot4', 'slot5', 'slot6'];
  const triplets = [];

  // First add consecutive triplets (preferred)
  triplets.push(...CONSECUTIVE_TRIPLETS);

  // Then add non-consecutive triplets
  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length; j++) {
      for (let k = j + 1; k < slots.length; k++) {
        const triplet = [slots[i], slots[j], slots[k]];
        const isConsec = isConsecutiveTriplet(triplet[0], triplet[1], triplet[2]);
        if (!isConsec) {
          triplets.push(triplet);
        }
      }
    }
  }

  return triplets;
};

/**
 * Main scheduling algorithm for 6 shifts
 * Creates an optimal schedule for riders across 6 shifts with:
 * - 3 shifts per rider (11-13 hours total)
 * - Preference for consecutive shift triplets
 * - Bottleneck awareness
 */
export const createSchedule6 = (numRiders, shiftData) => {
  const totalTargetShifts = Object.values(shiftData).reduce((sum, s) => sum + s.target, 0);
  const minRidersForTarget = totalTargetShifts / SHIFTS_PER_RIDER;

  const riderSchedule = [];
  let riderIndex = 0;

  const targetRemaining = {};
  Object.keys(shiftData).forEach(key => {
    targetRemaining[key] = shiftData[key].target;
  });

  // ============================================================================
  // PROPORTIONAL DISTRIBUTION LOGIC FOR UNDER-SCHEDULED SCENARIOS
  // ============================================================================
  // When riders are below the target, distribute riders proportionally
  // based on each shift's percentage of the total target
  const isBelowTarget = numRiders < minRidersForTarget;

  if (isBelowTarget) {
    const totalAvailableShifts = numRiders * SHIFTS_PER_RIDER;

    // Calculate proportional allocation based on target percentages
    const proportionalAllocations = {};
    const shiftKeys = Object.keys(shiftData);

    // First pass: calculate proportional values using floor
    let allocatedShifts = 0;
    const remainders = [];

    shiftKeys.forEach(key => {
      const proportion = shiftData[key].target / totalTargetShifts;
      const exactAllocation = proportion * totalAvailableShifts;
      const flooredAllocation = Math.floor(exactAllocation);
      const remainder = exactAllocation - flooredAllocation;

      proportionalAllocations[key] = flooredAllocation;
      allocatedShifts += flooredAllocation;
      remainders.push({ key, remainder, target: shiftData[key].target });
    });

    // Second pass: distribute remaining shifts to those with largest remainders
    const shiftsToDistribute = totalAvailableShifts - allocatedShifts;
    if (shiftsToDistribute > 0) {
      // Sort by remainder (descending), then by target (descending) as tiebreaker
      remainders.sort((a, b) => {
        if (Math.abs(b.remainder - a.remainder) > 0.0001) {
          return b.remainder - a.remainder;
        }
        return b.target - a.target;
      });

      for (let i = 0; i < shiftsToDistribute; i++) {
        proportionalAllocations[remainders[i].key]++;
      }
    }

    // Apply proportional allocations, ensuring we never exceed targets
    shiftKeys.forEach(key => {
      targetRemaining[key] = Math.min(proportionalAllocations[key], shiftData[key].target);
    });
  }
  // ============================================================================

  const allTriplets = getAllPossibleTriplets();

  // Only schedule up to the number of riders we actually have
  const ridersToScheduleForTarget = Math.min(numRiders, minRidersForTarget);

  // Detect small numbers and adjust strategy
  const isSmallNumber = minRidersForTarget < 15;

  for (let iteration = 0; iteration < ridersToScheduleForTarget; iteration++) {
    const remaining = Object.values(targetRemaining).reduce((a, b) => a + b, 0);
    if (remaining < SHIFTS_PER_RIDER) break;

    let bestTriplet = null;
    let bestScore = -Infinity;

    for (const triplet of allTriplets) {
      const [s1, s2, s3] = triplet;

      if (targetRemaining[s1] > 0 && targetRemaining[s2] > 0 && targetRemaining[s3] > 0) {
        const tempRemaining = {...targetRemaining};
        tempRemaining[s1]--;
        tempRemaining[s2]--;
        tempRemaining[s3]--;

        if (!canFormValidTriplets(tempRemaining)) {
          continue;
        }

        let score = 0;
        const isConsec = isConsecutiveTriplet(s1, s2, s3);

        if (isSmallNumber) {
          // Small number strategy: heavily prioritize consecutive triplets
          if (isConsec) {
            score += 1000;
            score += (targetRemaining[s1] + targetRemaining[s2] + targetRemaining[s3]) * 10;
          }

          // Light ratio penalty
          let totalRatio = 0;
          for (const slot of triplet) {
            const partners = PARTNERS_MAP[slot];
            const partnerCap = partners.reduce((sum, p) => sum + (tempRemaining[p] || 0), 0);
            const ratio = tempRemaining[slot] > 0 ? tempRemaining[slot] / (partnerCap + 1) : 0;
            totalRatio += ratio;
          }
          score -= totalRatio * 5;
        } else {
          // Large number strategy: balanced scoring
          if (isConsec) {
            score += 150;
          } else if (hasConsecutivePair(triplet)) {
            score += 50; // Bonus for having at least 2 consecutive shifts
          }

          // Bottleneck awareness
          let totalRatio = 0;
          for (const slot of triplet) {
            const partners = PARTNERS_MAP[slot];
            const partnerCap = partners.reduce((sum, p) => sum + (tempRemaining[p] || 0), 0);
            const ratio = tempRemaining[slot] > 0 ? tempRemaining[slot] / (partnerCap + 1) : 0;
            totalRatio += ratio;
          }
          score -= totalRatio * 30;

          // Balance scoring
          const values = [targetRemaining[s1], targetRemaining[s2], targetRemaining[s3]];
          const max = Math.max(...values);
          const min = Math.min(...values);
          const balance = 1 - (max - min) / (max + 1);
          score += balance * 20;
        }

        if (score > bestScore) {
          bestScore = score;
          bestTriplet = triplet;
        }
      }
    }

    if (!bestTriplet) {
      // No valid triplet found, break
      break;
    }

    const [s1, s2, s3] = bestTriplet;
    riderSchedule.push({
      riderId: ++riderIndex,
      shifts: [s1, s2, s3],
      isExtra: false
    });
    targetRemaining[s1]--;
    targetRemaining[s2]--;
    targetRemaining[s3]--;
  }

  // Try to schedule extra riders - either when all targets are met OR when using extra capacity
  const remainingSum = Object.values(targetRemaining).reduce((a, b) => a + b, 0);
  const extraRidersNeeded = numRiders - riderIndex;

  if (extraRidersNeeded > 0) {
    // Calculate remaining capacity: start from max capacity and subtract already scheduled riders
    const maxRemaining = {};
    Object.keys(shiftData).forEach(key => {
      const alreadyScheduled = shiftData[key].target - targetRemaining[key];
      maxRemaining[key] = shiftData[key].max - alreadyScheduled;
    });

    for (let i = 0; i < extraRidersNeeded; i++) {
      let bestTriplet = null;
      let bestScore = -Infinity;

      // Prioritize consecutive triplets for extra riders too
      for (const triplet of allTriplets) {
        const [s1, s2, s3] = triplet;

        if (maxRemaining[s1] > 0 && maxRemaining[s2] > 0 && maxRemaining[s3] > 0) {
          const tempRemaining = {...maxRemaining};
          tempRemaining[s1]--;
          tempRemaining[s2]--;
          tempRemaining[s3]--;

          let score = 0;
          const isConsec = isConsecutiveTriplet(s1, s2, s3);

          if (isConsec) {
            score += 100;
          } else if (hasConsecutivePair(triplet)) {
            score += 30;
          }

          // Prefer balanced remaining capacity
          const minRemaining = Math.min(maxRemaining[s1], maxRemaining[s2], maxRemaining[s3]);
          score += (10 / (minRemaining + 1));

          const values = [maxRemaining[s1], maxRemaining[s2], maxRemaining[s3]];
          const max = Math.max(...values);
          const min = Math.min(...values);
          const balance = 1 - (max - min) / (max + min + 1);
          score += balance * 15;

          if (score > bestScore) {
            bestScore = score;
            bestTriplet = triplet;
          }
        }
      }

      if (bestTriplet) {
        const [s1, s2, s3] = bestTriplet;
        // Mark as extra only if all targets have been met
        const isExtraRider = remainingSum === 0;
        riderSchedule.push({
          riderId: ++riderIndex,
          shifts: [s1, s2, s3],
          isExtra: isExtraRider
        });
        maxRemaining[s1]--;
        maxRemaining[s2]--;
        maxRemaining[s3]--;
      } else {
        break;
      }
    }
  }

  const finalSchedule = riderSchedule.filter(r => r.shifts && r.shifts.length === SHIFTS_PER_RIDER);

  // Count consecutive statuses
  let consecutiveTripletCount = 0;
  let partiallyConsecutiveCount = 0;
  let nonConsecutiveCount = 0;

  finalSchedule.forEach(rider => {
    const status = getConsecutiveStatus(rider.shifts);
    if (status === 'consecutive') {
      consecutiveTripletCount++;
    } else if (status === 'partial') {
      partiallyConsecutiveCount++;
    } else {
      nonConsecutiveCount++;
    }
  });

  const extraRidersAssigned = finalSchedule.filter(r => r.isExtra).length;

  return {
    success: true,
    schedule: finalSchedule,
    consecutiveTriplets: consecutiveTripletCount,
    partiallyConsecutive: partiallyConsecutiveCount,
    nonConsecutive: nonConsecutiveCount,
    extraRiders: extraRidersAssigned,
    warning: null
  };
};

export const SHIFTS_PER_RIDER_6 = SHIFTS_PER_RIDER;
