/**
 * Test Script for 6-Shift Consecutive Improvement Analysis
 *
 * This script tests multiple experimental algorithms against the current one
 * to find ways to increase consecutive triplet percentages.
 */

import { createSchedule6 } from './src/utils/scheduler6.js';

// Import the core functions we need
const SHIFTS_PER_RIDER = 3;

const PARTNERS_MAP = {
  slot1: ['slot2', 'slot6', 'slot3', 'slot4', 'slot5'],
  slot2: ['slot1', 'slot3', 'slot4', 'slot5', 'slot6'],
  slot3: ['slot2', 'slot4', 'slot1', 'slot5', 'slot6'],
  slot4: ['slot3', 'slot5', 'slot1', 'slot2', 'slot6'],
  slot5: ['slot4', 'slot6', 'slot1', 'slot2', 'slot3'],
  slot6: ['slot5', 'slot1', 'slot2', 'slot3', 'slot4']
};

const CONSECUTIVE_TRIPLETS = [
  ['slot1', 'slot2', 'slot3'],
  ['slot2', 'slot3', 'slot4'],
  ['slot3', 'slot4', 'slot5'],
  ['slot4', 'slot5', 'slot6'],
  ['slot5', 'slot6', 'slot1'],
  ['slot6', 'slot1', 'slot2'],
];

const isConsecutiveTriplet = (shift1, shift2, shift3) => {
  const sortedShifts = [shift1, shift2, shift3].sort();
  return CONSECUTIVE_TRIPLETS.some(triplet => {
    const sortedTriplet = [...triplet].sort();
    return sortedShifts[0] === sortedTriplet[0] &&
           sortedShifts[1] === sortedTriplet[1] &&
           sortedShifts[2] === sortedTriplet[2];
  });
};

const CONSECUTIVE_PAIRS = [
  ['slot1', 'slot2'],
  ['slot2', 'slot3'],
  ['slot3', 'slot4'],
  ['slot4', 'slot5'],
  ['slot5', 'slot6'],
  ['slot6', 'slot1'],
];

const isConsecutivePair = (shift1, shift2) => {
  return CONSECUTIVE_PAIRS.some(([s1, s2]) =>
    (shift1 === s1 && shift2 === s2) || (shift1 === s2 && shift2 === s1)
  );
};

const hasConsecutivePair = (shifts) => {
  for (let i = 0; i < shifts.length; i++) {
    for (let j = i + 1; j < shifts.length; j++) {
      if (isConsecutivePair(shifts[i], shifts[j])) {
        return true;
      }
    }
  }
  return false;
};

const canFormValidTriplets = (remaining) => {
  const totalRemaining = Object.values(remaining).reduce((a, b) => a + b, 0);
  if (totalRemaining === 0) return true;
  if (totalRemaining % SHIFTS_PER_RIDER !== 0) return false;

  for (const shift in remaining) {
    if (remaining[shift] > 0) {
      const partners = PARTNERS_MAP[shift];
      const partnerCap = partners.reduce((sum, p) => sum + (remaining[p] || 0), 0);
      if (remaining[shift] * 2 > partnerCap) {
        return false;
      }
    }
  }
  return true;
};

