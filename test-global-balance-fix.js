/**
 * Test Script for Global Balance Fix
 * Tests the fix for the issue where 80 riders only scheduled 66
 *
 * Key test: targets 17,12,23,47,64,73 with max 18,12,24,48,66,75
 * The fix ensures small slots (like slot2=12) get paired with large slots (like slot6=73)
 * to maintain global balance and fill all targets before using max capacity.
 */

import { createSchedule6 } from './src/utils/scheduler6.js';

console.log('='.repeat(80));
console.log('GLOBAL BALANCE FIX - TEST SUITE');
console.log('='.repeat(80));
console.log();

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

/**
 * Validates a schedule result
 */
function validateSchedule(testName, riders, shiftData, result) {
  totalTests++;

  const totalTarget = Object.values(shiftData).reduce((sum, s) => sum + s.target, 0);
  const totalMax = Object.values(shiftData).reduce((sum, s) => sum + s.max, 0);
  const minRidersForTarget = Math.ceil(totalTarget / 3);
  const maxRidersPossible = Math.floor(totalMax / 3);

  // Count assigned shifts per slot
  const counts = {};
  Object.keys(shiftData).forEach(key => counts[key] = 0);
  result.schedule.forEach(r => r.shifts.forEach(s => counts[s]++));

  const errors = [];

  // Check 1: No shift exceeds its maximum
  Object.keys(shiftData).forEach(key => {
    if (counts[key] > shiftData[key].max) {
      errors.push(`${key}: ${counts[key]} exceeds max ${shiftData[key].max}`);
    }
  });

  // Check 2: Total riders scheduled shouldn't exceed input or max possible
  const expectedRiders = Math.min(riders, maxRidersPossible);
  if (result.schedule.length > expectedRiders) {
    errors.push(`Scheduled ${result.schedule.length} riders but expected max ${expectedRiders}`);
  }

  // Check 3: Each rider has exactly 3 shifts
  result.schedule.forEach((rider) => {
    if (rider.shifts.length !== 3) {
      errors.push(`Rider ${rider.riderId} has ${rider.shifts.length} shifts (should be 3)`);
    }
  });

  // Check 4: When riders >= minRidersForTarget, ALL targets should be met
  // This is the critical check for the bug fix
  if (riders >= minRidersForTarget && result.schedule.length >= minRidersForTarget) {
    Object.keys(shiftData).forEach(key => {
      if (counts[key] < shiftData[key].target) {
        errors.push(`TARGET NOT MET: ${key}: ${counts[key]} < target ${shiftData[key].target}`);
      }
    });
  }

  // Check 5: Verify scheduled riders count
  // When we have enough riders and capacity, we should schedule them all
  if (riders <= maxRidersPossible && result.schedule.length < riders) {
    // Check if this shortfall is due to targets being infeasible
    const totalScheduledShifts = result.schedule.length * 3;
    if (totalScheduledShifts < totalTarget && riders >= minRidersForTarget) {
      errors.push(`SCHEDULING SHORTFALL: Only scheduled ${result.schedule.length} riders instead of ${riders}`);
    }
  }

  // Report results
  if (errors.length > 0) {
    failedTests++;
    failures.push({
      testName,
      errors,
      riders,
      scheduled: result.schedule.length,
      counts,
      shiftData
    });
    console.log(`  FAIL: ${testName}`);
    errors.forEach(e => console.log(`    - ${e}`));
    return false;
  } else {
    passedTests++;
    const targetsMet = Object.keys(shiftData).every(key => counts[key] >= shiftData[key].target);
    console.log(`  PASS: ${testName} | Scheduled: ${result.schedule.length}/${riders} | Targets met: ${targetsMet ? 'YES' : 'NO'} | Consecutive: ${result.consecutiveTriplets}`);
    return true;
  }
}

// ============================================================================
// TEST GROUP 1: User's Exact Bug Scenario
// ============================================================================
console.log('\n' + '='.repeat(80));
console.log('TEST GROUP 1: User\'s Exact Bug Scenario');
console.log('Targets: 17,12,23,47,64,73 | Max: 18,12,24,48,66,75');
console.log('='.repeat(80));

