/**
 * ============================================================================
 * SHIFT SCHEDULER - Intelligent Rider Assignment System
 * ============================================================================
 * 
 * Developer: Khalid Ahmad Alhajj
 * Version: 1.0.0
 * Last Updated: October 2024
 * 
 * Description:
 * An intelligent shift scheduling application that automatically assigns riders
 * to time slots while optimizing for capacity utilization and consecutive shift
 * preferences. Uses a sophisticated waste-aware look-ahead algorithm to prevent
 * capacity stranding and maximize efficiency.
 * 
 * Key Features:
 * - Automatic rider-to-shift assignment
 * - Optimal capacity utilization (100% efficiency)
 * - Consecutive shift preference optimization
 * - Real-time validation and error handling
 * - Visual capacity analysis with progress bars
 * - CSV export functionality
 * - Responsive, professional UI design
 * 
 * Algorithm:
 * Phase 1: Backtracking algorithm to meet minimum target requirements
 * Phase 2: Waste-aware greedy algorithm with look-ahead simulation to
 *          maximize capacity utilization without stranding slots
 * 
 * Technical Stack:
 * - React 18+ with Hooks
 * - Tailwind CSS for styling
 * - Lucide React for icons
 * - Vite for build tooling
 * 
 * Company Color Palette:
 * - Primary Yellow: #ffe300
 * - Bright Yellow: #ffff00
 * - Teal: #00d097
 * 
 * Copyright © 2024 Khalid Ahmad Alhajj. All rights reserved.
 * ============================================================================
 */

import React, { useState } from 'react';
import { AlertCircle, CheckCircle, Calendar, Users, TrendingUp, Download, Clock, Target, Zap, BarChart3, AlertTriangle, Info } from 'lucide-react';

