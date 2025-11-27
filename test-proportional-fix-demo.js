/**
 * Demonstration of Proportional Distribution Fix
 * Shows the difference between equal and proportional distribution
 */

import { createSchedule6 } from './src/utils/scheduler6.js';

console.log('='.repeat(80));
console.log('PROPORTIONAL DISTRIBUTION FIX DEMONSTRATION');
console.log('='.repeat(80));
console.log();

console.log('PROBLEM:');
console.log('--------');
console.log('OLD behavior used EQUAL distribution (same number per shift)');
console.log('This caused shifts with small targets to be OVER-ALLOCATED');
console.log();

console.log('SOLUTION:');
console.log('---------');
console.log('NEW behavior uses PROPORTIONAL distribution (based on % of total target)');
console.log('Each shift gets allocated proportionally to its target percentage');
console.log('NO shift ever exceeds its target when riders < target');
console.log();

// ============================================================================
// Example 1: User's exact scenario
// ============================================================================
console.log('='.repeat(80));
console.log('EXAMPLE 1: User\'s Exact Scenario');
console.log('='.repeat(80));
const scenario1 = {
  slot1: { target: 6, max: 9 },
  slot2: { target: 2, max: 3 },
  slot3: { target: 4, max: 6 },
  slot4: { target: 9, max: 18 },
  slot5: { target: 9, max: 18 },
  slot6: { target: 15, max: 30 }
};

const totalTarget1 = 45;
const riders1 = 6;
const availableShifts1 = riders1 * 3;

console.log(`Riders: ${riders1} (needs ${totalTarget1/3} for target)`);
console.log(`Available shifts: ${availableShifts1}`);
console.log();

console.log('Shift Configuration:');
console.log('  Shift | Target | Max | % of Total');
console.log('  ------|--------|-----|------------');
Object.keys(scenario1).forEach(key => {
  const pct = ((scenario1[key].target / totalTarget1) * 100).toFixed(1);
  console.log(`  ${key} |    ${scenario1[key].target.toString().padStart(2)}  | ${scenario1[key].max.toString().padStart(2)}  |   ${pct}%`);
});
console.log();

// Calculate what OLD equal distribution would give
const equalPerShift = Math.floor(availableShifts1 / 6);
const extra = availableShifts1 % 6;

console.log('OLD BEHAVIOR (Equal Distribution):');
console.log('  Each shift gets: ' + equalPerShift + (extra > 0 ? ` (some get ${equalPerShift + 1})` : ''));
console.log('  Shift | Target | Old Alloc | Problem?');
console.log('  ------|--------|-----------|----------');
Object.keys(scenario1).forEach((key, i) => {
  const oldAlloc = equalPerShift + (i < extra ? 1 : 0);
  const problem = oldAlloc > scenario1[key].target ? '✗ EXCEEDS TARGET!' : '✓';
  console.log(`  ${key} |    ${scenario1[key].target.toString().padStart(2)}  |     ${oldAlloc}     | ${problem}`);
});
console.log();

// NEW behavior
const result1 = createSchedule6(riders1, scenario1);
const counts1 = {};
Object.keys(scenario1).forEach(key => counts1[key] = 0);
result1.schedule.forEach(r => r.shifts.forEach(s => counts1[s]++));

console.log('NEW BEHAVIOR (Proportional Distribution):');
console.log('  Shift | Target | Expected | New Alloc | Status');
console.log('  ------|--------|----------|-----------|--------');
Object.keys(scenario1).forEach(key => {
  const expected = ((scenario1[key].target / totalTarget1) * availableShifts1).toFixed(1);
  const actual = counts1[key];
  const status = actual <= scenario1[key].target ? '✓ OK' : '✗ EXCEEDS';
  console.log(`  ${key} |    ${scenario1[key].target.toString().padStart(2)}  |   ${expected.padStart(4)}   |     ${actual}     | ${status}`);
});
console.log();

// ============================================================================
// Example 2: Another scenario with extreme differences
// ============================================================================
console.log('='.repeat(80));
console.log('EXAMPLE 2: Extreme Target Differences');
console.log('='.repeat(80));
const scenario2 = {
  slot1: { target: 1, max: 5 },
  slot2: { target: 3, max: 10 },
  slot3: { target: 5, max: 15 },
  slot4: { target: 10, max: 20 },
  slot5: { target: 15, max: 25 },
  slot6: { target: 20, max: 30 }
};

const totalTarget2 = 1 + 3 + 5 + 10 + 15 + 20;
const riders2 = 8;
const availableShifts2 = riders2 * 3;

console.log(`Riders: ${riders2} (needs ${totalTarget2/3} for target)`);
console.log(`Available shifts: ${availableShifts2}`);
console.log();

const result2 = createSchedule6(riders2, scenario2);
const counts2 = {};
Object.keys(scenario2).forEach(key => counts2[key] = 0);
result2.schedule.forEach(r => r.shifts.forEach(s => counts2[s]++));

console.log('Results with Proportional Distribution:');
console.log('  Shift | Target | % of Total | Expected | Actual | Within Target?');
console.log('  ------|--------|------------|----------|--------|---------------');
Object.keys(scenario2).forEach(key => {
  const pct = ((scenario2[key].target / totalTarget2) * 100).toFixed(1);
  const expected = ((scenario2[key].target / totalTarget2) * availableShifts2).toFixed(1);
  const actual = counts2[key];
  const status = actual <= scenario2[key].target ? '✓ YES' : '✗ NO';
  console.log(`  ${key} |   ${scenario2[key].target.toString().padStart(2)}   |   ${pct.padStart(5)}%   |   ${expected.padStart(4)}   |   ${actual}    | ${status}`);
});
console.log();

// ============================================================================
// Key Benefits
// ============================================================================
console.log('='.repeat(80));
console.log('KEY BENEFITS OF PROPORTIONAL DISTRIBUTION:');
console.log('='.repeat(80));
console.log('✓ Respects shift target limits (never exceeds when riders < target)');
console.log('✓ Distributes riders based on demand (% of total target)');
console.log('✓ Prevents over-allocation of low-demand shifts');
console.log('✓ Maintains fair distribution across all time slots');
console.log('✓ Works correctly for both equal and unequal target configurations');
console.log('='.repeat(80));
