/**
 * ============================================================================
 * VALIDATION UTILITIES - Ramadan 8 Shifts Version
 * ============================================================================
 *
 * Developer: Khalid Ahmad Alhajj
 * Version: 1.0.0 (Ramadan 8 Shifts Implementation)
 * Last Updated: February 2026
 *
 * Validation functions for Ramadan 8-shift scheduling with 10-hour daily patterns
 * Supports 3 scheduling methods:
 * - Method 1: Day shift (6h) + 2 early night shifts (4h)
 * - Method 2: Day shift (6h) + 2 evening night shifts (4h)
 * - Method 3: 5 night shifts (10h) - Primary method for 90% of riders
 *
 * ============================================================================
 */

/**
 * Shifts per rider configuration for Ramadan
 * Method 1 & 2: 3 shifts (1 day + 2 night)
 * Method 3: 5 shifts (all night)
 */
const SHIFTS_PER_RIDER_METHOD_1_2 = 3; // 1 day (6h) + 2 night (4h) = 10h
const SHIFTS_PER_RIDER_METHOD_3 = 5;   // 5 night shifts (2h each) = 10h

/**
 * Time slot configuration for Ramadan 8 shifts
 * Night shifts: slot1, slot2, slot5, slot6, slot7, slot8 (2h each)
 * Day shifts: slot3, slot4 (6h each)
 */
export const timeSlotsRamadan = [
  { id: 'slot1', label: 'Early Suhoor', time: '12 AM - 2 AM', key: 'slot1', icon: '🌙', type: 'night', duration: 2 },
  { id: 'slot2', label: 'Suhoor', time: '2 AM - 4 AM', key: 'slot2', icon: '🌙', type: 'night', duration: 2 },
  { id: 'slot3', label: 'Daytime 1', time: '4 AM - 10 AM', key: 'slot3', icon: '☀️', type: 'day', duration: 6 },
  { id: 'slot4', label: 'Daytime 2', time: '10 AM - 4 PM', key: 'slot4', icon: '☀️', type: 'day', duration: 6 },
  { id: 'slot5', label: 'Pre-Iftar', time: '4 PM - 6 PM', key: 'slot5', icon: '🌅', type: 'night', duration: 2 },
  { id: 'slot6', label: 'Iftar', time: '6 PM - 8 PM', key: 'slot6', icon: '🍽️', type: 'night', duration: 2 },
  { id: 'slot7', label: 'Post-Iftar', time: '8 PM - 10 PM', key: 'slot7', icon: '🌃', type: 'night', duration: 2 },
  { id: 'slot8', label: 'Late Night', time: '10 PM - 12 AM', key: 'slot8', icon: '🌙', type: 'night', duration: 2 },
];

/**
 * Get night-only slots
 */
export const getNightSlots = () => {
  return timeSlotsRamadan.filter(s => s.type === 'night').map(s => s.key);
};

/**
 * Get day-only slots
 */
export const getDaySlots = () => {
  return timeSlotsRamadan.filter(s => s.type === 'day').map(s => s.key);
};

/**
 * Get human-readable label for a slot
 */
export const getSlotLabelRamadan = (slotKey) => {
  const slot = timeSlotsRamadan.find(s => s.key === slotKey);
  return slot ? `${slot.label} (${slot.time})` : slotKey;
};

/**
 * Check if a slot is a day shift
 */
export const isDaySlot = (slotKey) => {
  const slot = timeSlotsRamadan.find(s => s.key === slotKey);
  return slot?.type === 'day';
};

/**
 * Check if a slot is a night shift
 */
export const isNightSlot = (slotKey) => {
  const slot = timeSlotsRamadan.find(s => s.key === slotKey);
  return slot?.type === 'night';
};

/**
 * Validate that all required inputs are provided
 */
