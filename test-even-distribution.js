/**
 * Test Script for Even Distribution Logic
 * Tests the new even distribution feature for under-scheduled scenarios
 */

import { createSchedule } from './src/utils/scheduler.js';
import { createSchedule6 } from './src/utils/scheduler6.js';

console.log('='.repeat(80));
console.log('TESTING EVEN DISTRIBUTION LOGIC');
console.log('='.repeat(80));
console.log();

// ============================================================================
// TEST 1: 5-SHIFT MODE - Normal case (100% of target)
// ============================================================================
console.log('TEST 1: 5-Shift Mode - Normal Case (100% of target)');
console.log('-'.repeat(80));
const test1ShiftData = {
  slot1: { target: 20, max: 25 },
  slot2: { target: 20, max: 25 },
  slot3: { target: 20, max: 25 },
  slot4: { target: 20, max: 25 },
  slot5: { target: 20, max: 25 }
};
const test1Result = createSchedule(50, test1ShiftData); // 50 riders = 100 shifts (exactly target)
console.log(`Riders: 50 (exactly target of 50)`);
console.log(`Total shifts assigned: ${test1Result.schedule.length * 2}`);

// Count riders per shift
const test1Counts = {};
test1Result.schedule.forEach(r => {
  r.shifts.forEach(s => {
    test1Counts[s] = (test1Counts[s] || 0) + 1;
  });
});
console.log('Distribution:', test1Counts);
console.log('Consecutive pairs:', test1Result.consecutivePairs);
console.log('✓ Should NOT trigger even distribution (riders >= target)');
console.log();

// ============================================================================
// TEST 2: 5-SHIFT MODE - Slightly below target (85% of target)
// ============================================================================
console.log('TEST 2: 5-Shift Mode - Slightly Below Target (85% of target)');
console.log('-'.repeat(80));
const test2Result = createSchedule(42, test1ShiftData); // 42 riders = 84 shifts (85% of 100)
console.log(`Riders: 42 (85% of target 50)`);
console.log(`Total shifts assigned: ${test2Result.schedule.length * 2}`);

const test2Counts = {};
test2Result.schedule.forEach(r => {
  r.shifts.forEach(s => {
    test2Counts[s] = (test2Counts[s] || 0) + 1;
  });
});
console.log('Distribution:', test2Counts);
console.log('Consecutive pairs:', test2Result.consecutivePairs);
console.log('✓ Should NOT trigger even distribution (riders >= 80% of target)');
console.log();

// ============================================================================
// TEST 3: 5-SHIFT MODE - Exactly 80% of target (edge case)
// ============================================================================
console.log('TEST 3: 5-Shift Mode - Exactly 80% of Target (Edge Case)');
console.log('-'.repeat(80));
const test3Result = createSchedule(40, test1ShiftData); // 40 riders = 80 shifts (80% of 100)
console.log(`Riders: 40 (80% of target 50)`);
console.log(`Total shifts assigned: ${test3Result.schedule.length * 2}`);
console.log(`Expected even distribution: 16 per shift (80 shifts / 5 = 16)`);

const test3Counts = {};
test3Result.schedule.forEach(r => {
  r.shifts.forEach(s => {
    test3Counts[s] = (test3Counts[s] || 0) + 1;
  });
});
console.log('Distribution:', test3Counts);
console.log('Consecutive pairs:', test3Result.consecutivePairs);

// Check if distribution is even
const test3Values = Object.values(test3Counts);
const test3Max = Math.max(...test3Values);
const test3Min = Math.min(...test3Values);
const test3Diff = test3Max - test3Min;
console.log(`Max: ${test3Max}, Min: ${test3Min}, Difference: ${test3Diff}`);
console.log(test3Diff <= 1 ? '✓ PASS: Even distribution achieved!' : '✗ FAIL: Uneven distribution!');
console.log();

// ============================================================================
// TEST 4: 5-SHIFT MODE - Significantly below target (60% of target)
// ============================================================================
console.log('TEST 4: 5-Shift Mode - Significantly Below Target (60% of target)');
console.log('-'.repeat(80));
const test4Result = createSchedule(30, test1ShiftData); // 30 riders = 60 shifts (60% of 100)
console.log(`Riders: 30 (60% of target 50)`);
console.log(`Total shifts assigned: ${test4Result.schedule.length * 2}`);
console.log(`Expected even distribution: 12 per shift (60 shifts / 5 = 12)`);

const test4Counts = {};
test4Result.schedule.forEach(r => {
  r.shifts.forEach(s => {
    test4Counts[s] = (test4Counts[s] || 0) + 1;
  });
});
console.log('Distribution:', test4Counts);
console.log('Consecutive pairs:', test4Result.consecutivePairs);

const test4Values = Object.values(test4Counts);
const test4Max = Math.max(...test4Values);
const test4Min = Math.min(...test4Values);
const test4Diff = test4Max - test4Min;
console.log(`Max: ${test4Max}, Min: ${test4Min}, Difference: ${test4Diff}`);
console.log(test4Diff <= 1 ? '✓ PASS: Even distribution achieved!' : '✗ FAIL: Uneven distribution!');
console.log();

// ============================================================================
// TEST 5: 5-SHIFT MODE - Very low (40% of target)
// ============================================================================
console.log('TEST 5: 5-Shift Mode - Very Low (40% of target)');
console.log('-'.repeat(80));
const test5Result = createSchedule(20, test1ShiftData); // 20 riders = 40 shifts (40% of 100)
console.log(`Riders: 20 (40% of target 50)`);
console.log(`Total shifts assigned: ${test5Result.schedule.length * 2}`);
console.log(`Expected even distribution: 8 per shift (40 shifts / 5 = 8)`);

