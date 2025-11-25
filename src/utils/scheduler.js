/**
 * ============================================================================
 * SCHEDULING ALGORITHM - Optimized Version
 * ============================================================================
 *
 * Developer: Khalid Ahmad Alhajj
 * Version: 1.2.2 (Optimized with Pre-computed Partners Map)
 * Last Updated: November 2024
 *
 * Optimization: Pre-computed adjacency map to reduce redundant computations
 * - PARTNERS_MAP is computed once instead of being regenerated thousands of times
 * - Algorithm behavior is unchanged - only performance is improved
 *
 * ============================================================================
 */

const SHIFTS_PER_RIDER = 2;

/**
 * PRE-COMPUTED PARTNERS MAP
 *
 * This optimization replaces the getValidPartners() function that was being
 * called thousands of times during scheduling. Instead, we compute the
 * adjacency map once and reuse it.
 *
 * This is a LOW-RISK optimization because:
 * - The output is identical to getValidPartners()
 * - No algorithm behavior changes
 * - Reduces garbage collection overhead from repeated Set creation
 */
const PARTNERS_MAP = {
  slot1: ['slot2', 'slot5', 'slot3', 'slot4'],
  slot2: ['slot1', 'slot3', 'slot4', 'slot5'],
  slot3: ['slot2', 'slot4', 'slot1', 'slot5'],
  slot4: ['slot3', 'slot5', 'slot1', 'slot2'],
  slot5: ['slot4', 'slot1', 'slot2', 'slot3']
};

/**
 * Checks if two shifts are consecutive
 */
export const isConsecutive = (shift1, shift2) => {
  const pairs = [
    ['slot1', 'slot2'],
    ['slot2', 'slot3'],
    ['slot3', 'slot4'],
    ['slot4', 'slot5'],
    ['slot5', 'slot1']
  ];

  return pairs.some(([s1, s2]) =>
    (shift1 === s1 && shift2 === s2) || (shift1 === s2 && shift2 === s1)
  );
};

/**
 * Validates if remaining shifts can be paired using Hall's Marriage Theorem
 *
 * This is the SAFETY MECHANISM that prevents invalid schedules.
 * DO NOT REMOVE - it ensures algorithmic correctness.
 */
const canBePaired = (remaining) => {
  for (const shift in remaining) {
    if (remaining[shift] > 0) {
      // OPTIMIZATION: Use pre-computed PARTNERS_MAP instead of getValidPartners()
      const partners = PARTNERS_MAP[shift];
      const partnerCap = partners.reduce((sum, p) => sum + (remaining[p] || 0), 0);
      if (remaining[shift] > partnerCap) {
        return false;
      }
    }
  }
  return true;
};

/**
 * Main scheduling algorithm
 *
 * Creates an optimal schedule for riders across shifts with:
 * - Hall's Marriage Theorem validation to prevent deadlocks
 * - Adaptive scoring for small vs large numbers
 * - Consecutive shift preference
 * - Bottleneck awareness
 */