const getAllPossibleTriplets = () => {
  const slots = ['slot1', 'slot2', 'slot3', 'slot4', 'slot5', 'slot6'];
  const triplets = [];
  triplets.push(...CONSECUTIVE_TRIPLETS);
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

// ============================================================================
// EXPERIMENTAL ALGORITHM 1: Ultra-Aggressive Consecutive
// ============================================================================
const createSchedule_Experiment1 = (numRiders, shiftData) => {
  const totalTargetShifts = Object.values(shiftData).reduce((sum, s) => sum + s.target, 0);
  const minRidersForTarget = totalTargetShifts / SHIFTS_PER_RIDER;

  const riderSchedule = [];
  let riderIndex = 0;

  const targetRemaining = {};
  Object.keys(shiftData).forEach(key => {
    targetRemaining[key] = shiftData[key].target;
  });

  const allTriplets = getAllPossibleTriplets();
  const ridersToScheduleForTarget = Math.min(numRiders, minRidersForTarget);

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

        // EXPERIMENTAL: Massive consecutive bonus, heavy non-consecutive penalty
        if (isConsec) {
          score += 5000;
        } else {
          score -= 1000; // Penalty for non-consecutive
          if (hasConsecutivePair(triplet)) {
            score += 200; // Small bonus for partial
          }
        }

        // Light bottleneck awareness
        let totalRatio = 0;
        for (const slot of triplet) {
          const partners = PARTNERS_MAP[slot];
          const partnerCap = partners.reduce((sum, p) => sum + (tempRemaining[p] || 0), 0);
          const ratio = tempRemaining[slot] > 0 ? tempRemaining[slot] / (partnerCap + 1) : 0;
          totalRatio += ratio;
        }
        score -= totalRatio * 10;

        if (score > bestScore) {
          bestScore = score;
          bestTriplet = triplet;
        }
      }
    }

    if (!bestTriplet) break;

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

  return riderSchedule;
};

// ============================================================================
// EXPERIMENTAL ALGORITHM 2: Two-Pass Greedy
// ============================================================================
const createSchedule_Experiment2 = (numRiders, shiftData) => {
  const totalTargetShifts = Object.values(shiftData).reduce((sum, s) => sum + s.target, 0);
  const minRidersForTarget = totalTargetShifts / SHIFTS_PER_RIDER;

  const riderSchedule = [];
  let riderIndex = 0;

  const targetRemaining = {};
  Object.keys(shiftData).forEach(key => {
    targetRemaining[key] = shiftData[key].target;
  });

  const ridersToScheduleForTarget = Math.min(numRiders, minRidersForTarget);

  // PASS 1: Only consecutive triplets
  for (let iteration = 0; iteration < ridersToScheduleForTarget; iteration++) {
    const remaining = Object.values(targetRemaining).reduce((a, b) => a + b, 0);
    if (remaining < SHIFTS_PER_RIDER) break;

    let bestTriplet = null;
    let bestScore = -Infinity;

    // Try only consecutive triplets
    for (const triplet of CONSECUTIVE_TRIPLETS) {
      const [s1, s2, s3] = triplet;

      if (targetRemaining[s1] > 0 && targetRemaining[s2] > 0 && targetRemaining[s3] > 0) {
        const tempRemaining = {...targetRemaining};
        tempRemaining[s1]--;
        tempRemaining[s2]--;
        tempRemaining[s3]--;

        if (!canFormValidTriplets(tempRemaining)) {
          continue;
        }

        // Simple scoring: prefer larger remaining capacities
        const score = targetRemaining[s1] + targetRemaining[s2] + targetRemaining[s3];

        if (score > bestScore) {
          bestScore = score;
          bestTriplet = triplet;
        }
      }
    }

    if (!bestTriplet) break; // No more consecutive available

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

  // PASS 2: Fill remaining with any valid triplet
  const allTriplets = getAllPossibleTriplets();
  for (let iteration = riderIndex; iteration < ridersToScheduleForTarget; iteration++) {
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

        if (isConsec) {
          score += 1000;
        } else if (hasConsecutivePair(triplet)) {
          score += 100;
        }

        if (score > bestScore) {
          bestScore = score;
          bestTriplet = triplet;
        }
      }
    }

    if (!bestTriplet) break;

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

  return riderSchedule;
};