const test5Counts = {};
test5Result.schedule.forEach(r => {
  r.shifts.forEach(s => {
    test5Counts[s] = (test5Counts[s] || 0) + 1;
  });
});
console.log('Distribution:', test5Counts);
console.log('Consecutive pairs:', test5Result.consecutivePairs);

const test5Values = Object.values(test5Counts);
const test5Max = Math.max(...test5Values);
const test5Min = Math.min(...test5Values);
const test5Diff = test5Max - test5Min;
console.log(`Max: ${test5Max}, Min: ${test5Min}, Difference: ${test5Diff}`);
console.log(test5Diff <= 1 ? '✓ PASS: Even distribution achieved!' : '✗ FAIL: Uneven distribution!');
console.log();

// ============================================================================
// TEST 6: 6-SHIFT MODE - Significantly below target (60% of target)
// ============================================================================
console.log('TEST 6: 6-Shift Mode - Significantly Below Target (60% of target)');
console.log('-'.repeat(80));
const test6ShiftData = {
  slot1: { target: 20, max: 25 },
  slot2: { target: 20, max: 25 },
  slot3: { target: 20, max: 25 },
  slot4: { target: 20, max: 25 },
  slot5: { target: 20, max: 25 },
  slot6: { target: 20, max: 25 }
};
// Target: 20 per shift × 6 = 120 shifts, 120/3 = 40 riders needed
// 60% = 24 riders = 72 shifts
const test6Result = createSchedule6(24, test6ShiftData);
console.log(`Riders: 24 (60% of target 40)`);
console.log(`Total shifts assigned: ${test6Result.schedule.length * 3}`);
console.log(`Expected even distribution: 12 per shift (72 shifts / 6 = 12)`);

const test6Counts = {};
test6Result.schedule.forEach(r => {
  r.shifts.forEach(s => {
    test6Counts[s] = (test6Counts[s] || 0) + 1;
  });
});
console.log('Distribution:', test6Counts);
console.log('Consecutive triplets:', test6Result.consecutiveTriplets);
console.log('Partially consecutive:', test6Result.partiallyConsecutive);

const test6Values = Object.values(test6Counts);
const test6Max = Math.max(...test6Values);
const test6Min = Math.min(...test6Values);
const test6Diff = test6Max - test6Min;
console.log(`Max: ${test6Max}, Min: ${test6Min}, Difference: ${test6Diff}`);
console.log(test6Diff <= 1 ? '✓ PASS: Even distribution achieved!' : '✗ FAIL: Uneven distribution!');
console.log();

// ============================================================================
// TEST 7: 6-SHIFT MODE - Normal case (100% of target)
// ============================================================================
console.log('TEST 7: 6-Shift Mode - Normal Case (100% of target)');
console.log('-'.repeat(80));
const test7Result = createSchedule6(40, test6ShiftData); // 40 riders = exactly target
console.log(`Riders: 40 (exactly target of 40)`);
console.log(`Total shifts assigned: ${test7Result.schedule.length * 3}`);

const test7Counts = {};
test7Result.schedule.forEach(r => {
  r.shifts.forEach(s => {
    test7Counts[s] = (test7Counts[s] || 0) + 1;
  });
});
console.log('Distribution:', test7Counts);
console.log('Consecutive triplets:', test7Result.consecutiveTriplets);
console.log('✓ Should NOT trigger even distribution (riders >= target)');
console.log();

// ============================================================================
// TEST 8: Edge case - Uneven targets with even distribution needed
// ============================================================================
console.log('TEST 8: 5-Shift Mode - Uneven Targets with Even Distribution');
console.log('-'.repeat(80));
const test8ShiftData = {
  slot1: { target: 25, max: 30 },
  slot2: { target: 20, max: 25 },
  slot3: { target: 15, max: 20 },
  slot4: { target: 20, max: 25 },
  slot5: { target: 20, max: 25 }
};
// Total target: 100 shifts, needs 50 riders
// Provide 30 riders (60% of target) = 60 shifts
const test8Result = createSchedule(30, test8ShiftData);
console.log(`Riders: 30 (60% of target 50)`);
console.log(`Total shifts assigned: ${test8Result.schedule.length * 2}`);
console.log(`Expected even distribution: ~12 per shift (60 shifts / 5 = 12)`);

const test8Counts = {};
test8Result.schedule.forEach(r => {
  r.shifts.forEach(s => {
    test8Counts[s] = (test8Counts[s] || 0) + 1;
  });
});
console.log('Distribution:', test8Counts);
console.log('Original targets:', { slot1: 25, slot2: 20, slot3: 15, slot4: 20, slot5: 20 });
console.log('Consecutive pairs:', test8Result.consecutivePairs);

const test8Values = Object.values(test8Counts);
const test8Max = Math.max(...test8Values);
const test8Min = Math.min(...test8Values);
const test8Diff = test8Max - test8Min;
console.log(`Max: ${test8Max}, Min: ${test8Min}, Difference: ${test8Diff}`);
console.log(test8Diff <= 1 ? '✓ PASS: Even distribution achieved!' : '✗ FAIL: Uneven distribution!');
console.log();

// ============================================================================
// SUMMARY
// ============================================================================
console.log('='.repeat(80));
console.log('TEST SUMMARY');
console.log('='.repeat(80));
console.log('All tests completed. Review the results above to verify:');
console.log('1. Even distribution triggers only when riders < 80% of target');
console.log('2. Distribution is approximately even (max-min difference ≤ 1)');
console.log('3. Consecutive assignments are still maximized where possible');
console.log('4. Works for both 5-shift and 6-shift modes');
console.log('='.repeat(80));