export const validateInputCompletenessRamadan = (riders, shiftData) => {
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
      missingTargets.push(getSlotLabelRamadan(key));
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
export const validateMaxCapacityRamadan = (shiftData) => {
  const issues = [];

  Object.keys(shiftData).forEach(key => {
    const target = shiftData[key].target;
    const max = shiftData[key].max;

    if (max < target) {
      issues.push({
        type: 'invalid_max',
        severity: 'error',
        slot: key,
        slotLabel: getSlotLabelRamadan(key),
        message: `Maximum (${max}) is less than target (${target})`,
        suggestion: `Set maximum to at least ${target} or leave blank to use target value`
      });
    }
  });

  return issues;
};

/**
 * Calculate minimum riders needed based on shift targets
 * For Ramadan, this is complex due to different methods
 */
export const calculateMinRidersRamadan = (shiftData) => {
  const totalNightShifts = getNightSlots().reduce((sum, key) => sum + (shiftData[key]?.target || 0), 0);
  const totalDayShifts = getDaySlots().reduce((sum, key) => sum + (shiftData[key]?.target || 0), 0);

  // Day shifts require Method 1 or 2 (3 shifts per rider: 1 day + 2 night)
  const ridersForDayShifts = totalDayShifts;

  // Night shifts consumed by day-shift riders (2 night shifts each)
  const nightShiftsFromDayRiders = ridersForDayShifts * 2;

  // Remaining night shifts need Method 3 riders (5 night shifts each)
  const remainingNightShifts = Math.max(0, totalNightShifts - nightShiftsFromDayRiders);
  const ridersForNightOnly = Math.ceil(remainingNightShifts / SHIFTS_PER_RIDER_METHOD_3);

  return ridersForDayShifts + ridersForNightOnly;
};

/**
 * Calculate maximum riders that can be scheduled
 */
export const calculateMaxRidersRamadan = (shiftData) => {
  const totalNightCapacity = getNightSlots().reduce((sum, key) => sum + (shiftData[key]?.max || 0), 0);
  const totalDayCapacity = getDaySlots().reduce((sum, key) => sum + (shiftData[key]?.max || 0), 0);

  // Maximum day riders is limited by day capacity (each day rider takes 1 day slot)
  const maxDayRiders = totalDayCapacity;

  // Night capacity consumed by max day riders (2 night shifts each)
  const nightCapacityForDayRiders = maxDayRiders * 2;

  // Remaining night capacity for night-only riders (5 shifts each)
  const remainingNightCapacity = totalNightCapacity - nightCapacityForDayRiders;
  const maxNightOnlyRiders = Math.floor(Math.max(0, remainingNightCapacity) / SHIFTS_PER_RIDER_METHOD_3);

  return maxDayRiders + maxNightOnlyRiders;
};

/**
 * Validate rider count against available capacity
 */
export const validateRiderCapacityRamadan = (riders, shiftData) => {
  const issues = [];

  const totalNightTarget = getNightSlots().reduce((sum, key) => sum + (shiftData[key]?.target || 0), 0);
  const totalDayTarget = getDaySlots().reduce((sum, key) => sum + (shiftData[key]?.target || 0), 0);
  const totalNightMax = getNightSlots().reduce((sum, key) => sum + (shiftData[key]?.max || 0), 0);
  const totalDayMax = getDaySlots().reduce((sum, key) => sum + (shiftData[key]?.max || 0), 0);

  const minRequiredRiders = calculateMinRidersRamadan(shiftData);
  const maxAllowedRiders = calculateMaxRidersRamadan(shiftData);

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
        totalDayTarget,
        totalNightTarget
      },
      explanation: `You have ${riders} riders, but need at least ${minRequiredRiders} to meet all shift targets`,
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
        totalDayMax,
        totalNightMax
      },
      explanation: `Maximum capacity allows for ${maxAllowedRiders} riders`,
      suggestion: `Reduce riders to ${maxAllowedRiders} or increase maximum capacity`
    });
  }

  return issues;
};

/**
 * Validate scheduling feasibility for Ramadan patterns
 * Checks if the shift distribution allows for valid 10-hour combinations
 */