const userScenario = {
  slot1: { target: 17, max: 18 },
  slot2: { target: 12, max: 12 },  // No extra capacity - bottleneck!
  slot3: { target: 23, max: 24 },
  slot4: { target: 47, max: 48 },
  slot5: { target: 64, max: 66 },
  slot6: { target: 73, max: 75 }
};

// Total target: 236, Total max: 243
// Min riders for target: ceil(236/3) = 79
// Max riders possible: floor(243/3) = 81

[60, 66, 70, 75, 79, 80, 81].forEach(riders => {
  const result = createSchedule6(riders, userScenario);
  validateSchedule(`User scenario with ${riders} riders`, riders, userScenario, result);
});

// ============================================================================
// TEST GROUP 2: Variations with slot2 as bottleneck (max = target)
// ============================================================================
console.log('\n' + '='.repeat(80));
console.log('TEST GROUP 2: Variations with bottleneck slot (max = target)');
console.log('='.repeat(80));

// Scenario 2a: Different distribution but similar bottleneck
const scenario2a = {
  slot1: { target: 20, max: 22 },
  slot2: { target: 15, max: 15 },  // Bottleneck
  slot3: { target: 25, max: 27 },
  slot4: { target: 40, max: 42 },
  slot5: { target: 50, max: 52 },
  slot6: { target: 60, max: 62 }
};
// Total target: 210, min riders: 70

[50, 60, 70, 72].forEach(riders => {
  const result = createSchedule6(riders, scenario2a);
  validateSchedule(`Scenario 2a (bottleneck slot2=15) with ${riders} riders`, riders, scenario2a, result);
});

// Scenario 2b: Two bottleneck slots
const scenario2b = {
  slot1: { target: 18, max: 18 },  // Bottleneck 1
  slot2: { target: 12, max: 12 },  // Bottleneck 2
  slot3: { target: 24, max: 26 },
  slot4: { target: 42, max: 44 },
  slot5: { target: 54, max: 56 },
  slot6: { target: 66, max: 68 }
};
// Total target: 216, min riders: 72

[50, 60, 72, 74].forEach(riders => {
  const result = createSchedule6(riders, scenario2b);
  validateSchedule(`Scenario 2b (two bottlenecks) with ${riders} riders`, riders, scenario2b, result);
});

// ============================================================================
// TEST GROUP 3: Highly imbalanced targets (large spread)
// ============================================================================
console.log('\n' + '='.repeat(80));
console.log('TEST GROUP 3: Highly imbalanced targets');
console.log('='.repeat(80));

// Scenario 3a: Very small slot vs very large slot
const scenario3a = {
  slot1: { target: 10, max: 12 },
  slot2: { target: 8, max: 8 },   // Smallest, bottleneck
  slot3: { target: 15, max: 17 },
  slot4: { target: 35, max: 37 },
  slot5: { target: 50, max: 52 },
  slot6: { target: 90, max: 92 }  // Largest
};
// Total target: 208, min riders: 70

[50, 60, 70, 72].forEach(riders => {
  const result = createSchedule6(riders, scenario3a);
  validateSchedule(`Scenario 3a (8 vs 90 spread) with ${riders} riders`, riders, scenario3a, result);
});

// Scenario 3b: Extreme imbalance
const scenario3b = {
  slot1: { target: 5, max: 6 },
  slot2: { target: 5, max: 5 },   // Bottleneck
  slot3: { target: 10, max: 11 },
  slot4: { target: 30, max: 31 },
  slot5: { target: 50, max: 51 },
  slot6: { target: 80, max: 81 }  // 16x larger than smallest
};
// Total target: 180, min riders: 60

[40, 50, 60, 61].forEach(riders => {
  const result = createSchedule6(riders, scenario3b);
  validateSchedule(`Scenario 3b (extreme imbalance 5 vs 80) with ${riders} riders`, riders, scenario3b, result);
});