// ============================================================================
// EXPERIMENTAL ALGORITHM 3: Weighted Consecutive Priority
// ============================================================================
const createSchedule_Experiment3 = (numRiders, shiftData) => {
  const totalTargetShifts = Object.values(shiftData).reduce((sum, s) => sum + s.target, 0);
  const minRidersForTarget = totalTargetShifts / SHIFTS_PER_RIDER;

  const riderSchedule = [];
  let riderIndex = 0;

  const targetRemaining = {};
  Object.keys(shiftData).forEach(key => {
    targetRemaining[key] = shiftData[key].target;
  });

  const allTriplets = getAllPossibleTriplets();
  const ridersToScheduleForTarget = Math.min(numRiders, minRidersForTarget);

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

        // Much higher consecutive bonus
        if (isConsec) {
          score += 1000;
        } else if (hasConsecutivePair(triplet)) {
          score += 100;
        }

        // Lighter bottleneck penalty
        let totalRatio = 0;
        for (const slot of triplet) {
          const partners = PARTNERS_MAP[slot];
          const partnerCap = partners.reduce((sum, p) => sum + (tempRemaining[p] || 0), 0);
          const ratio = tempRemaining[slot] > 0 ? tempRemaining[slot] / (partnerCap + 1) : 0;
          totalRatio += ratio;
        }
        score -= totalRatio * 10; // Reduced from 30

        // No balance scoring (it conflicts with consecutive priority)

        if (score > bestScore) {
          bestScore = score;
          bestTriplet = triplet;
        }
      }
    }

    if (!bestTriplet) break;

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

  return riderSchedule;
};

// ============================================================================
// EXPERIMENTAL ALGORITHM 4: Dynamic Consecutive Bonus
// ============================================================================
const createSchedule_Experiment4 = (numRiders, shiftData) => {
  const totalTargetShifts = Object.values(shiftData).reduce((sum, s) => sum + s.target, 0);
  const minRidersForTarget = totalTargetShifts / SHIFTS_PER_RIDER;

  const riderSchedule = [];
  let riderIndex = 0;

  const targetRemaining = {};
  Object.keys(shiftData).forEach(key => {
    targetRemaining[key] = shiftData[key].target;
  });

  const allTriplets = getAllPossibleTriplets();
  const ridersToScheduleForTarget = Math.min(numRiders, minRidersForTarget);

  for (let iteration = 0; iteration < ridersToScheduleForTarget; iteration++) {
    const remaining = Object.values(targetRemaining).reduce((a, b) => a + b, 0);
    if (remaining < SHIFTS_PER_RIDER) break;

    let bestTriplet = null;
    let bestScore = -Infinity;

    // Dynamic bonus: increases as we schedule more riders
    const progress = iteration / ridersToScheduleForTarget;
    const consecutiveBonus = 150 + (progress * 850); // 150 -> 1000

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

        if (isConsec) {
          score += consecutiveBonus;
        } else if (hasConsecutivePair(triplet)) {
          score += 50;
        }

        let totalRatio = 0;
        for (const slot of triplet) {
          const partners = PARTNERS_MAP[slot];
          const partnerCap = partners.reduce((sum, p) => sum + (tempRemaining[p] || 0), 0);
          const ratio = tempRemaining[slot] > 0 ? tempRemaining[slot] / (partnerCap + 1) : 0;
          totalRatio += ratio;
        }
        score -= totalRatio * 30;

        const values = [targetRemaining[s1], targetRemaining[s2], targetRemaining[s3]];
        const max = Math.max(...values);
        const min = Math.min(...values);
        const balance = 1 - (max - min) / (max + 1);
        score += balance * 20;

        if (score > bestScore) {
          bestScore = score;
          bestTriplet = triplet;
        }
      }
    }

    if (!bestTriplet) break;

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

  return riderSchedule;
};

// ============================================================================
// TEST SCENARIOS
// ============================================================================

const testScenarios = [
  {
    name: 'Small - Even Distribution (20 riders)',
    riders: 20,
    shiftData: {
      slot1: { target: 10, max: 15 },
      slot2: { target: 10, max: 15 },
      slot3: { target: 10, max: 15 },
      slot4: { target: 10, max: 15 },
      slot5: { target: 10, max: 15 },
      slot6: { target: 10, max: 15 }
    }
  },
  {
    name: 'Medium - Even Distribution (40 riders)',
    riders: 40,
    shiftData: {
      slot1: { target: 20, max: 25 },
      slot2: { target: 20, max: 25 },
      slot3: { target: 20, max: 25 },
      slot4: { target: 20, max: 25 },
      slot5: { target: 20, max: 25 },
      slot6: { target: 20, max: 25 }
    }
  },
  {
    name: 'Large - Even Distribution (100 riders)',
    riders: 100,
    shiftData: {
      slot1: { target: 50, max: 60 },
      slot2: { target: 50, max: 60 },
      slot3: { target: 50, max: 60 },
      slot4: { target: 50, max: 60 },
      slot5: { target: 50, max: 60 },
      slot6: { target: 50, max: 60 }
    }
  },
  {
    name: 'Uneven - Peak Hours (40 riders)',
    riders: 40,
    shiftData: {
      slot1: { target: 15, max: 20 },
      slot2: { target: 20, max: 25 },
      slot3: { target: 25, max: 30 },
      slot4: { target: 25, max: 30 },
      slot5: { target: 20, max: 25 },
      slot6: { target: 15, max: 20 }
    }
  },
  {
    name: 'Very Large - Even Distribution (200 riders)',
    riders: 200,
    shiftData: {
      slot1: { target: 100, max: 120 },
      slot2: { target: 100, max: 120 },
      slot3: { target: 100, max: 120 },
      slot4: { target: 100, max: 120 },
      slot5: { target: 100, max: 120 },
      slot6: { target: 100, max: 120 }
    }
  }
];

