/**
 * ============================================================================
 * VALIDATION UTILITIES - 6 Shifts Version
 * ============================================================================
 *
 * Developer: Khalid Ahmad Alhajj
 * Version: 1.0.0 (6 Shifts Implementation)
 * Last Updated: November 2024
 *
 * All validation functions for 6-shift scheduling with detailed diagnostics
 * Based on the new 6-shift scheme where riders work 3 shifts per day (11-13 hours)
 *
 * ============================================================================
 */

const SHIFTS_PER_RIDER = 3;

/**
 * PRE-COMPUTED PARTNERS MAP for 6 shifts
 * Each shift can pair with any other shift (for flexibility in 3-shift assignments)
 */
const PARTNERS_MAP = {
  slot1: ['slot2', 'slot6', 'slot3', 'slot4', 'slot5'],
  slot2: ['slot1', 'slot3', 'slot4', 'slot5', 'slot6'],
  slot3: ['slot2', 'slot4', 'slot1', 'slot5', 'slot6'],
  slot4: ['slot3', 'slot5', 'slot1', 'slot2', 'slot6'],
  slot5: ['slot4', 'slot6', 'slot1', 'slot2', 'slot3'],
  slot6: ['slot5', 'slot1', 'slot2', 'slot3', 'slot4']
};

/**
 * Time slot configuration for 6 shifts
 * Based on the document specifications:
 * - 0~2:59: Midnight
 * - 3~7:59: Sunrise/Early Morning
 * - 8~11:59: Breakfast/Morning
 * - 12~15:59: Lunch
 * - 16~19:59: Afternoon/Evening
 * - 20~23:59: Dinner
 */
export const timeSlots6 = [
  { id: 'slot1', label: 'Shift 1 (Midnight)', time: '12 AM - 3 AM', key: 'slot1', icon: '🌙' },
  { id: 'slot2', label: 'Shift 2 (Sunrise)', time: '3 AM - 8 AM', key: 'slot2', icon: '🌅' },
  { id: 'slot3', label: 'Shift 3 (Breakfast)', time: '8 AM - 12 PM', key: 'slot3', icon: '☀️' },
  { id: 'slot4', label: 'Shift 4 (Lunch)', time: '12 PM - 4 PM', key: 'slot4', icon: '🍽️' },
  { id: 'slot5', label: 'Shift 5 (Afternoon)', time: '4 PM - 8 PM', key: 'slot5', icon: '🌆' },
  { id: 'slot6', label: 'Shift 6 (Dinner)', time: '8 PM - 12 AM', key: 'slot6', icon: '🌃' },
];

/**
 * Get valid partner slots for a given slot
 */
export const getValidPartners6 = (slot) => {
  return PARTNERS_MAP[slot] || [];
};

/**
 * Get human-readable label for a slot
 */
export const getSlotLabel6 = (slotKey) => {
  const slot = timeSlots6.find(s => s.key === slotKey);
  return slot ? `${slot.label} (${slot.time})` : slotKey;
};

/**
 * Validate that all required inputs are provided
 */
