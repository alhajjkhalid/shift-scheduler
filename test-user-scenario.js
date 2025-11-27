/**
 * Test Script for User's Specific Scenario
 * Testing proportional distribution with the exact shift configuration provided
 */

import { createSchedule6 } from './src/utils/scheduler6.js';

console.log('='.repeat(80));
console.log('USER SCENARIO TEST - PROPORTIONAL DISTRIBUTION');
console.log('='.repeat(80));
console.log();

// ============================================================================
// User's Exact Scenario
// ============================================================================
console.log('Testing with user\'s exact shift configuration:');
console.log('-'.repeat(80));
const userShiftData = {
  slot1: { target: 6, max: 9 },
  slot2: { target: 2, max: 3 },
  slot3: { target: 4, max: 6 },
  slot4: { target: 9, max: 18 },
  slot5: { target: 9, max: 18 },
  slot6: { target: 15, max: 30 }
};

// Calculate expected proportional distribution
const totalTarget = Object.values(userShiftData).reduce((sum, s) => sum + s.target, 0);
const numRiders = 6;
const totalAvailableShifts = numRiders * 3; // 18 shifts

console.log(`Total target: ${totalTarget} shifts (${totalTarget / 3} riders needed)`);
console.log(`Riders provided: ${numRiders} (${totalAvailableShifts} shifts available)`);
console.log();

console.log('Expected PROPORTIONAL distribution:');
Object.keys(userShiftData).forEach(key => {
  const proportion = userShiftData[key].target / totalTarget;
  const expectedAllocation = proportion * totalAvailableShifts;
  console.log(`  ${key}: target=${userShiftData[key].target}, proportion=${(proportion * 100).toFixed(1)}%, expected≈${expectedAllocation.toFixed(1)}`);
});
console.log();

// Run the scheduler
const result = createSchedule6(numRiders, userShiftData);

// Count actual distribution
const actualCounts = {};
Object.keys(userShiftData).forEach(key => {
  actualCounts[key] = 0;
});

result.schedule.forEach(rider => {
  rider.shifts.forEach(shift => {
    actualCounts[shift]++;
  });
});

console.log('ACTUAL distribution:');
Object.keys(userShiftData).forEach(key => {
  const target = userShiftData[key].target;
  const actual = actualCounts[key];
  const percentage = ((actual / target) * 100).toFixed(1);
  const status = actual <= target ? '✓' : '✗ EXCEEDS TARGET!';
  console.log(`  ${key}: target=${target}, actual=${actual} (${percentage}% of target) ${status}`);
});
console.log();

// Validation
console.log('VALIDATION:');
console.log('-'.repeat(80));

let hasViolations = false;
Object.keys(userShiftData).forEach(key => {
  const target = userShiftData[key].target;
  const actual = actualCounts[key];
  if (actual > target) {
    console.log(`✗ FAIL: ${key} exceeds target (${actual} > ${target})`);
    hasViolations = true;
  }
});

if (!hasViolations) {
  console.log('✓ PASS: No shift exceeds its target!');
}

// Check if distribution is proportional
const totalActual = Object.values(actualCounts).reduce((a, b) => a + b, 0);
console.log(`Total shifts assigned: ${totalActual} (expected: ${totalAvailableShifts})`);
console.log(`Consecutive triplets: ${result.consecutiveTriplets}`);
console.log(`Partially consecutive: ${result.partiallyConsecutive}`);
console.log(`Non-consecutive: ${result.nonConsecutive}`);
console.log();

// ============================================================================
// Additional test: exactly at target
// ============================================================================
console.log('TEST 2: When riders equal target (15 riders = 45 shifts)');
console.log('-'.repeat(80));
const targetRiders = totalTarget / 3;
const result2 = createSchedule6(targetRiders, userShiftData);

const counts2 = {};
Object.keys(userShiftData).forEach(key => {
  counts2[key] = 0;
});

result2.schedule.forEach(rider => {
  rider.shifts.forEach(shift => {
    counts2[shift]++;
  });
});

console.log('Distribution when riders = target:');
Object.keys(userShiftData).forEach(key => {
  const target = userShiftData[key].target;
  const actual = counts2[key];
  const status = actual === target ? '✓ EXACT MATCH' : (actual <= target ? '✓ OK' : '✗ EXCEEDS');
  console.log(`  ${key}: target=${target}, actual=${actual} ${status}`);
});
console.log();

// ============================================================================
// Test 3: Above target but below max
// ============================================================================
console.log('TEST 3: When riders exceed target but below max (20 riders)');
console.log('-'.repeat(80));
const result3 = createSchedule6(20, userShiftData);

const counts3 = {};
Object.keys(userShiftData).forEach(key => {
  counts3[key] = 0;
});

result3.schedule.forEach(rider => {
  rider.shifts.forEach(shift => {
    counts3[shift]++;
  });
});

console.log('Distribution when riders > target:');
Object.keys(userShiftData).forEach(key => {
  const target = userShiftData[key].target;
  const max = userShiftData[key].max;
  const actual = counts3[key];
  let status = '✓';
  if (actual > max) {
    status = '✗ EXCEEDS MAX!';
  } else if (actual > target) {
    status = '✓ Using max capacity';
  }
  console.log(`  ${key}: target=${target}, max=${max}, actual=${actual} ${status}`);
});
console.log(`Extra riders assigned: ${result3.extraRiders}`);
console.log();

console.log('='.repeat(80));
console.log('TEST COMPLETE');
console.log('='.repeat(80));
