/**
 * ============================================================================
 * VALIDATION UTILITIES - Optimized Version
 * ============================================================================
 *
 * Developer: Khalid Ahmad Alhajj
 * Version: 1.2.2 (Optimized with Pre-computed Partners Map)
 * Last Updated: November 2024
 *
 * All validation functions for shift scheduling with detailed diagnostics
 *
 * ============================================================================
 */

const SHIFTS_PER_RIDER = 2;

/**
 * PRE-COMPUTED PARTNERS MAP
 * Same optimization as in scheduler.js
 */
const PARTNERS_MAP = {
  slot1: ['slot2', 'slot5', 'slot3', 'slot4'],
  slot2: ['slot1', 'slot3', 'slot4', 'slot5'],
  slot3: ['slot2', 'slot4', 'slot1', 'slot5'],
  slot4: ['slot3', 'slot5', 'slot1', 'slot2'],
  slot5: ['slot4', 'slot1', 'slot2', 'slot3']
};

/**
 * Time slot configuration
 */
export const timeSlots = [
  { id: 'slot1', label: 'Shift 1', time: '12 AM - 4 AM', key: 'slot1', icon: '🌙' },
  { id: 'slot2', label: 'Shift 2', time: '4 AM - 10 AM', key: 'slot2', icon: '🌅' },
  { id: 'slot3', label: 'Shift 3', time: '10 AM - 3 PM', key: 'slot3', icon: '☀️' },
  { id: 'slot4', label: 'Shift 4', time: '3 PM - 8 PM', key: 'slot4', icon: '🌆' },
  { id: 'slot5', label: 'Shift 5', time: '8 PM - 12 AM', key: 'slot5', icon: '🌃' },
];

/**
 * Get valid partner slots for a given slot
 * OPTIMIZED: Now returns pre-computed array instead of recreating Set each time
 */
export const getValidPartners = (slot) => {
  return PARTNERS_MAP[slot] || [];
};

/**
 * Get human-readable label for a slot
 */
export const getSlotLabel = (slotKey) => {
  const slot = timeSlots.find(s => s.key === slotKey);
  return slot ? `${slot.label} (${slot.time})` : slotKey;
};

/**
 * Validate that all required inputs are provided
 */
export const validateInputCompleteness = (riders, shiftData) => {
  const issues = [];

  if (!riders || riders <= 0) {
    issues.push({
      type: 'missing_input',
      severity: 'error',
      field: 'Total Riders',
      message: 'Total number of riders is required',
      suggestion: 'Please enter the number of riders you want to schedule'
    });
  }

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

/**
 * Validate that max capacity is not less than target
 */
export const validateMaxCapacity = (shiftData) => {
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

/**
 * Validate that total shifts is even (divisible by 2)
 * NOTE: Changed to INFO instead of ERROR to allow odd shifts
 * The scheduler will handle partial assignments automatically
 */
export const validateEvenShifts = (totalTargetShifts) => {
  if (totalTargetShifts % SHIFTS_PER_RIDER !== 0) {
    const nearestEven = totalTargetShifts % 2 === 0 ? totalTargetShifts : totalTargetShifts + 1;
    return {
      type: 'odd_shifts',
      severity: 'info', // Changed from 'error' to 'info'
      message: `Total target shifts (${totalTargetShifts}) is not perfectly divisible by 2`,
      explanation: `Each rider works ${SHIFTS_PER_RIDER} shifts. With ${totalTargetShifts} target shifts, you'll have 1 shift that cannot be perfectly distributed.`,
      current: totalTargetShifts,
      needed: nearestEven,
      difference: nearestEven - totalTargetShifts,
      suggestion: `With current targets, 1 time slot will be 1 shift short of target, or 1 time slot will use 1 shift from max capacity.`
    };
  }
  return null;
};

/**
 * Validate rider count against available capacity
 */
export const validateRiderCapacity = (riders, totalTargetShifts, totalMaxShifts) => {
  const issues = [];
  const minRequiredRiders = totalTargetShifts / SHIFTS_PER_RIDER;
  const maxAllowedRiders = Math.floor(totalMaxShifts / SHIFTS_PER_RIDER);

  // Insufficient riders is now a WARNING, not an ERROR
  if (riders < minRequiredRiders) {
    issues.push({
      type: 'insufficient_riders',
      severity: 'warning',
      message: `Fewer riders than needed to meet all targets`,
      details: {
        provided: riders,
        required: minRequiredRiders,
        shortage: minRequiredRiders - riders,
        totalShifts: totalTargetShifts,
        shiftsPerRider: SHIFTS_PER_RIDER,
        canSchedule: riders * SHIFTS_PER_RIDER,
        willBeMissing: totalTargetShifts - (riders * SHIFTS_PER_RIDER)
      },
      explanation: `You have ${riders} riders, which can cover ${riders * SHIFTS_PER_RIDER} shifts out of ${totalTargetShifts} target shifts`,
      calculation: `${riders} riders × ${SHIFTS_PER_RIDER} shifts per rider = ${riders * SHIFTS_PER_RIDER} shifts (${totalTargetShifts - (riders * SHIFTS_PER_RIDER)} short of target)`,
      impact: `The scheduler will assign all ${riders} riders, but ${totalTargetShifts - (riders * SHIFTS_PER_RIDER)} target shifts will remain unfilled`,
      suggestion: `Increase riders to ${minRequiredRiders} to meet all targets, or adjust your target shift requirements`
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

/**
 * Validate pairing feasibility using Hall's Marriage Theorem
 */
export const validatePairingFeasibility = (shiftData, numRiders) => {
  const targets = {};

  // Scale down targets proportionally if we have fewer riders
  const totalTargetShifts = Object.values(shiftData).reduce((sum, s) => sum + s.target, 0);
  const minRequiredRiders = totalTargetShifts / SHIFTS_PER_RIDER;
  const availableShifts = numRiders * SHIFTS_PER_RIDER;

  // If we have fewer riders, validate against what we can actually schedule
  if (numRiders < minRequiredRiders) {
    // Proportionally scale down targets for validation
    const scaleFactor = availableShifts / totalTargetShifts;
    Object.keys(shiftData).forEach(key => {
      targets[key] = Math.floor(shiftData[key].target * scaleFactor);
    });
  } else {
    Object.keys(shiftData).forEach(key => {
      targets[key] = shiftData[key].target;
    });
  }

  const issues = [];
  const pairingAnalysis = {};

  for (const shift in targets) {
    if (targets[shift] > 0) {
      // OPTIMIZATION: Use pre-computed PARTNERS_MAP
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

  // Hall's Marriage Theorem check - O(2^n) complexity
  // Acceptable for small n (5 shifts = 32 iterations)
  // Breaks after first violation to minimize impact
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
      // OPTIMIZATION: Use pre-computed PARTNERS_MAP
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
      break;
    }
  }

  return { issues, pairingAnalysis };
};

/**
 * Detect stranded capacity that cannot be utilized
 */
export const detectStrandedCapacity = (shiftData, numRiders) => {
  const maxCapacity = {};
  Object.keys(shiftData).forEach(key => {
    maxCapacity[key] = shiftData[key].max;
  });

  const warnings = [];

  for (const shift in maxCapacity) {
    if (maxCapacity[shift] > 0) {
      // OPTIMIZATION: Use pre-computed PARTNERS_MAP
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