export const validateSchedulingFeasibilityRamadan = (shiftData, numRiders) => {
  const issues = [];

  const nightSlots = getNightSlots();
  const daySlots = getDaySlots();

  const totalNightTarget = nightSlots.reduce((sum, key) => sum + (shiftData[key]?.target || 0), 0);
  const totalDayTarget = daySlots.reduce((sum, key) => sum + (shiftData[key]?.target || 0), 0);

  // Early morning night slots (for Method 1)
  const earlyNightTarget = (shiftData['slot1']?.target || 0) + (shiftData['slot2']?.target || 0);

  // Evening night slots (for Method 2)
  const eveningNightTarget = (shiftData['slot5']?.target || 0) + (shiftData['slot6']?.target || 0) +
                             (shiftData['slot7']?.target || 0) + (shiftData['slot8']?.target || 0);

  // Check if day shifts can be paired with enough night shifts
  if (totalDayTarget > 0) {
    const nightSlotsNeededForDayRiders = totalDayTarget * 2;

    if (nightSlotsNeededForDayRiders > totalNightTarget) {
      issues.push({
        type: 'insufficient_night_for_day',
        severity: 'warning',
        message: 'Day shifts may not have enough night shifts to pair with',
        explanation: `Each day-shift rider needs 2 night shifts. You have ${totalDayTarget} day shift targets but only ${totalNightTarget} night shift targets.`,
        suggestion: 'Increase night shift targets or reduce day shift targets'
      });
    }

    // Check if early or evening night slots have enough capacity for day riders
    const dayTarget1 = shiftData['slot3']?.target || 0;
    const dayTarget2 = shiftData['slot4']?.target || 0;

    // Method 1 pairs day with early night (slot1 + slot2)
    // Method 2 pairs day with evening night (slot5-slot8)
    if (dayTarget1 > 0 && earlyNightTarget < dayTarget1 * 2 && eveningNightTarget < dayTarget1 * 2) {
      issues.push({
        type: 'method_constraint',
        severity: 'info',
        message: 'Daytime 1 shift may use both early and evening night shifts',
        explanation: 'The scheduler will balance between Method 1 (early night) and Method 2 (evening night) patterns.'
      });
    }
  }

  // Check overall balance
  const targetedRatio = totalDayTarget / (totalDayTarget + totalNightTarget / 5);
  if (targetedRatio > 0.15) {
    issues.push({
      type: 'high_day_ratio',
      severity: 'info',
      message: `Day shifts represent ${(targetedRatio * 100).toFixed(0)}% of rider allocation`,
      explanation: 'The recommended distribution is ~10% day shifts and ~90% night-only shifts for Ramadan.',
      suggestion: 'Consider reducing day shift targets to better match Ramadan demand patterns'
    });
  }

  return issues;
};

/**
 * Detect stranded capacity that cannot be utilized
 */
export const detectStrandedCapacityRamadan = (shiftData) => {
  const warnings = [];

  const nightSlots = getNightSlots();
  const daySlots = getDaySlots();

  const totalNightMax = nightSlots.reduce((sum, key) => sum + (shiftData[key]?.max || 0), 0);
  const totalDayMax = daySlots.reduce((sum, key) => sum + (shiftData[key]?.max || 0), 0);

  // Check if day capacity is much higher than what can be utilized
  // Day riders need 2 night shifts each
  const maxDayRidersFromNight = Math.floor(totalNightMax / 2);

  if (totalDayMax > maxDayRidersFromNight) {
    const strandedDayCapacity = totalDayMax - maxDayRidersFromNight;
    warnings.push({
      type: 'stranded_day_capacity',
      severity: 'warning',
      message: `Day shift capacity exceeds what night shifts can support`,
      details: {
        dayCapacity: totalDayMax,
        usableDayCapacity: maxDayRidersFromNight,
        strandedCapacity: strandedDayCapacity
      },
      explanation: `Each day rider needs 2 night shifts. With ${totalNightMax} night capacity, only ${maxDayRidersFromNight} day shifts can be filled.`,
      suggestion: 'Increase night shift capacity or reduce day shift capacity'
    });
  }

  return warnings;
};

// Export constants
export const SHIFTS_PER_RIDER_METHOD_1_2_RAMADAN = SHIFTS_PER_RIDER_METHOD_1_2;
export const SHIFTS_PER_RIDER_METHOD_3_RAMADAN = SHIFTS_PER_RIDER_METHOD_3;