// ============================================================================
// TEST GROUP 4: Equal targets (balanced baseline)
// ============================================================================
console.log('\n' + '='.repeat(80));
console.log('TEST GROUP 4: Balanced scenarios (sanity check)');
console.log('='.repeat(80));

// Scenario 4a: All equal targets
const scenario4a = {
  slot1: { target: 30, max: 32 },
  slot2: { target: 30, max: 32 },
  slot3: { target: 30, max: 32 },
  slot4: { target: 30, max: 32 },
  slot5: { target: 30, max: 32 },
  slot6: { target: 30, max: 32 }
};
// Total target: 180, min riders: 60

[40, 50, 60, 64].forEach(riders => {
  const result = createSchedule6(riders, scenario4a);
  validateSchedule(`Scenario 4a (all equal 30) with ${riders} riders`, riders, scenario4a, result);
});

// Scenario 4b: Gradually increasing
const scenario4b = {
  slot1: { target: 20, max: 22 },
  slot2: { target: 25, max: 27 },
  slot3: { target: 30, max: 32 },
  slot4: { target: 35, max: 37 },
  slot5: { target: 40, max: 42 },
  slot6: { target: 45, max: 47 }
};
// Total target: 195, min riders: 65

[45, 55, 65, 68].forEach(riders => {
  const result = createSchedule6(riders, scenario4b);
  validateSchedule(`Scenario 4b (gradually increasing) with ${riders} riders`, riders, scenario4b, result);
});

// ============================================================================
// TEST GROUP 5: Edge cases
// ============================================================================
console.log('\n' + '='.repeat(80));
console.log('TEST GROUP 5: Edge cases');
console.log('='.repeat(80));

// Scenario 5a: All max = target (no extra capacity anywhere)
const scenario5a = {
  slot1: { target: 18, max: 18 },
  slot2: { target: 12, max: 12 },
  slot3: { target: 24, max: 24 },
  slot4: { target: 36, max: 36 },
  slot5: { target: 48, max: 48 },
  slot6: { target: 60, max: 60 }
};
// Total: 198, exactly 66 riders

[50, 60, 66, 70].forEach(riders => {
  const result = createSchedule6(riders, scenario5a);
  validateSchedule(`Scenario 5a (all max=target) with ${riders} riders`, riders, scenario5a, result);
});

// Scenario 5b: One very constrained slot
const scenario5b = {
  slot1: { target: 6, max: 6 },   // Very small bottleneck
  slot2: { target: 30, max: 35 },
  slot3: { target: 30, max: 35 },
  slot4: { target: 30, max: 35 },
  slot5: { target: 30, max: 35 },
  slot6: { target: 30, max: 35 }
};
// Total target: 156, min riders: 52

[40, 52, 55].forEach(riders => {
  const result = createSchedule6(riders, scenario5b);
  validateSchedule(`Scenario 5b (one tiny bottleneck=6) with ${riders} riders`, riders, scenario5b, result);
});

// Scenario 5c: Total not divisible by 3
const scenario5c = {
  slot1: { target: 17, max: 19 },
  slot2: { target: 13, max: 14 },
  slot3: { target: 23, max: 25 },
  slot4: { target: 41, max: 43 },
  slot5: { target: 53, max: 55 },
  slot6: { target: 67, max: 69 }
};
// Total target: 214 (not divisible by 3), min riders: 72

[60, 72, 75].forEach(riders => {
  const result = createSchedule6(riders, scenario5c);
  validateSchedule(`Scenario 5c (total 214, not div by 3) with ${riders} riders`, riders, scenario5c, result);
});

// ============================================================================
// TEST GROUP 6: Small numbers (different algorithm path)
// ============================================================================
console.log('\n' + '='.repeat(80));
console.log('TEST GROUP 6: Small numbers (< 15 riders)');
console.log('='.repeat(80));

const scenario6 = {
  slot1: { target: 6, max: 7 },
  slot2: { target: 4, max: 4 },
  slot3: { target: 5, max: 6 },
  slot4: { target: 8, max: 9 },
  slot5: { target: 10, max: 11 },
  slot6: { target: 12, max: 13 }
};
// Total target: 45, min riders: 15 (borderline)