export const validateInputCompleteness6 = (riders, shiftData) => {
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
      missingTargets.push(getSlotLabel6(key));
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
export const validateMaxCapacity6 = (shiftData) => {
  const issues = [];

  Object.keys(shiftData).forEach(key => {
    const target = shiftData[key].target;
    const max = shiftData[key].max;

    if (max < target) {
      issues.push({
        type: 'invalid_max',
        severity: 'error',
        slot: key,
        slotLabel: getSlotLabel6(key),
        message: `Maximum (${max}) is less than target (${target})`,
        suggestion: `Set maximum to at least ${target} or leave blank to use target value`
      });
    }
  });

  return issues;
};

/**
 * Validate that total shifts is divisible by 3 (each rider needs 3 shifts)
 */
export const validateDivisibleShifts6 = (totalTargetShifts) => {
  if (totalTargetShifts % SHIFTS_PER_RIDER !== 0) {
    const nearestDivisible = Math.ceil(totalTargetShifts / SHIFTS_PER_RIDER) * SHIFTS_PER_RIDER;
    return {
      type: 'non_divisible_shifts',
      severity: 'error',
      message: `Total target shifts (${totalTargetShifts}) must be divisible by 3`,
      explanation: `Each rider needs exactly ${SHIFTS_PER_RIDER} shifts, so total shifts must be divisible by 3`,
      current: totalTargetShifts,
      needed: nearestDivisible,
      difference: nearestDivisible - totalTargetShifts,
      suggestion: `Add ${nearestDivisible - totalTargetShifts} more shift(s) to reach ${nearestDivisible} total shifts`
    };
  }
  return null;
};

/**
 * Validate rider count against available capacity
 */
export const validateRiderCapacity6 = (riders, totalTargetShifts, totalMaxShifts) => {
  const issues = [];
  const minRequiredRiders = totalTargetShifts / SHIFTS_PER_RIDER;
  const maxAllowedRiders = Math.floor(totalMaxShifts / SHIFTS_PER_RIDER);

  // Insufficient riders is a WARNING, not an ERROR
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
 * Validate that shifts can form valid 3-consecutive groups
 * For 6-shift scheme, we want riders to have 3 consecutive shifts
 */
export const validatePairingFeasibility6 = (shiftData, numRiders) => {
  const targets = {};

  // Scale down targets proportionally if we have fewer riders
  const totalTargetShifts = Object.values(shiftData).reduce((sum, s) => sum + s.target, 0);
  const minRequiredRiders = totalTargetShifts / SHIFTS_PER_RIDER;
  const availableShifts = numRiders * SHIFTS_PER_RIDER;

  // If we have fewer riders, validate against what we can actually schedule
  if (numRiders < minRequiredRiders) {
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

  // For 6-shift scheme, check if consecutive triplets can be formed
  const consecutiveTriplets = [
    ['slot1', 'slot2', 'slot3'], // Midnight + Sunrise + Breakfast
    ['slot2', 'slot3', 'slot4'], // Sunrise + Breakfast + Lunch
    ['slot3', 'slot4', 'slot5'], // Breakfast + Lunch + Afternoon
    ['slot4', 'slot5', 'slot6'], // Lunch + Afternoon + Dinner
    ['slot5', 'slot6', 'slot1'], // Afternoon + Dinner + Midnight (wrap)
    ['slot6', 'slot1', 'slot2'], // Dinner + Midnight + Sunrise (wrap)
  ];

  for (const shift in targets) {
    if (targets[shift] > 0) {
      const partners = getValidPartners6(shift);
      const partnerCapacity = partners.reduce((sum, p) => sum + targets[p], 0);

      pairingAnalysis[shift] = {
        demand: targets[shift],
        partners: partners,
        partnerCapacity: partnerCapacity,
        deficit: Math.max(0, targets[shift] - partnerCapacity),
        canPair: targets[shift] <= partnerCapacity
      };

      // For 6 shifts with 3 shifts per rider, each shift needs enough capacity in partner slots
      // to form valid triplets
      if (targets[shift] > partnerCapacity / 2) {
        const deficit = targets[shift] - Math.floor(partnerCapacity / 2);
        const slot = timeSlots6.find(s => s.key === shift);

        if (deficit > 0) {
          issues.push({
            type: 'pairing_difficult',
            severity: 'warning',
            slot: shift,
            slotLabel: getSlotLabel6(shift),
            message: `${slot?.label || shift} may have difficulty forming complete triplets`,
            details: {
              slotDemand: targets[shift],
              availablePartners: partners.map(p => getSlotLabel6(p)),
              partnerCapacity: partnerCapacity,
              deficit: deficit
            },
            explanation: `${slot?.label} needs ${targets[shift]} riders, and forming 3-shift groups requires sufficient partner capacity`,
            suggestion: `Consider redistributing capacity to ensure balanced triplet formation`
          });
        }
      }
    }
  }

  return { issues, pairingAnalysis };
};

/**
 * Detect stranded capacity that cannot be utilized
 */
export const detectStrandedCapacity6 = (shiftData, numRiders) => {
  const maxCapacity = {};
  Object.keys(shiftData).forEach(key => {
    maxCapacity[key] = shiftData[key].max;
  });

  const warnings = [];

  for (const shift in maxCapacity) {
    if (maxCapacity[shift] > 0) {
      const partners = getValidPartners6(shift);
      const partnerCapacity = partners.reduce((sum, p) => sum + maxCapacity[p], 0);

      // For 3-shift assignments, need at least 2 partner slots filled
      if (maxCapacity[shift] > partnerCapacity / 2) {
        const slot = timeSlots6.find(s => s.key === shift);
        const usableCapacity = Math.floor(partnerCapacity / 2);
        const stranded = maxCapacity[shift] - usableCapacity;

        if (stranded > 0) {
          warnings.push({
            type: 'stranded_capacity',
            severity: 'warning',
            slot: shift,
            slotLabel: getSlotLabel6(shift),
            message: `${slot?.label} has capacity that may not be fully utilized`,
            details: {
              maxCapacity: maxCapacity[shift],
              usableCapacity: usableCapacity,
              strandedCapacity: stranded,
              utilizationRate: ((usableCapacity / maxCapacity[shift]) * 100).toFixed(1) + '%'
            },
            explanation: `${slot?.label} has maximum capacity of ${maxCapacity[shift]}, but forming 3-shift groups limits effective capacity`,
            impact: `Up to ${stranded} rider(s) may not be schedulable even if requested`,
            suggestion: `For better capacity utilization, balance capacity across all 6 shifts`
          });
        }
      }
    }
  }

  return warnings;
};

export const SHIFTS_PER_RIDER_6 = SHIFTS_PER_RIDER;
