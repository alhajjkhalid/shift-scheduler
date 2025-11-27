/**
 * Comprehensive Test Script for 6-Shift Tool
 * Tests multiple shift configurations with various rider counts
 */

import { createSchedule6 } from './src/utils/scheduler6.js';

console.log('='.repeat(80));
console.log('COMPREHENSIVE 6-SHIFT TESTING');
console.log('='.repeat(80));
console.log();

// Test scenarios organized by groups
const testScenarios = [
  // Group 1 - Large targets
  {
    name: 'Group 1 - Scenario 1: Equal target/max (Large)',
    shifts: {
      slot1: { target: 41, max: 41 },
      slot2: { target: 18, max: 18 },
      slot3: { target: 25, max: 25 },
      slot4: { target: 61, max: 61 },
      slot5: { target: 63, max: 63 },
      slot6: { target: 93, max: 93 }
    }
  },
  {
    name: 'Group 1 - Scenario 2: Small margin (Large)',
    shifts: {
      slot1: { target: 41, max: 43 },
      slot2: { target: 18, max: 19 },
      slot3: { target: 25, max: 26 },
      slot4: { target: 61, max: 73 },
      slot5: { target: 63, max: 69 },
      slot6: { target: 93, max: 102 }
    }
  },
  {
    name: 'Group 1 - Scenario 3: Medium margin (Large)',
    shifts: {
      slot1: { target: 41, max: 53 },
      slot2: { target: 18, max: 23 },
      slot3: { target: 25, max: 33 },
      slot4: { target: 61, max: 92 },
      slot5: { target: 63, max: 95 },
      slot6: { target: 93, max: 140 }
    }
  },
  {
    name: 'Group 1 - Scenario 4: Large margin (Large)',
    shifts: {
      slot1: { target: 41, max: 62 },
      slot2: { target: 18, max: 27 },
      slot3: { target: 25, max: 38 },
      slot4: { target: 61, max: 122 },
      slot5: { target: 63, max: 126 },
      slot6: { target: 93, max: 186 }
    }
  },
  // Group 2 - Medium targets
  {
    name: 'Group 2 - Scenario 1: Equal target/max (Medium)',
    shifts: {
      slot1: { target: 22, max: 22 },
      slot2: { target: 10, max: 10 },
      slot3: { target: 14, max: 14 },
      slot4: { target: 34, max: 34 },
      slot5: { target: 34, max: 34 },
      slot6: { target: 51, max: 51 }
    }
  },
  {
    name: 'Group 2 - Scenario 2: Small margin (Medium)',
    shifts: {
      slot1: { target: 22, max: 23 },
      slot2: { target: 10, max: 11 },
      slot3: { target: 14, max: 15 },
      slot4: { target: 34, max: 41 },
      slot5: { target: 34, max: 37 },
      slot6: { target: 51, max: 56 }
    }
  },
  {
    name: 'Group 2 - Scenario 3: Medium margin (Medium)',
    shifts: {
      slot1: { target: 22, max: 29 },
      slot2: { target: 10, max: 13 },
      slot3: { target: 14, max: 18 },
      slot4: { target: 34, max: 51 },
      slot5: { target: 34, max: 51 },
      slot6: { target: 51, max: 77 }
    }
  },
  {
    name: 'Group 2 - Scenario 4: Large margin (Medium)',
    shifts: {
      slot1: { target: 22, max: 33 },
      slot2: { target: 10, max: 15 },
      slot3: { target: 14, max: 21 },
      slot4: { target: 34, max: 68 },
      slot5: { target: 34, max: 68 },
      slot6: { target: 51, max: 102 }
    }
  },
  // Group 3 - Small targets
  {
    name: 'Group 3 - Scenario 1: Equal target/max (Small)',
    shifts: {
      slot1: { target: 13, max: 13 },
      slot2: { target: 6, max: 6 },
      slot3: { target: 8, max: 8 },
      slot4: { target: 20, max: 20 },
      slot5: { target: 20, max: 20 },
      slot6: { target: 30, max: 30 }
    }
  },
  {
    name: 'Group 3 - Scenario 2: Small margin (Small)',
    shifts: {
      slot1: { target: 13, max: 14 },
      slot2: { target: 6, max: 6 },
      slot3: { target: 8, max: 8 },
      slot4: { target: 20, max: 24 },
      slot5: { target: 20, max: 22 },
      slot6: { target: 30, max: 33 }
    }
  },
  {
    name: 'Group 3 - Scenario 3: Medium margin (Small)',
    shifts: {
      slot1: { target: 13, max: 17 },
      slot2: { target: 6, max: 8 },
      slot3: { target: 8, max: 10 },
      slot4: { target: 20, max: 30 },
      slot5: { target: 20, max: 30 },
      slot6: { target: 30, max: 45 }
    }
  },
  {
    name: 'Group 3 - Scenario 4: Large margin (Small)',
    shifts: {
      slot1: { target: 13, max: 20 },
      slot2: { target: 6, max: 9 },
      slot3: { target: 8, max: 12 },
      slot4: { target: 20, max: 40 },
      slot5: { target: 20, max: 40 },
      slot6: { target: 30, max: 60 }
    }
  },
  // Group 4 - Very small targets (User's exact example)
  {
    name: 'Group 4 - Scenario 1: Equal target/max (Very Small)',
    shifts: {
      slot1: { target: 6, max: 6 },
      slot2: { target: 2, max: 2 },
      slot3: { target: 4, max: 4 },
      slot4: { target: 9, max: 9 },
      slot5: { target: 9, max: 9 },
      slot6: { target: 15, max: 15 }
    }
  },
  {
    name: 'Group 4 - Scenario 2: Small margin (Very Small)',
    shifts: {
      slot1: { target: 6, max: 6 },
      slot2: { target: 2, max: 2 },
      slot3: { target: 4, max: 4 },
      slot4: { target: 9, max: 11 },
      slot5: { target: 9, max: 10 },
      slot6: { target: 15, max: 17 }
    }
  },
  {
    name: 'Group 4 - Scenario 3: Medium margin (Very Small)',
    shifts: {
      slot1: { target: 6, max: 8 },
      slot2: { target: 2, max: 3 },
      slot3: { target: 4, max: 5 },
      slot4: { target: 9, max: 14 },
      slot5: { target: 9, max: 14 },
      slot6: { target: 15, max: 23 }
    }
  },
  {
    name: 'Group 4 - Scenario 4: Large margin (Very Small) - USER EXAMPLE',
    shifts: {
      slot1: { target: 6, max: 9 },
      slot2: { target: 2, max: 3 },
      slot3: { target: 4, max: 6 },
      slot4: { target: 9, max: 18 },
      slot5: { target: 9, max: 18 },
      slot6: { target: 15, max: 30 }
    }
  }
];

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

