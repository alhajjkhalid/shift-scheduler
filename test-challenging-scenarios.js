/**
 * Test Script for Challenging 6-Shift Scenarios
 *
 * These scenarios are designed to create situations where 100% consecutive
 * triplets are mathematically impossible or very difficult to achieve.
 */

import { createSchedule6 } from './src/utils/scheduler6.js';

console.log('='.repeat(100));
console.log('6-SHIFT ALGORITHM - CHALLENGING SCENARIOS TEST');
console.log('='.repeat(100));
console.log();

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

// ============================================================================
// CHALLENGING TEST SCENARIOS
// ============================================================================

const challengingScenarios = [
  {
    name: 'Scenario 1: Highly Imbalanced - One Dominant Shift',
    description: 'Slot 3 requires 80% of capacity, forcing non-consecutive',
    riders: 30,
    shiftData: {
      slot1: { target: 5, max: 10 },
      slot2: { target: 5, max: 10 },
      slot3: { target: 40, max: 50 },  // Massive demand
      slot4: { target: 5, max: 10 },
      slot5: { target: 5, max: 10 },
      slot6: { target: 5, max: 10 }
    }
  },
  {
    name: 'Scenario 2: Two Dominant Non-Adjacent Shifts',
    description: 'Slot 1 and Slot 4 both high demand, not consecutive',
    riders: 35,
    shiftData: {
      slot1: { target: 30, max: 40 },
      slot2: { target: 8, max: 12 },
      slot3: { target: 8, max: 12 },
      slot4: { target: 30, max: 40 },
      slot5: { target: 8, max: 12 },
      slot6: { target: 8, max: 12 }
    }
  },
  {
    name: 'Scenario 3: Alternating High/Low Pattern',
    description: 'High-Low-High-Low pattern that breaks consecutive triplets',
    riders: 40,
    shiftData: {
      slot1: { target: 30, max: 35 },
      slot2: { target: 5, max: 10 },
      slot3: { target: 30, max: 35 },
      slot4: { target: 5, max: 10 },
      slot5: { target: 30, max: 35 },
      slot6: { target: 5, max: 10 }
    }
  },
  {
    name: 'Scenario 4: Odd Number Shifts (Indivisible by 3)',
    description: '41 total shifts - cannot form perfect triplets',
    riders: 14,
    shiftData: {
      slot1: { target: 7, max: 10 },
      slot2: { target: 7, max: 10 },
      slot3: { target: 7, max: 10 },
      slot4: { target: 7, max: 10 },
      slot5: { target: 7, max: 10 },
      slot6: { target: 6, max: 10 }  // 41 total
    }
  },
  {
    name: 'Scenario 5: Realistic Peak Hours',
    description: 'Realistic demand: high lunch/dinner, low midnight',
    riders: 50,
    shiftData: {
      slot1: { target: 10, max: 15 },   // Midnight - low
      slot2: { target: 15, max: 20 },   // Early Morning - medium
      slot3: { target: 25, max: 30 },   // Morning - high
      slot4: { target: 30, max: 35 },   // Lunch - peak
      slot5: { target: 25, max: 30 },   // Evening - high
      slot6: { target: 30, max: 35 }    // Dinner - peak
    }
  },
  {
    name: 'Scenario 6: Prime Number Riders (Harder to Distribute)',
    description: '37 riders - prime number creates distribution challenges',
    riders: 37,
    shiftData: {
      slot1: { target: 19, max: 25 },
      slot2: { target: 19, max: 25 },
      slot3: { target: 18, max: 25 },
      slot4: { target: 19, max: 25 },
      slot5: { target: 19, max: 25 },
      slot6: { target: 18, max: 25 }
    }
  },
  {
    name: 'Scenario 7: Extreme Imbalance - Single Bottleneck',
    description: 'Slot 2 has very low capacity, creates bottleneck',
    riders: 30,
    shiftData: {
      slot1: { target: 20, max: 25 },
      slot2: { target: 3, max: 5 },     // Bottleneck
      slot3: { target: 20, max: 25 },
      slot4: { target: 20, max: 25 },
      slot5: { target: 20, max: 25 },
      slot6: { target: 20, max: 25 }
    }
  },
  {
    name: 'Scenario 8: Small Uneven (Edge Case)',
    description: 'Small numbers with uneven distribution',
    riders: 12,
    shiftData: {
      slot1: { target: 8, max: 10 },
      slot2: { target: 4, max: 8 },
      slot3: { target: 8, max: 10 },
      slot4: { target: 4, max: 8 },
      slot5: { target: 8, max: 10 },
      slot6: { target: 4, max: 8 }
    }
  }
];

// ============================================================================
// RUN CHALLENGING TESTS
// ============================================================================

for (const scenario of challengingScenarios) {
  console.log('='.repeat(100));
  console.log(`${scenario.name}`);
  console.log(`Description: ${scenario.description}`);
  console.log('='.repeat(100));

  const result = createSchedule6(scenario.riders, scenario.shiftData);
  const schedule = result.schedule;

  let consecutiveCount = 0;
  let partialCount = 0;
  let nonConsecCount = 0;

  // Analyze shift distribution
  const shiftCounts = {
    slot1: 0, slot2: 0, slot3: 0, slot4: 0, slot5: 0, slot6: 0
  };

  schedule.forEach(rider => {
    rider.shifts.forEach(shift => {
      shiftCounts[shift]++;
    });

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
  const totalShifts = schedule.length * 3;

  console.log();
  console.log('Configuration:');
  console.log(`  Total Riders: ${scenario.riders}`);
  console.log(`  Target Shifts: slot1=${scenario.shiftData.slot1.target}, slot2=${scenario.shiftData.slot2.target}, slot3=${scenario.shiftData.slot3.target}, slot4=${scenario.shiftData.slot4.target}, slot5=${scenario.shiftData.slot5.target}, slot6=${scenario.shiftData.slot6.target}`);
  console.log();
  console.log('Results:');
  console.log(`  Riders Scheduled: ${totalRiders}`);
  console.log(`  Total Shifts Assigned: ${totalShifts}`);
  console.log(`  Consecutive Triplets: ${consecutiveCount} (${consecutivePercentage.toFixed(1)}%)`);
  console.log(`  Partial Consecutive: ${partialCount}`);
  console.log(`  Non-Consecutive: ${nonConsecCount}`);
  console.log();
  console.log('Shift Distribution:');
  Object.keys(shiftCounts).forEach(slot => {
    const target = scenario.shiftData[slot].target;
    const actual = shiftCounts[slot];
    const diff = actual - target;
    const diffStr = diff >= 0 ? `+${diff}` : `${diff}`;
    console.log(`  ${slot}: ${actual}/${target} (${diffStr})`);
  });
  console.log();
}

// ============================================================================
// SUMMARY
// ============================================================================

console.log('='.repeat(100));
console.log('ANALYSIS SUMMARY');
console.log('='.repeat(100));
console.log();
console.log('These scenarios test the algorithm under challenging conditions:');
console.log('- Highly imbalanced shift demands');
console.log('- Non-consecutive dominant shifts');
console.log('- Bottleneck situations');
console.log('- Prime numbers and odd distributions');
console.log();
console.log('The results show how well the algorithm handles real-world constraints');
console.log('where 100% consecutive triplets may not be mathematically possible.');
console.log('='.repeat(100));