export default function ShiftScheduler() {
  const [totalRiders, setTotalRiders] = useState('');
  const [shifts, setShifts] = useState({
    slot1: { target: '', max: '' },
    slot2: { target: '', max: '' },
    slot3: { target: '', max: '' },
    slot4: { target: '', max: '' },
    slot5: { target: '', max: '' },
  });
  const [schedule, setSchedule] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const SHIFTS_PER_RIDER = 2;

  const timeSlots = [
    { id: 'slot1', label: 'Shift 1', time: '12 AM - 4 AM', key: 'slot1', icon: '🌙' },
    { id: 'slot2', label: 'Shift 2', time: '4 AM - 10 AM', key: 'slot2', icon: '🌅' },
    { id: 'slot3', label: 'Shift 3', time: '10 AM - 3 PM', key: 'slot3', icon: '☀️' },
    { id: 'slot4', label: 'Shift 4', time: '3 PM - 8 PM', key: 'slot4', icon: '🌆' },
    { id: 'slot5', label: 'Shift 5', time: '8 PM - 12 AM', key: 'slot5', icon: '🌃' },
  ];

  const handleShiftChange = (slotKey, field, value) => {
    // Only allow numbers and empty string
    if (value !== '' && !/^\d+$/.test(value)) {
      return; // Don't update if not a valid number
    }
    
    setShifts(prev => ({
      ...prev,
      [slotKey]: { ...prev[slotKey], [field]: value }
    }));
    setError('');
    setSuccess('');
  };

  const handleTotalRidersChange = (value) => {
    // Only allow numbers and empty string
    if (value !== '' && !/^\d+$/.test(value)) {
      return; // Don't update if not a valid number
    }
    
    setTotalRiders(value);
    setError('');
    setSuccess('');
  };

  const isConsecutive = (shift1, shift2) => {
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

  const generateSchedule = () => {
    setError('');
    setSuccess('');
    setSchedule(null);

    const riders = parseInt(totalRiders);
    const shiftData = {};

    for (const key of Object.keys(shifts)) {
      const targetInput = shifts[key].target;
      const maxInput = shifts[key].max;

      const target = parseInt(targetInput) || 0;
      const maxParsed = parseInt(maxInput);

      const max = (maxInput === '' || isNaN(maxParsed)) ? target : maxParsed;

      if (maxInput !== '' && !isNaN(maxParsed) && maxParsed < target) {
        setError(`Maximum shifts (${maxParsed}) must be >= target shifts (${target}) for ${timeSlots.find(s => s.key === key).label}`);
        return;
      }

      shiftData[key] = { target, max };
    }

    if (!riders || riders <= 0 || !Number.isInteger(riders)) {
      setError('Please enter a valid whole number of riders');
      return;
    }

    // Performance guard: warn for very large numbers
    if (riders > 10000) {
      setError('Maximum 10,000 riders allowed for performance reasons. Please reduce the number.');
      return;
    }

    const totalTargetShifts = Object.values(shiftData).reduce((sum, s) => sum + s.target, 0);
    const totalMaxShifts = Object.values(shiftData).reduce((sum, s) => sum + s.max, 0);

    if (totalTargetShifts % SHIFTS_PER_RIDER !== 0) {
      setError(`Total target shifts (${totalTargetShifts}) must be even (each rider needs ${SHIFTS_PER_RIDER} shifts).`);
      return;
    }

    const minRequiredRiders = totalTargetShifts / SHIFTS_PER_RIDER;
    const maxAllowedRiders = Math.floor(totalMaxShifts / SHIFTS_PER_RIDER);

    if (riders < minRequiredRiders) {
      setError(`Need at least ${minRequiredRiders} riders for targets (${totalTargetShifts} shifts ÷ ${SHIFTS_PER_RIDER})`);
      return;
    }

    if (riders > maxAllowedRiders) {
      setError(`Maximum ${maxAllowedRiders} riders allowed (${totalMaxShifts} shifts ÷ ${SHIFTS_PER_RIDER}). You entered ${riders}.`);
      return;
    }

    const result = createSchedule(riders, shiftData);

    if (result.success) {
      setSchedule(result.schedule);
      const actualRiders = result.schedule.length;
      const targetRiders = totalTargetShifts / SHIFTS_PER_RIDER;

      let message;
      if (actualRiders < riders) {
        message = `⚠️ Partially scheduled: ${actualRiders} of ${riders} riders. ${riders - actualRiders} rider(s) could not be scheduled.`;
      } else {
        message = `🎉 Successfully scheduled all ${actualRiders} riders!`;
      }

      message += ` ${result.consecutivePairs} rider(s) have consecutive shifts.`;

      if (actualRiders >= targetRiders) {
        message += ' ✓ All targets met.';
      }

      if (result.extraRiders > 0) {
        message += ` ${result.extraRiders} extra rider(s) scheduled.`;
      }

      // Add warning if capacity was stranded
      if (result.warning) {
        message += ` ${result.warning}`;
      }

      setSuccess(message);
    } else {
      setError(result.error);
    }
  };

  // ============================================================================
  // VALIDATION HELPER FUNCTIONS
  // ============================================================================

  const getValidPartners = (slot) => {
    const allPairs = [
      ['slot1', 'slot2'],
      ['slot2', 'slot3'],
      ['slot3', 'slot4'],
      ['slot4', 'slot5'],
      ['slot5', 'slot1'],
      ['slot1', 'slot3'],
      ['slot1', 'slot4'],
      ['slot2', 'slot4'],
      ['slot2', 'slot5'],
      ['slot3', 'slot5'],
    ];

    const partners = new Set();
    for (const [s1, s2] of allPairs) {
      if (s1 === slot) partners.add(s2);
      if (s2 === slot) partners.add(s1);
    }
    return Array.from(partners);
  };

  const validatePairingFeasibility = (shiftData) => {
    const targets = {};
    Object.keys(shiftData).forEach(key => {
      targets[key] = shiftData[key].target;
    });

    const totalTargets = Object.values(targets).reduce((sum, v) => sum + v, 0);

    // Check 1: Each shift must be pairable with available partners
    for (const shift in targets) {
      if (targets[shift] > 0) {
        const partners = getValidPartners(shift);
        const partnerCapacity = partners.reduce((sum, p) => sum + targets[p], 0);

        if (targets[shift] > partnerCapacity) {
          const slot = timeSlots.find(s => s.key === shift);
          return {
            valid: false,
            error: `${slot?.label || shift} needs ${targets[shift]} riders but can only pair with ${partnerCapacity} riders from other shifts. Reduce ${slot?.label || shift} target or increase partner shift targets.`
          };
        }
      }
    }

    // Check 2: Hall's Marriage Theorem - verify perfect matching exists
    // For each subset of shifts, the neighborhood must be large enough
    const shifts = Object.keys(targets).filter(s => targets[s] > 0);

    // Check all non-empty subsets (this is feasible for 5 shifts = 31 subsets)
    for (let mask = 1; mask < (1 << shifts.length); mask++) {
      const subset = [];
      let subsetDemand = 0;

      for (let i = 0; i < shifts.length; i++) {
        if (mask & (1 << i)) {
          subset.push(shifts[i]);
          subsetDemand += targets[shifts[i]];
        }
      }

      // Find all shifts that can pair with this subset
      const neighbors = new Set();
      for (const shift of subset) {
        const partners = getValidPartners(shift);
        partners.forEach(p => neighbors.add(p));
      }

      // Calculate total capacity of neighbors
      let neighborCapacity = 0;
      neighbors.forEach(n => {
        neighborCapacity += targets[n] || 0;
      });

      // Hall's condition: |N(S)| >= |S| in terms of demand
      if (subsetDemand > neighborCapacity) {
        return {
          valid: false,
          error: `Configuration creates impossible pairing: ${subset.map(s => timeSlots.find(t => t.key === s)?.label).join(', ')} need ${subsetDemand} shifts but neighbors only provide ${neighborCapacity}. This configuration cannot be scheduled.`
        };
      }
    }

    return { valid: true };
  };

  const detectStrandedCapacity = (shiftData, numRiders) => {
    const maxCapacity = {};
    Object.keys(shiftData).forEach(key => {
      maxCapacity[key] = shiftData[key].max;
    });

    const totalMaxShifts = Object.values(maxCapacity).reduce((sum, v) => sum + v, 0);
    const totalNeededShifts = numRiders * SHIFTS_PER_RIDER;

    // Simulate if we can actually use all the capacity
    for (const shift in maxCapacity) {
      if (maxCapacity[shift] > 0) {
        const partners = getValidPartners(shift);
        const partnerCapacity = partners.reduce((sum, p) => sum + maxCapacity[p], 0);

        if (maxCapacity[shift] > partnerCapacity) {
          const slot = timeSlots.find(s => s.key === shift);
          const stranded = maxCapacity[shift] - partnerCapacity;
          return {
            stranded: true,
            shift: shift,
            amount: stranded,
            warning: `⚠️ ${slot?.label || shift} has ${stranded} slot(s) that cannot be paired. Maximum schedulable riders may be less than ${numRiders}.`
          };
        }
      }
    }

    return { stranded: false };
  };

  // ============================================================================
  // IMPROVED SCHEDULING ALGORITHM - CONSECUTIVE FIRST
  // ============================================================================

  const createSchedule = (numRiders, shiftData) => {
    // ============ PHASE 1: COMPREHENSIVE VALIDATION ============

    const totalTargetShifts = Object.values(shiftData).reduce((sum, s) => sum + s.target, 0);
    const totalMaxShifts = Object.values(shiftData).reduce((sum, s) => sum + s.max, 0);
    const minRidersForTarget = totalTargetShifts / SHIFTS_PER_RIDER;

    console.log('=== SCHEDULING START ===');
    console.log('Total target shifts:', totalTargetShifts);
    console.log('Min riders needed:', minRidersForTarget);
    console.log('Riders to schedule:', numRiders);
    console.log('Shift data:', shiftData);

    // Validation 1: Check pairing feasibility for targets
    const pairingCheck = validatePairingFeasibility(shiftData);
    if (!pairingCheck.valid) {
      console.log('Pairing check failed:', pairingCheck.error);
      return {
        success: false,
        error: pairingCheck.error
      };
    }

    // Validation 2: Check for stranded capacity (warning only)
    const strandedCheck = detectStrandedCapacity(shiftData, numRiders);
    let warning = null;
    if (strandedCheck.stranded) {
      warning = strandedCheck.warning;
      console.log('Stranded capacity detected:', warning);
    }

    // ============ PHASE 2: TARGET ASSIGNMENT (EFFICIENT GREEDY WITH LOOK-AHEAD) ============

    const riderSchedule = [];
    let riderIndex = 0;

    const targetRemaining = {};
    Object.keys(shiftData).forEach(key => {
      targetRemaining[key] = shiftData[key].target;
    });

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

    console.log('Phase 2: Efficient greedy target assignment');
    console.log('Initial targets:', {...targetRemaining});

    // Helper: Check if remaining shifts can still be paired
    const canBePaired = (remaining) => {
      for (const shift in remaining) {
        if (remaining[shift] > 0) {
          const partners = getValidPartners(shift);
          const partnerCap = partners.reduce((sum, p) => sum + (remaining[p] || 0), 0);
          if (remaining[shift] > partnerCap) {
            return false;
          }
        }
      }
      return true;
    };

    // Greedy algorithm: pick pairs that minimize future problems
    const totalRidersNeeded = totalTargetShifts / SHIFTS_PER_RIDER;

    for (let iteration = 0; iteration < totalRidersNeeded; iteration++) {
      const remaining = Object.values(targetRemaining).reduce((a, b) => a + b, 0);
      if (remaining === 0) break;

      let bestPair = null;
      let bestScore = -Infinity;
      let isBestConsecutive = false;

      // Try all possible pairs and score them
      for (const [s1, s2] of allPairs) {
        if (targetRemaining[s1] > 0 && targetRemaining[s2] > 0) {
          // Simulate assignment
          const tempRemaining = {...targetRemaining};
          tempRemaining[s1]--;
          tempRemaining[s2]--;

          // Check if remaining can still be paired
          if (!canBePaired(tempRemaining)) {
            continue; // Skip pairs that would strand shifts
          }

          // Calculate score
          let score = 0;

          // Factor 1: Prefer consecutive pairs
          const isConsec = consecutivePairs.some(([p1, p2]) =>
            (s1 === p1 && s2 === p2) || (s1 === p2 && s2 === p1)
          );
          if (isConsec) score += 100;

          // Factor 2: Prefer using up bottleneck shifts (ones with fewer partners)
          const s1Partners = getValidPartners(s1);
          const s2Partners = getValidPartners(s2);
          const s1PartnerCap = s1Partners.reduce((sum, p) => sum + (tempRemaining[p] || 0), 0);
          const s2PartnerCap = s2Partners.reduce((sum, p) => sum + (tempRemaining[p] || 0), 0);

          const s1Ratio = tempRemaining[s1] > 0 ? tempRemaining[s1] / (s1PartnerCap + 1) : 0;
          const s2Ratio = tempRemaining[s2] > 0 ? tempRemaining[s2] / (s2PartnerCap + 1) : 0;

          score -= (s1Ratio + s2Ratio) * 50; // Prefer pairs that reduce bottleneck ratios

          // Factor 3: Balance - prefer pairs where both shifts have similar remaining
          const balance = 1 - Math.abs(targetRemaining[s1] - targetRemaining[s2]) /
                         (targetRemaining[s1] + targetRemaining[s2]);
          score += balance * 10;

          if (score > bestScore) {
            bestScore = score;
            bestPair = [s1, s2];
            isBestConsecutive = isConsec;
          }
        }
      }

      if (!bestPair) {
        console.log('FAILED: No valid pair found');
        console.log('Remaining:', targetRemaining);
        return {
          success: false,
          error: 'Could not assign all target shifts. Configuration validated but greedy algorithm failed - please report this bug.'
        };
      }

      // Assign the best pair
      const [s1, s2] = bestPair;
      riderSchedule.push({
        riderId: ++riderIndex,
        shifts: [s1, s2],
        isExtra: false
      });
      targetRemaining[s1]--;
      targetRemaining[s2]--;
    }

    console.log('Target assignment complete');
    console.log('Total riders scheduled for targets:', riderIndex);
    console.log('Final target remaining:', {...targetRemaining});

    // Final validation
    const remainingSum = Object.values(targetRemaining).reduce((a, b) => a + b, 0);
    if (remainingSum > 0) {
      console.log('FAILED: Targets not fully assigned');
      return {
        success: false,
        error: `Could not assign all target shifts. ${remainingSum} shifts remaining unassigned.`
      };
    }

    // ============ PHASE 3: EXTRA CAPACITY (CONSECUTIVE FIRST) ============

    const maxRemaining = {};
    Object.keys(shiftData).forEach(key => {
      maxRemaining[key] = shiftData[key].max - shiftData[key].target;
    });

    const extraRidersNeeded = numRiders - riderIndex;

    for (let i = 0; i < extraRidersNeeded; i++) {
      let bestPair = null;
      let bestScore = -Infinity;
      let bestIsConsecutive = false;

      // FIRST: Try to find best consecutive pair
      for (const [s1, s2] of consecutivePairs) {
        if (maxRemaining[s1] > 0 && maxRemaining[s2] > 0) {
          const tempRemaining = {...maxRemaining};
          tempRemaining[s1]--;
          tempRemaining[s2]--;

          // Calculate waste score
          let potentialWaste = 0;
          Object.keys(tempRemaining).forEach(slot => {
            const partners = getValidPartners(slot);
            const availablePartnerCap = partners.reduce((sum, p) => sum + tempRemaining[p], 0);
            if (tempRemaining[slot] > availablePartnerCap) {
              potentialWaste += (tempRemaining[slot] - availablePartnerCap);
            }
          });

          const minRemaining = Math.min(maxRemaining[s1], maxRemaining[s2]);
          const balance = 1 - Math.abs(maxRemaining[s1] - maxRemaining[s2]) / (maxRemaining[s1] + maxRemaining[s2] + 1);

          let score = 0;
          score -= potentialWaste * 100; // Heavily penalize waste
          score += (30 / (minRemaining + 1)); // Prefer using up smaller capacities
          score += balance * 15; // Prefer balanced pairs
          score += 50; // BONUS for consecutive

          if (score > bestScore) {
            bestScore = score;
            bestPair = [s1, s2];
            bestIsConsecutive = true;
          }
        }
      }

      // SECOND: If no good consecutive pair, try non-consecutive
      if (bestScore < 0 || bestPair === null) {
        for (const [s1, s2] of nonConsecutivePairs) {
          if (maxRemaining[s1] > 0 && maxRemaining[s2] > 0) {
            const tempRemaining = {...maxRemaining};
            tempRemaining[s1]--;
            tempRemaining[s2]--;

            let potentialWaste = 0;
            Object.keys(tempRemaining).forEach(slot => {
              const partners = getValidPartners(slot);
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
            // No consecutive bonus

            if (score > bestScore) {
              bestScore = score;
              bestPair = [s1, s2];
              bestIsConsecutive = false;
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
        break; // No more valid pairs available
      }
    }

    // ============ PHASE 4: FINAL CALCULATIONS ============

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
      warning: warning
    };
  };

  const getTotalTargetShifts = () => {
    return Object.values(shifts).reduce((sum, s) => sum + (parseInt(s.target) || 0), 0);
  };

  const getTotalMaxShifts = () => {
    return Object.values(shifts).reduce((sum, s) => {
      const target = parseInt(s.target) || 0;
      const maxInput = parseInt(s.max);
      const max = (s.max === '' || isNaN(maxInput)) ? target : maxInput;
      return sum + max;
    }, 0);
  };

  const getSlotLabel = (slotKey) => {
    const slot = timeSlots.find(s => s.key === slotKey);
    return slot ? `${slot.label} ${slot.time}` : slotKey;
  };

  const downloadCSV = () => {
    if (!schedule) return;

    const headers = ['Rider ID', 'Shift 1', 'Shift 2', 'Shift 1 Time', 'Shift 2 Time', 'Consecutive', 'Type'];
    const rows = schedule.map(rider => {
      const slot1 = timeSlots.find(s => s.key === rider.shifts[0]);
      const slot2 = timeSlots.find(s => s.key === rider.shifts[1]);
      return [
        `Rider ${rider.riderId}`,
        slot1?.label || rider.shifts[0],
        slot2?.label || rider.shifts[1],
        slot1?.time || '',
        slot2?.time || '',
        isConsecutive(rider.shifts[0], rider.shifts[1]) ? 'Yes' : 'No',
        rider.isExtra ? 'Extra' : 'Required'
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shift-schedule-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getShiftMetrics = () => {
    if (!schedule) return null;

    const metrics = timeSlots.map(slot => {
      const count = schedule.filter(r => r.shifts.includes(slot.key)).length;
      const target = parseInt(shifts[slot.key].target) || 0;
      const maxInput = parseInt(shifts[slot.key].max);
      const max = (shifts[slot.key].max === '' || isNaN(maxInput)) ? target : maxInput;

      // Calculate utilization as percentage of target (100% = target met)
      // If count exceeds target, show as percentage of max capacity beyond 100%
      let utilization;
      if (target > 0) {
        if (count <= target) {
          utilization = (count / target) * 100;
        } else {
          // Beyond target: 100% + extra percentage based on remaining capacity
          const extraCapacity = max - target;
          const extraUsed = count - target;
          utilization = 100 + (extraCapacity > 0 ? (extraUsed / extraCapacity) * 50 : 0); // Max 150%
        }
      } else {
        utilization = 0;
      }

      const targetMet = count >= target;
      const atCapacity = count >= max;
      const status = atCapacity ? 'full' : targetMet ? 'good' : 'under';

      return {
        ...slot,
        count,
        target,
        max,
        utilization,
        targetMet,
        atCapacity,
        status,
        available: max - count
      };
    });

    const totalScheduled = schedule.length;
    const consecutiveCount = schedule.filter(r => isConsecutive(r.shifts[0], r.shifts[1])).length;
    const nonConsecutiveCount = totalScheduled - consecutiveCount;
    const extraRiders = schedule.filter(r => r.isExtra).length;
    const requiredRiders = totalScheduled - extraRiders;

    return {
      shifts: metrics,
      totalScheduled,
      consecutiveCount,
      nonConsecutiveCount,
      extraRiders,
      requiredRiders,
      consecutivePercentage: totalScheduled > 0 ? (consecutiveCount / totalScheduled) * 100 : 0
    };
  };

  const metrics = getShiftMetrics();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-yellow-50 to-teal-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 rounded-xl" style={{ backgroundColor: '#ffe300' }}>
              <Calendar className="w-8 h-8 text-gray-900" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                Shift Scheduler
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">
                Intelligently assign shifts to riders with optimal capacity utilization and consecutive shift preferences
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Developed by <span className="font-semibold" style={{ color: '#00d097' }}>Khalid Ahmad Alhajj</span>
              </p>
            </div>
          </div>
        </div>

        {/* Input Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg" style={{ backgroundColor: '#ffe30020' }}>
              <Users className="w-5 h-5" style={{ color: '#00d097' }} />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Configuration</h2>
          </div>

          <div className="space-y-6">
            {/* Total Riders Input */}
            <div className="p-6 rounded-xl border-2" style={{ 
              background: 'linear-gradient(135deg, #ffe30010 0%, #00d09710 100%)',
              borderColor: '#ffe300'
            }}>
              <label htmlFor="totalRiders" className="block text-sm font-semibold text-gray-900 mb-2">
                Total Number of Riders
              </label>
              <input
                id="totalRiders"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={totalRiders}
                onChange={(e) => handleTotalRidersChange(e.target.value)}
                className="w-full px-4 py-3 text-lg border-2 rounded-lg focus:ring-2 transition-all"
                style={{ 
                  borderColor: '#ffe300',
                  outlineColor: '#00d097'
                }}
                placeholder="e.g., 42"
                onFocus={(e) => e.target.style.borderColor = '#00d097'}
                onBlur={(e) => e.target.style.borderColor = '#ffe300'}
              />
              <div className="mt-3 flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4" style={{ color: '#00d097' }} />
                  <span className="text-gray-600">Minimum Required:</span>
                  <span className="font-bold text-gray-900">{getTotalTargetShifts() / SHIFTS_PER_RIDER || 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4" style={{ color: '#00d097' }} />
                  <span className="text-gray-600">Maximum Capacity:</span>
                  <span className="font-bold text-gray-900">{Math.floor(getTotalMaxShifts() / SHIFTS_PER_RIDER) || 0}</span>
                </div>
              </div>
            </div>

            {/* Shift Requirements */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg" style={{ backgroundColor: '#ffe30020' }}>
                  <Clock className="w-5 h-5" style={{ color: '#00d097' }} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Shift Requirements</h3>
              </div>
              
              <div className="grid gap-4">
                {timeSlots.map((slot) => (
                  <div key={slot.id} className="bg-gray-50 p-5 rounded-xl border border-gray-200 hover:border-gray-300 transition-all">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">{slot.icon}</span>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{slot.label}</h4>
                        <p className="text-sm text-gray-600">{slot.time}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor={`${slot.key}-target`} className="block text-xs font-medium text-gray-700 mb-2">
                          Target Riders <span className="text-red-500">*</span>
                        </label>
                        <input
                          id={`${slot.key}-target`}
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={shifts[slot.key].target}
                          onChange={(e) => handleShiftChange(slot.key, 'target', e.target.value)}
                          className="w-full px-3 py-2 border-2 rounded-lg focus:ring-2 transition-all"
                          style={{ borderColor: '#ffe300' }}
                          placeholder="Required"
                          onFocus={(e) => {
                            e.target.style.borderColor = '#00d097';
                            e.target.style.boxShadow = '0 0 0 3px rgba(0, 208, 151, 0.1)';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = '#ffe300';
                            e.target.style.boxShadow = 'none';
                          }}
                        />
                      </div>
                      <div>
                        <label htmlFor={`${slot.key}-max`} className="block text-xs font-medium text-gray-700 mb-2">
                          Maximum Capacity
                        </label>
                        <input
                          id={`${slot.key}-max`}
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={shifts[slot.key].max}
                          onChange={(e) => handleShiftChange(slot.key, 'max', e.target.value)}
                          className="w-full px-3 py-2 border-2 rounded-lg focus:ring-2 transition-all"
                          style={{ borderColor: '#00d097' }}
                          placeholder="Extra capacity"
                          onFocus={(e) => {
                            e.target.style.borderColor = '#ffe300';
                            e.target.style.boxShadow = '0 0 0 3px rgba(255, 227, 0, 0.1)';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = '#00d097';
                            e.target.style.boxShadow = 'none';
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={generateSchedule}
              className="w-full text-gray-900 font-bold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              style={{ 
                background: 'linear-gradient(135deg, #ffe300 0%, #ffff00 100%)',
              }}
              onMouseEnter={(e) => e.target.style.background = 'linear-gradient(135deg, #ffff00 0%, #ffe300 100%)'}
              onMouseLeave={(e) => e.target.style.background = 'linear-gradient(135deg, #ffe300 0%, #ffff00 100%)'}
            >
              <BarChart3 className="w-5 h-5" />
              Generate Optimal Schedule
            </button>
          </div>

          {/* Messages */}
          {error && (
            <div className="mt-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-900 mb-1">Error</h4>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="mt-6 border-l-4 p-4 rounded-lg" style={{ 
              backgroundColor: '#00d09710',
              borderColor: '#00d097'
            }}>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#00d097' }} />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Success</h4>
                  <p className="text-gray-700 text-sm">{success}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Section */}
        {schedule && metrics && (
          <>
            {/* Overall Statistics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: '#ffe30020' }}>
                    <Users className="w-5 h-5" style={{ color: '#00d097' }} />
                  </div>
                  <h3 className="text-sm font-medium text-gray-600">Total Riders</h3>
                </div>
                <p className="text-3xl font-bold text-gray-900">{metrics.totalScheduled}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {metrics.requiredRiders} required + {metrics.extraRiders} extra
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: '#00d09720' }}>
                    <Zap className="w-5 h-5" style={{ color: '#00d097' }} />
                  </div>
                  <h3 className="text-sm font-medium text-gray-600">Consecutive Shifts</h3>
                </div>
                <p className="text-3xl font-bold text-gray-900">{metrics.consecutiveCount}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {metrics.consecutivePercentage.toFixed(0)}% of total riders
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-600">Non-Consecutive</h3>
                </div>
                <p className="text-3xl font-bold text-gray-900">{metrics.nonConsecutiveCount}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {(100 - metrics.consecutivePercentage).toFixed(0)}% of total riders
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: '#ffe30020' }}>
                    <BarChart3 className="w-5 h-5" style={{ color: '#00d097' }} />
                  </div>
                  <h3 className="text-sm font-medium text-gray-600">Total Shifts</h3>
                </div>
                <p className="text-3xl font-bold text-gray-900">{metrics.totalScheduled * 2}</p>
                <p className="text-xs text-gray-500 mt-1">
                  2 shifts per rider
                </p>
              </div>
            </div>

            {/* Shift Capacity Analysis */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: '#ffe30020' }}>
                    <TrendingUp className="w-5 h-5" style={{ color: '#00d097' }} />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Capacity Analysis by Time Slot</h2>
                </div>
                <div className="hidden sm:flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#00d097' }}></div>
                    <span className="text-gray-600">Target Met</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                    <span className="text-gray-600">Under Target</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ffe300' }}></div>
                    <span className="text-gray-600">At Capacity</span>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {metrics.shifts.map((shift) => (
                  <div key={shift.key} className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-3xl">{shift.icon}</span>
                        <div>
                          <h3 className="font-semibold text-gray-900">{shift.label}</h3>
                          <p className="text-sm text-gray-600">{shift.time}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">{shift.count}</div>
                        <div className="text-xs text-gray-500">riders assigned</div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="text-gray-600">Target Progress (100% = Target Met)</span>
                        <span className="font-semibold text-gray-900">{shift.utilization.toFixed(0)}%</span>
                      </div>
                      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full transition-all duration-500"
                          style={{
                            width: `${Math.min(shift.utilization, 100)}%`,
                            backgroundColor: shift.status === 'full' ? '#ffe300' : shift.status === 'good' ? '#00d097' : '#f59e0b'
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-white rounded-lg">
                        <div className="text-xs text-gray-600 mb-1">Target</div>
                        <div className="text-lg font-bold text-gray-900">{shift.target}</div>
                      </div>
                      <div className="text-center p-3 bg-white rounded-lg">
                        <div className="text-xs text-gray-600 mb-1">Assigned</div>
                        <div className="text-lg font-bold text-gray-900">{shift.count}</div>
                      </div>
                      <div className="text-center p-3 bg-white rounded-lg">
                        <div className="text-xs text-gray-600 mb-1">Maximum</div>
                        <div className="text-lg font-bold text-gray-900">{shift.max}</div>
                      </div>
                      <div className="text-center p-3 bg-white rounded-lg">
                        <div className="text-xs text-gray-600 mb-1">Available</div>
                        <div className="text-lg font-bold" style={{ color: shift.available > 0 ? '#00d097' : '#9ca3af' }}>
                          {shift.available}
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="mt-3 flex items-center gap-2">
                      {shift.atCapacity && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium" style={{
                          backgroundColor: '#ffe30020',
                          color: '#000'
                        }}>
                          <Info className="w-3 h-3" />
                          At Maximum Capacity
                        </span>
                      )}
                      {shift.targetMet && !shift.atCapacity && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium" style={{
                          backgroundColor: '#00d09720',
                          color: '#000'
                        }}>
                          <CheckCircle className="w-3 h-3" />
                          Target Met
                        </span>
                      )}
                      {!shift.targetMet && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                          <AlertTriangle className="w-3 h-3" />
                          Under Target ({shift.target - shift.count} short)
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Schedule Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: '#ffe30020' }}>
                    <Calendar className="w-5 h-5" style={{ color: '#00d097' }} />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Detailed Schedule</h2>
                </div>
                <button
                  onClick={downloadCSV}
                  className="inline-flex items-center gap-2 text-white font-semibold py-2 px-4 rounded-lg transition-all shadow-sm hover:shadow-md"
                  style={{ backgroundColor: '#00d097' }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#00b885'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#00d097'}
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Rider</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">First Shift</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Second Shift</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Type</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {schedule.map((rider, idx) => {
                      const consecutive = isConsecutive(rider.shifts[0], rider.shifts[1]);
                      const slot1 = timeSlots.find(s => s.key === rider.shifts[0]);
                      const slot2 = timeSlots.find(s => s.key === rider.shifts[1]);
                      
                      return (
                        <tr key={rider.riderId} className={`hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#ffe300' }}>
                                <span className="text-xs font-semibold text-gray-900">
                                  {rider.riderId}
                                </span>
                              </div>
                              <span className="font-medium text-gray-900">Rider {rider.riderId}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{slot1?.icon}</span>
                              <div>
                                <div className="font-medium text-gray-900">{slot1?.label}</div>
                                <div className="text-xs text-gray-500">{slot1?.time}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{slot2?.icon}</span>
                              <div>
                                <div className="font-medium text-gray-900">{slot2?.label}</div>
                                <div className="text-xs text-gray-500">{slot2?.time}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span 
                              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
                              style={{
                                backgroundColor: rider.isExtra ? '#00d09720' : '#ffe30020',
                                color: '#000'
                              }}
                            >
                              {rider.isExtra ? 'Extra' : 'Required'}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span 
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
                              style={{
                                backgroundColor: consecutive ? '#00d09720' : '#fef3c7',
                                color: consecutive ? '#000' : '#92400e'
                              }}
                            >
                              {consecutive ? (
                                <>
                                  <CheckCircle className="w-3 h-3" />
                                  Consecutive
                                </>
                              ) : (
                                <>
                                  <AlertTriangle className="w-3 h-3" />
                                  Non-consecutive
                                </>
                              )}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 text-sm text-gray-600 text-center">
                Showing {schedule.length} rider{schedule.length !== 1 ? 's' : ''} · {schedule.length * 2} total shifts assigned
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="mt-8 text-center pb-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200">
          <span className="text-sm text-gray-600">Developed by</span>
          <span className="text-sm font-bold" style={{ color: '#00d097' }}>Khalid Ahmad Alhajj</span>
          <span className="text-xs text-gray-400">© 2025</span>
        </div>
      </div>
    </div>
  );
}