// Test each scenario with multiple rider counts
testScenarios.forEach((scenario, scenarioIndex) => {
  console.log('='.repeat(80));
  console.log(`TEST SCENARIO ${scenarioIndex + 1}: ${scenario.name}`);
  console.log('='.repeat(80));

  const totalTarget = Object.values(scenario.shifts).reduce((sum, s) => sum + s.target, 0);
  const totalMax = Object.values(scenario.shifts).reduce((sum, s) => sum + s.max, 0);
  const minRidersNeeded = Math.ceil(totalTarget / 3);
  const maxRidersPossible = Math.floor(totalMax / 3);

  console.log(`Total target: ${totalTarget} shifts (${minRidersNeeded} riders needed)`);
  console.log(`Total max: ${totalMax} shifts (${maxRidersPossible} riders possible)`);
  console.log();

  // Test with various rider counts
  const riderCounts = [
    { riders: Math.floor(minRidersNeeded * 0.5), label: '50% of target' },
    { riders: Math.floor(minRidersNeeded * 0.8), label: '80% of target' },
    { riders: minRidersNeeded, label: 'Exactly at target' },
    { riders: Math.floor((minRidersNeeded + maxRidersPossible) / 2), label: 'Between target and max' },
    { riders: maxRidersPossible, label: 'At maximum' },
    { riders: maxRidersPossible + 5, label: 'Exceeding maximum' }
  ];

  riderCounts.forEach(({ riders, label }) => {
    if (riders <= 0) return;

    totalTests++;
    const testName = `${scenario.name} - ${label} (${riders} riders)`;

    try {
      const result = createSchedule6(riders, scenario.shifts);

      // Count assigned shifts per slot
      const counts = {};
      Object.keys(scenario.shifts).forEach(key => counts[key] = 0);
      result.schedule.forEach(r => r.shifts.forEach(s => counts[s]++));

      // Validation checks
      let hasError = false;
      let errorMsg = '';

      // Check 1: No shift exceeds its maximum
      Object.keys(scenario.shifts).forEach(key => {
        if (counts[key] > scenario.shifts[key].max) {
          hasError = true;
          errorMsg += `\n  ✗ ${key}: ${counts[key]} exceeds max ${scenario.shifts[key].max}`;
        }
      });

      // Check 2: Total riders scheduled shouldn't exceed input
      if (result.schedule.length > riders) {
        hasError = true;
        errorMsg += `\n  ✗ Scheduled ${result.schedule.length} riders but only ${riders} available`;
      }

      // Check 3: Each rider has exactly 3 shifts
      result.schedule.forEach((rider, idx) => {
        if (rider.shifts.length !== 3) {
          hasError = true;
          errorMsg += `\n  ✗ Rider ${rider.riderId} has ${rider.shifts.length} shifts (should be 3)`;
        }
      });

      // Check 4: When riders exceed target, shouldn't exceed max for any shift
      if (riders >= minRidersNeeded) {
        Object.keys(scenario.shifts).forEach(key => {
          if (counts[key] > scenario.shifts[key].max) {
            hasError = true;
            errorMsg += `\n  ✗ ${key}: ${counts[key]} exceeds max ${scenario.shifts[key].max} when riders available`;
          }
        });
      }

      if (hasError) {
        failedTests++;
        failures.push({ testName, errorMsg, scenario, riders, result, counts });
        console.log(`  ✗ FAIL: ${label} (${riders} riders)`);
        console.log(errorMsg);
      } else {
        passedTests++;
        console.log(`  ✓ PASS: ${label} (${riders} riders) - Scheduled: ${result.schedule.length}, Consecutive: ${result.consecutiveTriplets}`);
      }

    } catch (error) {
      failedTests++;
      failures.push({ testName, errorMsg: error.message, scenario, riders });
      console.log(`  ✗ ERROR: ${label} (${riders} riders) - ${error.message}`);
    }
  });

  console.log();
});

// Final summary
console.log('='.repeat(80));
console.log('FINAL TEST SUMMARY');
console.log('='.repeat(80));
console.log(`Total tests: ${totalTests}`);
console.log(`Passed: ${passedTests} (${((passedTests / totalTests) * 100).toFixed(1)}%)`);
console.log(`Failed: ${failedTests} (${((failedTests / totalTests) * 100).toFixed(1)}%)`);
console.log();

if (failures.length > 0) {
  console.log('='.repeat(80));
  console.log('FAILED TESTS DETAILS');
  console.log('='.repeat(80));
  failures.forEach((failure, idx) => {
    console.log(`\n${idx + 1}. ${failure.testName}`);
    console.log(failure.errorMsg);
    if (failure.counts) {
      console.log('  Distribution:', failure.counts);
    }
  });
} else {
  console.log('🎉 ALL TESTS PASSED! No issues detected.');
}

console.log('='.repeat(80));