export const createSchedule = (numRiders, shiftData) => {
  const totalTargetShifts = Object.values(shiftData).reduce((sum, s) => sum + s.target, 0);
  const minRidersForTarget = totalTargetShifts / SHIFTS_PER_RIDER;

  const riderSchedule = [];
  let riderIndex = 0;

  const targetRemaining = {};
  Object.keys(shiftData).forEach(key => {
    targetRemaining[key] = shiftData[key].target;
  });

  // ============================================================================
  // EVEN DISTRIBUTION LOGIC FOR SIGNIFICANTLY UNDER-SCHEDULED SCENARIOS
  // ============================================================================
  // When riders are 20% or more below the target, distribute riders evenly
  // across all shifts to prevent concentrated gaps in some time slots
  const isSignificantlyBelowTarget = numRiders <= 0.8 * minRidersForTarget;

  if (isSignificantlyBelowTarget) {
    const totalAvailableShifts = numRiders * SHIFTS_PER_RIDER;
    const numShifts = Object.keys(shiftData).length;
    const basePerShift = Math.floor(totalAvailableShifts / numShifts);
    const extraShifts = totalAvailableShifts % numShifts; // Remainder to distribute

    // Sort shifts by original target (descending) to give extra shifts to higher-demand slots
    const shiftsArray = Object.keys(shiftData)
      .map(key => ({ key, target: shiftData[key].target }))
      .sort((a, b) => b.target - a.target);

    // Distribute evenly: each shift gets basePerShift, with some getting +1 for remainder
    shiftsArray.forEach((shift, index) => {
      targetRemaining[shift.key] = basePerShift + (index < extraShifts ? 1 : 0);
    });
  }
  // ============================================================================

  const consecutivePairs = [
    ['slot1', 'slot2'],
    ['slot2', 'slot3'],
    ['slot3', 'slot4'],
    ['slot4', 'slot5'],
    ['slot5', 'slot1'],
  ];

  const nonConsecutivePairs = [
    ['slot1', 'slot3'],
    ['slot1', 'slot4'],
    ['slot2', 'slot4'],
    ['slot2', 'slot5'],
    ['slot3', 'slot5'],
  ];

  const allPairs = [...consecutivePairs, ...nonConsecutivePairs];

  // Only schedule up to the number of riders we actually have
  const ridersToScheduleForTarget = Math.min(numRiders, minRidersForTarget);

  // OPTIMIZATION: Detect small numbers and adjust strategy accordingly
  // For small numbers, we use a completely different approach that prioritizes
  // consecutive pairs much more aggressively and pairs largest shifts first
  const isSmallNumber = minRidersForTarget < 20;

  for (let iteration = 0; iteration < ridersToScheduleForTarget; iteration++) {
    const remaining = Object.values(targetRemaining).reduce((a, b) => a + b, 0);
    if (remaining === 0) break;

    let bestPair = null;
    let bestScore = -Infinity;

    // For small numbers, try consecutive pairs FIRST with heavily weighted scoring
    const pairsToTry = isSmallNumber ? [...consecutivePairs, ...nonConsecutivePairs] : allPairs;

    for (const [s1, s2] of pairsToTry) {
      if (targetRemaining[s1] > 0 && targetRemaining[s2] > 0) {
        const tempRemaining = {...targetRemaining};
        tempRemaining[s1]--;
        tempRemaining[s2]--;

        if (!canBePaired(tempRemaining)) {
          continue;
        }

        let score = 0;

        const isConsec = consecutivePairs.some(([p1, p2]) =>
          (s1 === p1 && s2 === p2) || (s1 === p2 && s2 === p1)
        );

        if (isSmallNumber) {
          // SMALL NUMBER STRATEGY: Massively prioritize consecutive pairs
          if (isConsec) {
            score += 1000; // Huge bonus for consecutive
            // Add bonus for pairing larger shifts first (only for consecutive)
            score += (targetRemaining[s1] + targetRemaining[s2]) * 10;
          }
          // Much lighter ratio penalty
          // OPTIMIZATION: Use pre-computed PARTNERS_MAP
          const s1Partners = PARTNERS_MAP[s1];
          const s2Partners = PARTNERS_MAP[s2];
          const s1PartnerCap = s1Partners.reduce((sum, p) => sum + (tempRemaining[p] || 0), 0);
          const s2PartnerCap = s2Partners.reduce((sum, p) => sum + (tempRemaining[p] || 0), 0);
          const s1Ratio = tempRemaining[s1] > 0 ? tempRemaining[s1] / (s1PartnerCap + 1) : 0;
          const s2Ratio = tempRemaining[s2] > 0 ? tempRemaining[s2] / (s2PartnerCap + 1) : 0;
          score -= (s1Ratio + s2Ratio) * 5;
        } else {
          // LARGE NUMBER STRATEGY: Original balanced scoring
          if (isConsec) score += 100;

          // OPTIMIZATION: Use pre-computed PARTNERS_MAP
          const s1Partners = PARTNERS_MAP[s1];
          const s2Partners = PARTNERS_MAP[s2];
          const s1PartnerCap = s1Partners.reduce((sum, p) => sum + (tempRemaining[p] || 0), 0);
          const s2PartnerCap = s2Partners.reduce((sum, p) => sum + (tempRemaining[p] || 0), 0);

          const s1Ratio = tempRemaining[s1] > 0 ? tempRemaining[s1] / (s1PartnerCap + 1) : 0;
          const s2Ratio = tempRemaining[s2] > 0 ? tempRemaining[s2] / (s2PartnerCap + 1) : 0;

          score -= (s1Ratio + s2Ratio) * 50;

          const balance = 1 - Math.abs(targetRemaining[s1] - targetRemaining[s2]) /
                         (targetRemaining[s1] + targetRemaining[s2]);
          score += balance * 10;
        }

        if (score > bestScore) {
          bestScore = score;
          bestPair = [s1, s2];
        }
      }
    }

    if (!bestPair) {
      // This is acceptable when we have fewer riders than targets
      // Just return what we've scheduled so far
      break;
    }

    const [s1, s2] = bestPair;
    riderSchedule.push({
      riderId: ++riderIndex,
      shifts: [s1, s2],
      isExtra: false
    });
    targetRemaining[s1]--;
    targetRemaining[s2]--;
  }

  // Only try to schedule extra riders if we met all targets
  const remainingSum = Object.values(targetRemaining).reduce((a, b) => a + b, 0);
  const extraRidersNeeded = numRiders - riderIndex;

  // Only schedule extra riders if:
  // 1. We have riders left to schedule (extraRidersNeeded > 0)
  // 2. We met all target requirements (remainingSum === 0)
  if (extraRidersNeeded > 0 && remainingSum === 0) {
    const maxRemaining = {};
    Object.keys(shiftData).forEach(key => {
      maxRemaining[key] = shiftData[key].max - shiftData[key].target;
    });

    for (let i = 0; i < extraRidersNeeded; i++) {
      let bestPair = null;
      let bestScore = -Infinity;

      for (const [s1, s2] of consecutivePairs) {
        if (maxRemaining[s1] > 0 && maxRemaining[s2] > 0) {
          const tempRemaining = {...maxRemaining};
          tempRemaining[s1]--;
          tempRemaining[s2]--;

          let potentialWaste = 0;
          Object.keys(tempRemaining).forEach(slot => {
            // OPTIMIZATION: Use pre-computed PARTNERS_MAP
            const partners = PARTNERS_MAP[slot];
            const availablePartnerCap = partners.reduce((sum, p) => sum + tempRemaining[p], 0);
            if (tempRemaining[slot] > availablePartnerCap) {
              potentialWaste += (tempRemaining[slot] - availablePartnerCap);
            }
          });

          const minRemaining = Math.min(maxRemaining[s1], maxRemaining[s2]);
          const balance = 1 - Math.abs(maxRemaining[s1] - maxRemaining[s2]) / (maxRemaining[s1] + maxRemaining[s2] + 1);

          let score = 0;
          score -= potentialWaste * 100;
          score += (30 / (minRemaining + 1));
          score += balance * 15;
          score += 50;

          if (score > bestScore) {
            bestScore = score;
            bestPair = [s1, s2];
          }
        }
      }

      if (bestScore < 0 || bestPair === null) {
        for (const [s1, s2] of nonConsecutivePairs) {
          if (maxRemaining[s1] > 0 && maxRemaining[s2] > 0) {
            const tempRemaining = {...maxRemaining};
            tempRemaining[s1]--;
            tempRemaining[s2]--;

            let potentialWaste = 0;
            Object.keys(tempRemaining).forEach(slot => {
              // OPTIMIZATION: Use pre-computed PARTNERS_MAP
              const partners = PARTNERS_MAP[slot];
              const availablePartnerCap = partners.reduce((sum, p) => sum + tempRemaining[p], 0);
              if (tempRemaining[slot] > availablePartnerCap) {
                potentialWaste += (tempRemaining[slot] - availablePartnerCap);
              }
            });

            const minRemaining = Math.min(maxRemaining[s1], maxRemaining[s2]);
            const balance = 1 - Math.abs(maxRemaining[s1] - maxRemaining[s2]) / (maxRemaining[s1] + maxRemaining[s2] + 1);

            let score = 0;
            score -= potentialWaste * 100;
            score += (30 / (minRemaining + 1));
            score += balance * 15;

            if (score > bestScore) {
              bestScore = score;
              bestPair = [s1, s2];
            }
          }
        }
      }

      if (bestPair) {
        const [s1, s2] = bestPair;
        riderSchedule.push({
          riderId: ++riderIndex,
          shifts: [s1, s2],
          isExtra: true
        });
        maxRemaining[s1]--;
        maxRemaining[s2]--;
      } else {
        break;
      }
    }
  }

  const finalSchedule = riderSchedule.filter(r => r.shifts && r.shifts.length === SHIFTS_PER_RIDER);

  const consecutivePairsCount = finalSchedule.filter(rider =>
    isConsecutive(rider.shifts[0], rider.shifts[1])
  ).length;

  const extraRidersAssigned = finalSchedule.filter(r => r.isExtra).length;

  return {
    success: true,
    schedule: finalSchedule,
    consecutivePairs: consecutivePairsCount,
    extraRiders: extraRidersAssigned,
    warning: null
  };
};