// ============================================================================
// RUN TESTS
// ============================================================================

console.log('='.repeat(100));
console.log('6-SHIFT CONSECUTIVE IMPROVEMENT ANALYSIS');
console.log('='.repeat(100));
console.log();

const algorithms = [
  { name: 'Current Algorithm', func: (r, s) => createSchedule6(r, s).schedule },
  { name: 'Exp 1: Ultra-Aggressive', func: createSchedule_Experiment1 },
  { name: 'Exp 2: Two-Pass Greedy', func: createSchedule_Experiment2 },
  { name: 'Exp 3: Weighted Priority', func: createSchedule_Experiment3 },
  { name: 'Exp 4: Dynamic Bonus', func: createSchedule_Experiment4 }
];

const results = [];

for (const scenario of testScenarios) {
  console.log('='.repeat(100));
  console.log(`SCENARIO: ${scenario.name}`);
  console.log('='.repeat(100));
  console.log();

  const scenarioResults = {
    name: scenario.name,
    algorithms: []
  };

  for (const algo of algorithms) {
    const schedule = algo.func(scenario.riders, scenario.shiftData);

    let consecutiveCount = 0;
    let partialCount = 0;
    let nonConsecCount = 0;

    schedule.forEach(rider => {
      if (isConsecutiveTriplet(rider.shifts[0], rider.shifts[1], rider.shifts[2])) {
        consecutiveCount++;
      } else if (hasConsecutivePair(rider.shifts)) {
        partialCount++;
      } else {
        nonConsecCount++;
      }
    });

    const totalRiders = schedule.length;
    const consecutivePercentage = totalRiders > 0 ? (consecutiveCount / totalRiders) * 100 : 0;

    console.log(`${algo.name}:`);
    console.log(`  Total Riders: ${totalRiders}`);
    console.log(`  Consecutive Triplets: ${consecutiveCount} (${consecutivePercentage.toFixed(1)}%)`);
    console.log(`  Partial Consecutive: ${partialCount}`);
    console.log(`  Non-Consecutive: ${nonConsecCount}`);
    console.log();

    scenarioResults.algorithms.push({
      name: algo.name,
      totalRiders,
      consecutiveCount,
      consecutivePercentage,
      partialCount,
      nonConsecCount
    });
  }

  results.push(scenarioResults);
}

// ============================================================================
// SUMMARY
// ============================================================================

console.log('='.repeat(100));
console.log('SUMMARY: AVERAGE CONSECUTIVE PERCENTAGES');
console.log('='.repeat(100));
console.log();

for (const algo of algorithms) {
  let totalPercentage = 0;
  let count = 0;

  for (const scenario of results) {
    const algoResult = scenario.algorithms.find(a => a.name === algo.name);
    if (algoResult) {
      totalPercentage += algoResult.consecutivePercentage;
      count++;
    }
  }

  const avgPercentage = count > 0 ? totalPercentage / count : 0;
  console.log(`${algo.name}: ${avgPercentage.toFixed(2)}% average consecutive`);
}

console.log();
console.log('='.repeat(100));
console.log('TEST COMPLETE');
console.log('='.repeat(100));
