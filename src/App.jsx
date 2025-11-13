/**
 * ============================================================================
 * SHIFT SCHEDULER - Enhanced Version with Detailed Validation
 * ============================================================================
 * 
 * Developer: Khalid Ahmad Alhajj
 * Version: 1.1.0 (Enhanced Validation)
 * Last Updated: November 2024
 * 
 * Enhancement: Added comprehensive validation with detailed error messages
 * and diagnostic information to help users identify and fix configuration issues.
 * 
 * Note: Core algorithm remains unchanged - only validation enhanced
 * ============================================================================
 */

import React, { useState } from 'react';
import { AlertCircle, CheckCircle, Calendar, Users, TrendingUp, Download, Clock, Target, Zap, BarChart3, AlertTriangle, Info, HelpCircle, XCircle } from 'lucide-react';

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
  const [validationDetails, setValidationDetails] = useState(null);
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
    if (value !== '' && !/^\d+$/.test(value)) {
      return;
    }
    
    setShifts(prev => ({
      ...prev,
      [slotKey]: { ...prev[slotKey], [field]: value }
    }));
    setError('');
    setValidationDetails(null);
    setSuccess('');
  };

  const handleTotalRidersChange = (value) => {
    if (value !== '' && !/^\d+$/.test(value)) {
      return;
    }
    
    setTotalRiders(value);
    setError('');
    setValidationDetails(null);
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

  // ============================================================================
  // ENHANCED VALIDATION HELPER FUNCTIONS
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

  const getSlotLabel = (slotKey) => {
    const slot = timeSlots.find(s => s.key === slotKey);
    return slot ? `${slot.label} (${slot.time})` : slotKey;
  };

  const validateInputCompleteness = (riders, shiftData) => {
    const issues = [];
    
    // Check if total riders is provided
    if (!riders || riders <= 0) {
      issues.push({
        type: 'missing_input',
        severity: 'error',
        field: 'Total Riders',
        message: 'Total number of riders is required',
        suggestion: 'Please enter the number of riders you want to schedule'
      });
    }

    // Check if all shift targets are provided
    let missingTargets = [];
    Object.keys(shiftData).forEach(key => {
      if (!shiftData[key].target || shiftData[key].target === 0) {
        missingTargets.push(getSlotLabel(key));
      }
    });

    if (missingTargets.length > 0) {
      issues.push({
        type: 'missing_targets',
        severity: 'error',
        message: `Target shifts missing for ${missingTargets.length} slot(s)`,
        details: missingTargets,
        suggestion: 'Enter target values for all shifts (minimum required riders per shift)'
      });
    }

    return issues;
  };

  const validateMaxCapacity = (shiftData) => {
    const issues = [];
    
    Object.keys(shiftData).forEach(key => {
      const target = shiftData[key].target;
      const max = shiftData[key].max;
      
      if (max < target) {
        issues.push({
          type: 'invalid_max',
          severity: 'error',
          slot: key,
          slotLabel: getSlotLabel(key),
          message: `Maximum (${max}) is less than target (${target})`,
          suggestion: `Set maximum to at least ${target} or leave blank to use target value`
        });
      }
    });

    return issues;
  };

  const validateEvenShifts = (totalTargetShifts) => {
    if (totalTargetShifts % SHIFTS_PER_RIDER !== 0) {
      const nearestEven = totalTargetShifts % 2 === 0 ? totalTargetShifts : totalTargetShifts + 1;
      return {
        type: 'odd_shifts',
        severity: 'error',
        message: `Total target shifts (${totalTargetShifts}) must be even`,
        explanation: `Each rider needs exactly ${SHIFTS_PER_RIDER} shifts, so total shifts must be divisible by 2`,
        current: totalTargetShifts,
        needed: nearestEven,
        difference: nearestEven - totalTargetShifts,
        suggestion: `Add ${nearestEven - totalTargetShifts} more shift(s) to reach ${nearestEven} total shifts`
      };
    }
    return null;
  };

  const validateRiderCapacity = (riders, totalTargetShifts, totalMaxShifts) => {
    const issues = [];
    const minRequiredRiders = totalTargetShifts / SHIFTS_PER_RIDER;
    const maxAllowedRiders = Math.floor(totalMaxShifts / SHIFTS_PER_RIDER);

    if (riders < minRequiredRiders) {
      issues.push({
        type: 'insufficient_riders',
        severity: 'error',
        message: `Not enough riders to meet target requirements`,
        details: {
          provided: riders,
          required: minRequiredRiders,
          shortage: minRequiredRiders - riders,
          totalShifts: totalTargetShifts,
          shiftsPerRider: SHIFTS_PER_RIDER
        },
        explanation: `You need ${totalTargetShifts} shifts total, and each rider covers ${SHIFTS_PER_RIDER} shifts`,
        calculation: `${totalTargetShifts} shifts ÷ ${SHIFTS_PER_RIDER} shifts per rider = ${minRequiredRiders} riders needed`,
        suggestion: `Increase riders to ${minRequiredRiders} or reduce target shifts by ${(minRequiredRiders - riders) * SHIFTS_PER_RIDER}`
      });
    }

    if (riders > maxAllowedRiders) {
      issues.push({
        type: 'excess_riders',
        severity: 'error',
        message: `Too many riders for available capacity`,
        details: {
          provided: riders,
          maximum: maxAllowedRiders,
          excess: riders - maxAllowedRiders,
          totalCapacity: totalMaxShifts,
          shiftsPerRider: SHIFTS_PER_RIDER
        },
        explanation: `You have ${totalMaxShifts} maximum shift slots, and each rider needs ${SHIFTS_PER_RIDER} shifts`,
        calculation: `${totalMaxShifts} shifts ÷ ${SHIFTS_PER_RIDER} shifts per rider = ${maxAllowedRiders} riders maximum`,
        suggestion: `Reduce riders to ${maxAllowedRiders} or increase maximum capacity by ${(riders - maxAllowedRiders) * SHIFTS_PER_RIDER} shifts`
      });
    }

    return issues;
  };

  const validatePairingFeasibility = (shiftData) => {
    const targets = {};
    Object.keys(shiftData).forEach(key => {
      targets[key] = shiftData[key].target;
    });

    const issues = [];
    const pairingAnalysis = {};

    // Check 1: Each shift must be pairable with available partners
    for (const shift in targets) {
      if (targets[shift] > 0) {
        const partners = getValidPartners(shift);
        const partnerCapacity = partners.reduce((sum, p) => sum + targets[p], 0);
        
        pairingAnalysis[shift] = {
          demand: targets[shift],
          partners: partners,
          partnerCapacity: partnerCapacity,
          deficit: Math.max(0, targets[shift] - partnerCapacity),
          canPair: targets[shift] <= partnerCapacity
        };

        if (targets[shift] > partnerCapacity) {
          const deficit = targets[shift] - partnerCapacity;
          const slot = timeSlots.find(s => s.key === shift);
          
          issues.push({
            type: 'pairing_impossible',
            severity: 'error',
            slot: shift,
            slotLabel: getSlotLabel(shift),
            message: `${slot?.label || shift} cannot pair all its riders`,
            details: {
              slotDemand: targets[shift],
              availablePartners: partners.map(p => getSlotLabel(p)),
              partnerCapacity: partnerCapacity,
              deficit: deficit
            },
            explanation: `${slot?.label} needs ${targets[shift]} riders, but its partner slots only have ${partnerCapacity} capacity total`,
            partnerBreakdown: partners.map(p => ({
              slot: getSlotLabel(p),
              capacity: targets[p]
            })),
            suggestion: deficit <= 5 
              ? `Reduce ${slot?.label} target by ${deficit} OR increase partner capacity by ${deficit} total`
              : `This is a major imbalance. Consider redistributing ${deficit} riders from ${slot?.label} to partner shifts`
          });
        }
      }
    }

    // Check 2: Hall's Marriage Theorem for complex pairing issues
    const shifts = Object.keys(targets).filter(s => targets[s] > 0);
    
    for (let mask = 1; mask < (1 << shifts.length); mask++) {
      const subset = [];
      let subsetDemand = 0;

      for (let i = 0; i < shifts.length; i++) {
        if (mask & (1 << i)) {
          subset.push(shifts[i]);
          subsetDemand += targets[shifts[i]];
        }
      }

      const neighbors = new Set();
      for (const shift of subset) {
        const partners = getValidPartners(shift);
        partners.forEach(p => neighbors.add(p));
      }

      let neighborCapacity = 0;
      neighbors.forEach(n => {
        neighborCapacity += targets[n] || 0;
      });

      if (subsetDemand > neighborCapacity) {
        issues.push({
          type: 'complex_pairing_issue',
          severity: 'error',
          message: `Group of shifts cannot be paired (Hall's Theorem violation)`,
          details: {
            affectedShifts: subset.map(s => getSlotLabel(s)),
            totalDemand: subsetDemand,
            availableCapacity: neighborCapacity,
            deficit: subsetDemand - neighborCapacity
          },
          explanation: `The shifts ${subset.map(s => getSlotLabel(s)).join(', ')} collectively need ${subsetDemand} pairings, but their partners only provide ${neighborCapacity} capacity`,
          suggestion: `This is a complex constraint violation. Rebalance the configuration by reducing demand in these shifts or increasing capacity in their partner shifts`
        });
        break; // Only report first violation to avoid overwhelming user
      }
    }

    return { issues, pairingAnalysis };
  };

  const detectStrandedCapacity = (shiftData, numRiders) => {
    const maxCapacity = {};
    Object.keys(shiftData).forEach(key => {
      maxCapacity[key] = shiftData[key].max;
    });

    const warnings = [];

    for (const shift in maxCapacity) {
      if (maxCapacity[shift] > 0) {
        const partners = getValidPartners(shift);
        const partnerCapacity = partners.reduce((sum, p) => sum + maxCapacity[p], 0);

        if (maxCapacity[shift] > partnerCapacity) {
          const slot = timeSlots.find(s => s.key === shift);
          const stranded = maxCapacity[shift] - partnerCapacity;
          const usableCapacity = partnerCapacity;
          
          warnings.push({
            type: 'stranded_capacity',
            severity: 'warning',
            slot: shift,
            slotLabel: getSlotLabel(shift),
            message: `${slot?.label} has capacity that cannot be fully utilized`,
            details: {
              maxCapacity: maxCapacity[shift],
              usableCapacity: usableCapacity,
              strandedCapacity: stranded,
              utilizationRate: ((usableCapacity / maxCapacity[shift]) * 100).toFixed(1) + '%'
            },
            explanation: `${slot?.label} has maximum capacity of ${maxCapacity[shift]}, but partner slots only have ${partnerCapacity} total capacity`,
            impact: `Up to ${stranded} rider(s) may not be schedulable even if requested`,
            suggestion: `For better capacity utilization, reduce ${slot?.label} max to ${usableCapacity} OR increase partner capacities by ${stranded} total`
          });
        }
      }
    }

    return warnings;
  };

  const generateSchedule = () => {
    setError('');
    setSuccess('');
    setSchedule(null);
    setValidationDetails(null);

    const riders = parseInt(totalRiders);
    const shiftData = {};

    // Parse shift data
    for (const key of Object.keys(shifts)) {
      const targetInput = shifts[key].target;
      const maxInput = shifts[key].max;

      const target = parseInt(targetInput) || 0;
      const maxParsed = parseInt(maxInput);
      const max = (maxInput === '' || isNaN(maxParsed)) ? target : maxParsed;

      shiftData[key] = { target, max };
    }

    // ============================================================================
    // PHASE 1: COMPREHENSIVE VALIDATION WITH DETAILED DIAGNOSTICS
    // ============================================================================

    const validationResults = {
      errors: [],
      warnings: [],
      info: []
    };

    // Step 1: Check input completeness
    const completenessIssues = validateInputCompleteness(riders, shiftData);
    validationResults.errors.push(...completenessIssues);

    if (completenessIssues.length > 0) {
      setError('Incomplete input - please fill in all required fields');
      setValidationDetails(validationResults);
      return;
    }

    // Step 2: Validate max >= target for each shift
    const maxCapacityIssues = validateMaxCapacity(shiftData);
    validationResults.errors.push(...maxCapacityIssues);

    if (maxCapacityIssues.length > 0) {
      setError('Invalid maximum capacity values detected');
      setValidationDetails(validationResults);
      return;
    }

    // Step 3: Performance guard
    if (riders > 10000) {
      validationResults.errors.push({
        type: 'performance_limit',
        severity: 'error',
        message: 'Maximum 10,000 riders allowed for performance reasons',
        details: { requested: riders, maximum: 10000 },
        suggestion: 'Please reduce the number of riders to 10,000 or less'
      });
      setError('Too many riders requested - maximum is 10,000');
      setValidationDetails(validationResults);
      return;
    }

    const totalTargetShifts = Object.values(shiftData).reduce((sum, s) => sum + s.target, 0);
    const totalMaxShifts = Object.values(shiftData).reduce((sum, s) => sum + s.max, 0);

    // Step 4: Validate even number of shifts
    const evenShiftsIssue = validateEvenShifts(totalTargetShifts);
    if (evenShiftsIssue) {
      validationResults.errors.push(evenShiftsIssue);
      setError('Total target shifts must be even (each rider needs 2 shifts)');
      setValidationDetails(validationResults);
      return;
    }

    // Step 5: Validate rider capacity
    const riderCapacityIssues = validateRiderCapacity(riders, totalTargetShifts, totalMaxShifts);
    validationResults.errors.push(...riderCapacityIssues);

    if (riderCapacityIssues.length > 0) {
      setError('Rider count does not match shift capacity');
      setValidationDetails(validationResults);
      return;
    }

    // Step 6: Validate pairing feasibility
    const { issues: pairingIssues, pairingAnalysis } = validatePairingFeasibility(shiftData);
    validationResults.errors.push(...pairingIssues);

    if (pairingIssues.length > 0) {
      setError('Configuration has pairing impossibilities - cannot schedule');
      setValidationDetails({ ...validationResults, pairingAnalysis });
      return;
    }

    // Step 7: Check for stranded capacity (warnings only)
    const strandedWarnings = detectStrandedCapacity(shiftData, riders);
    validationResults.warnings.push(...strandedWarnings);

    // Add info about the configuration
    validationResults.info.push({
      type: 'configuration_summary',
      message: 'Configuration Summary',
      details: {
        totalRiders: riders,
        totalTargetShifts: totalTargetShifts,
        totalMaxShifts: totalMaxShifts,
        minRidersNeeded: totalTargetShifts / SHIFTS_PER_RIDER,
        maxRidersPossible: Math.floor(totalMaxShifts / SHIFTS_PER_RIDER),
        extraCapacity: totalMaxShifts - totalTargetShifts,
        extraCapacityPercent: (((totalMaxShifts - totalTargetShifts) / totalTargetShifts) * 100).toFixed(1) + '%'
      }
    });

    // ============================================================================
    // PHASE 2: RUN SCHEDULING ALGORITHM (UNCHANGED)
    // ============================================================================

    const result = createSchedule(riders, shiftData);

    if (result.success) {
      setSchedule(result.schedule);
      const actualRiders = result.schedule.length;
      const targetRiders = totalTargetShifts / SHIFTS_PER_RIDER;

      let message;
      if (actualRiders < riders) {
        message = `⚠️ Partially scheduled: ${actualRiders} of ${riders} riders. ${riders - actualRiders} rider(s) could not be scheduled.`;
        validationResults.warnings.push({
          type: 'partial_scheduling',
          severity: 'warning',
          message: `Only ${actualRiders} of ${riders} riders were scheduled`,
          details: {
            requested: riders,
            scheduled: actualRiders,
            unscheduled: riders - actualRiders
          },
          explanation: 'Maximum capacity constraints prevented scheduling all riders',
          suggestion: 'Increase maximum capacity in bottleneck shifts to accommodate more riders'
        });
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

      if (result.warning) {
        message += ` ${result.warning}`;
      }

      setSuccess(message);
      if (validationResults.warnings.length > 0 || validationResults.info.length > 0) {
        setValidationDetails(validationResults);
      }
    } else {
      setError(result.error);
      validationResults.errors.push({
        type: 'algorithm_error',
        severity: 'error',
        message: result.error,
        suggestion: 'This should not happen with valid input. Please report this as a bug.'
      });
      setValidationDetails(validationResults);
    }
  };

  // ============================================================================
  // ORIGINAL SCHEDULING ALGORITHM (UNCHANGED)
  // ============================================================================

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

  const createSchedule = (numRiders, shiftData) => {
    const totalTargetShifts = Object.values(shiftData).reduce((sum, s) => sum + s.target, 0);
    const minRidersForTarget = totalTargetShifts / SHIFTS_PER_RIDER;

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

    const totalRidersNeeded = totalTargetShifts / SHIFTS_PER_RIDER;

    for (let iteration = 0; iteration < totalRidersNeeded; iteration++) {
      const remaining = Object.values(targetRemaining).reduce((a, b) => a + b, 0);
      if (remaining === 0) break;

      let bestPair = null;
      let bestScore = -Infinity;

      for (const [s1, s2] of allPairs) {
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
          if (isConsec) score += 100;

          const s1Partners = getValidPartners(s1);
          const s2Partners = getValidPartners(s2);
          const s1PartnerCap = s1Partners.reduce((sum, p) => sum + (tempRemaining[p] || 0), 0);
          const s2PartnerCap = s2Partners.reduce((sum, p) => sum + (tempRemaining[p] || 0), 0);

          const s1Ratio = tempRemaining[s1] > 0 ? tempRemaining[s1] / (s1PartnerCap + 1) : 0;
          const s2Ratio = tempRemaining[s2] > 0 ? tempRemaining[s2] / (s2PartnerCap + 1) : 0;

          score -= (s1Ratio + s2Ratio) * 50;

          const balance = 1 - Math.abs(targetRemaining[s1] - targetRemaining[s2]) /
                         (targetRemaining[s1] + targetRemaining[s2]);
          score += balance * 10;

          if (score > bestScore) {
            bestScore = score;
            bestPair = [s1, s2];
          }
        }
      }

      if (!bestPair) {
        return {
          success: false,
          error: 'Could not assign all target shifts. Configuration validated but greedy algorithm failed - please report this bug.'
        };
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

    const remainingSum = Object.values(targetRemaining).reduce((a, b) => a + b, 0);
    if (remainingSum > 0) {
      return {
        success: false,
        error: `Could not assign all target shifts. ${remainingSum} shifts remaining unassigned.`
      };
    }

    const maxRemaining = {};
    Object.keys(shiftData).forEach(key => {
      maxRemaining[key] = shiftData[key].max - shiftData[key].target;
    });

    const extraRidersNeeded = numRiders - riderIndex;

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

      let utilization;
      if (target > 0) {
        if (count <= target) {
          utilization = (count / target) * 100;
        } else {
          const extraCapacity = max - target;
          const extraUsed = count - target;
          utilization = 100 + (extraCapacity > 0 ? (extraUsed / extraCapacity) * 50 : 0);
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
                Developed by <span className="font-semibold" style={{ color: '#00d097' }}>Khalid Ahmad Alhajj</span> • v1.1.0 (Enhanced Validation)
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

          {/* Enhanced Validation Details */}
          {validationDetails && (
            <div className="mt-6 space-y-4">
              {/* Errors */}
              {validationDetails.errors && validationDetails.errors.length > 0 && (
                <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
                  <div className="flex items-start gap-3 mb-4">
                    <XCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-bold text-red-900 text-lg mb-2">
                        {validationDetails.errors.length} Error{validationDetails.errors.length > 1 ? 's' : ''} Found
                      </h4>
                      <p className="text-red-700 text-sm mb-4">
                        Please fix the following issues before scheduling:
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {validationDetails.errors.map((error, idx) => (
                      <div key={idx} className="bg-white p-4 rounded-lg border border-red-200">
                        <div className="flex items-start gap-3 mb-3">
                          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <h5 className="font-semibold text-red-900 mb-1">
                              {error.slotLabel && `${error.slotLabel}: `}{error.message}
                            </h5>
                            
                            {error.explanation && (
                              <p className="text-sm text-gray-700 mb-2 mt-2">
                                <span className="font-medium">Why:</span> {error.explanation}
                              </p>
                            )}

                            {error.details && (
                              <div className="bg-gray-50 p-3 rounded mt-2 text-sm">
                                <p className="font-medium text-gray-900 mb-2">Details:</p>
                                {typeof error.details === 'object' && !Array.isArray(error.details) ? (
                                  <ul className="space-y-1 text-gray-700">
                                    {Object.entries(error.details).map(([key, value]) => (
                                      <li key={key}>
                                        <span className="font-medium">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</span> {typeof value === 'object' ? JSON.stringify(value) : value}
                                      </li>
                                    ))}
                                  </ul>
                                ) : Array.isArray(error.details) ? (
                                  <ul className="list-disc list-inside text-gray-700">
                                    {error.details.map((item, i) => (
                                      <li key={i}>{item}</li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-gray-700">{error.details}</p>
                                )}
                              </div>
                            )}

                            {error.calculation && (
                              <div className="bg-blue-50 p-3 rounded mt-2 text-sm border border-blue-200">
                                <p className="font-medium text-blue-900 mb-1">Calculation:</p>
                                <p className="text-blue-800 font-mono">{error.calculation}</p>
                              </div>
                            )}

                            {error.partnerBreakdown && (
                              <div className="bg-gray-50 p-3 rounded mt-2 text-sm">
                                <p className="font-medium text-gray-900 mb-2">Partner Slots Capacity:</p>
                                <ul className="space-y-1">
                                  {error.partnerBreakdown.map((partner, i) => (
                                    <li key={i} className="text-gray-700">
                                      • {partner.slot}: {partner.capacity} riders
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {error.suggestion && (
                              <div className="mt-3 p-3 rounded" style={{ backgroundColor: '#ffe30020', borderLeft: '3px solid #ffe300' }}>
                                <p className="text-sm">
                                  <span className="font-semibold text-gray-900">💡 Solution: </span>
                                  <span className="text-gray-700">{error.suggestion}</span>
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings */}
              {validationDetails.warnings && validationDetails.warnings.length > 0 && (
                <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-lg">
                  <div className="flex items-start gap-3 mb-4">
                    <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-bold text-amber-900 text-lg mb-2">
                        {validationDetails.warnings.length} Warning{validationDetails.warnings.length > 1 ? 's' : ''}
                      </h4>
                      <p className="text-amber-700 text-sm mb-4">
                        Scheduling will work, but consider these optimizations:
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {validationDetails.warnings.map((warning, idx) => (
                      <div key={idx} className="bg-white p-4 rounded-lg border border-amber-200">
                        <div className="flex items-start gap-3">
                          <HelpCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <h5 className="font-semibold text-amber-900 mb-1">
                              {warning.slotLabel && `${warning.slotLabel}: `}{warning.message}
                            </h5>
                            
                            {warning.explanation && (
                              <p className="text-sm text-gray-700 mt-2">
                                {warning.explanation}
                              </p>
                            )}

                            {warning.details && (
                              <div className="bg-gray-50 p-3 rounded mt-2 text-sm">
                                <ul className="space-y-1 text-gray-700">
                                  {Object.entries(warning.details).map(([key, value]) => (
                                    <li key={key}>
                                      <span className="font-medium">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</span> {value}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {warning.impact && (
                              <p className="text-sm text-amber-700 mt-2">
                                <span className="font-medium">Impact:</span> {warning.impact}
                              </p>
                            )}

                            {warning.suggestion && (
                              <div className="mt-3 p-3 rounded" style={{ backgroundColor: '#00d09720', borderLeft: '3px solid #00d097' }}>
                                <p className="text-sm">
                                  <span className="font-semibold text-gray-900">💡 Optimization: </span>
                                  <span className="text-gray-700">{warning.suggestion}</span>
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Info */}
              {validationDetails.info && validationDetails.info.length > 0 && !error && (
                <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Info className="w-6 h-6 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-bold text-blue-900 text-lg mb-3">Configuration Analysis</h4>
                      
                      {validationDetails.info.map((info, idx) => (
                        <div key={idx}>
                          {info.details && (
                            <div className="bg-white p-4 rounded-lg border border-blue-200">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                {Object.entries(info.details).map(([key, value]) => (
                                  <div key={key}>
                                    <span className="text-gray-600">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</span>
                                    <span className="ml-2 font-semibold text-gray-900">{value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Pairing Analysis */}
              {validationDetails.pairingAnalysis && (
                <div className="bg-gray-50 border-l-4 border-gray-400 p-6 rounded-lg">
                  <div className="flex items-start gap-3 mb-4">
                    <BarChart3 className="w-6 h-6 text-gray-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 text-lg mb-2">Pairing Analysis</h4>
                      <p className="text-sm text-gray-600 mb-4">Detailed breakdown of shift pairing feasibility</p>
                    </div>
                  </div>

                  <div className="grid gap-3">
                    {Object.entries(validationDetails.pairingAnalysis).map(([slot, analysis]) => (
                      <div key={slot} className={`p-4 rounded-lg border ${analysis.canPair ? 'bg-white border-gray-200' : 'bg-red-50 border-red-300'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-gray-900">{getSlotLabel(slot)}</span>
                          {analysis.canPair ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                        <div className="text-sm text-gray-700 space-y-1">
                          <div>Demand: <span className="font-medium">{analysis.demand}</span></div>
                          <div>Partner Capacity: <span className="font-medium">{analysis.partnerCapacity}</span></div>
                          {analysis.deficit > 0 && (
                            <div className="text-red-700 font-medium">
                              ⚠️ Deficit: {analysis.deficit}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Simple Error Message (for users who don't need details) */}
          {error && !validationDetails && (
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

          {/* Success Message */}
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

        {/* Results Section (unchanged) */}
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
          <span className="text-xs text-gray-400">© 2025 • v1.1.0</span>
        </div>
      </div>
    </div>
  );
}