[8, 10, 12, 15, 16].forEach(riders => {
  const result = createSchedule6(riders, scenario6);
  validateSchedule(`Scenario 6 (small numbers) with ${riders} riders`, riders, scenario6, result);
});

// ============================================================================
// DETAILED TEST: User's exact input with detailed output
// ============================================================================
console.log('\n' + '='.repeat(80));
console.log('DETAILED TEST: User\'s exact scenario (80 riders)');
console.log('='.repeat(80));

const detailedResult = createSchedule6(80, userScenario);
const detailedCounts = {};
Object.keys(userScenario).forEach(key => detailedCounts[key] = 0);
detailedResult.schedule.forEach(r => r.shifts.forEach(s => detailedCounts[s]++));

console.log('\nInput:');
console.log('  Riders requested: 80');
console.log('  Targets: slot1=17, slot2=12, slot3=23, slot4=47, slot5=64, slot6=73 (Total: 236)');
console.log('  Max:     slot1=18, slot2=12, slot3=24, slot4=48, slot5=66, slot6=75 (Total: 243)');

console.log('\nOutput:');
console.log(`  Riders scheduled: ${detailedResult.schedule.length}`);
console.log(`  Consecutive triplets: ${detailedResult.consecutiveTriplets}`);
console.log(`  Partially consecutive: ${detailedResult.partiallyConsecutive}`);
console.log(`  Non-consecutive: ${detailedResult.nonConsecutive}`);

console.log('\nShift distribution:');
Object.keys(userScenario).forEach(key => {
  const target = userScenario[key].target;
  const max = userScenario[key].max;
  const actual = detailedCounts[key];
  const status = actual >= target ? 'OK' : 'UNDER';
  const overMax = actual > max ? ' OVER MAX!' : '';
  console.log(`  ${key}: ${actual}/${target} target, ${max} max [${status}]${overMax}`);
});

const totalScheduled = Object.values(detailedCounts).reduce((a, b) => a + b, 0);
console.log(`\nTotal shifts: ${totalScheduled} (expected: ${80 * 3} = 240)`);

// Check if bug is fixed
const allTargetsMet = Object.keys(userScenario).every(key =>
  detailedCounts[key] >= userScenario[key].target
);
const noMaxExceeded = Object.keys(userScenario).every(key =>
  detailedCounts[key] <= userScenario[key].max
);

console.log('\nBug fix verification:');
console.log(`  All targets met: ${allTargetsMet ? 'YES' : 'NO'}`);
console.log(`  No max exceeded: ${noMaxExceeded ? 'YES' : 'NO'}`);
console.log(`  Expected 80 riders, got ${detailedResult.schedule.length}: ${detailedResult.schedule.length === 80 ? 'PASS' : 'FAIL'}`);

// ============================================================================
// FINAL SUMMARY
// ============================================================================
console.log('\n' + '='.repeat(80));
console.log('FINAL TEST SUMMARY');
console.log('='.repeat(80));
console.log(`Total tests: ${totalTests}`);
console.log(`Passed: ${passedTests} (${((passedTests / totalTests) * 100).toFixed(1)}%)`);
console.log(`Failed: ${failedTests} (${((failedTests / totalTests) * 100).toFixed(1)}%)`);

if (failures.length > 0) {
  console.log('\n' + '='.repeat(80));
  console.log('FAILED TESTS DETAILS');
  console.log('='.repeat(80));
  failures.forEach((failure, idx) => {
    console.log(`\n${idx + 1}. ${failure.testName}`);
    console.log(`   Riders: ${failure.riders}, Scheduled: ${failure.scheduled}`);
    console.log(`   Counts: ${JSON.stringify(failure.counts)}`);
    console.log(`   Errors:`);
    failure.errors.forEach(e => console.log(`     - ${e}`));
  });
}

console.log('\n' + '='.repeat(80));
if (failedTests === 0) {
  console.log('ALL TESTS PASSED! Global balance fix is working correctly.');
} else {
  console.log(`${failedTests} TEST(S) FAILED. Review the details above.`);
}
console.log('='.repeat(80));
