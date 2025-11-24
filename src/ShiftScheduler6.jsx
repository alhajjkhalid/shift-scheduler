/**
 * ============================================================================
 * SHIFT SCHEDULER - 6 Shifts Version
 * ============================================================================
 *
 * Developer: Khalid Ahmad Alhajj
 * Version: 1.0.0 (6 Shifts Implementation)
 * Last Updated: November 2024
 *
 * 6-Shift scheduling component where riders work 3 shifts per day (11-13 hours)
 * Based on the new scheme specifications.
 *
 * ============================================================================
 */

import React, { useState, useMemo } from 'react';
import { AlertCircle, CheckCircle, Calendar, Users, TrendingUp, Download, Clock, Target, Zap, BarChart3, AlertTriangle, Info, HelpCircle, XCircle, Loader2 } from 'lucide-react';

// Import utilities for 6-shift mode
import { createSchedule6, isConsecutiveTriplet, hasConsecutivePair, getConsecutiveStatus, SHIFTS_PER_RIDER_6 } from './utils/scheduler6';
import {
  timeSlots6,
  getSlotLabel6,
  validateInputCompleteness6,
  validateMaxCapacity6,
  validateDivisibleShifts6,
  validateRiderCapacity6,
  validatePairingFeasibility6,
  detectStrandedCapacity6
} from './utils/validation6';

// ============================================================================
// CONSTANTS
// ============================================================================
const SHIFTS_PER_RIDER = 3;
const MAX_RIDERS_LIMIT = 10000;
const MAX_INPUT_VALUE = 10000;

export default function ShiftScheduler6() {
  const [totalRiders, setTotalRiders] = useState('');
  const [shifts, setShifts] = useState({
    slot1: { target: '', max: '' },
    slot2: { target: '', max: '' },
    slot3: { target: '', max: '' },
    slot4: { target: '', max: '' },
    slot5: { target: '', max: '' },
    slot6: { target: '', max: '' },
  });
  const [schedule, setSchedule] = useState(null);
  const [error, setError] = useState('');
  const [validationDetails, setValidationDetails] = useState(null);
  const [success, setSuccess] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  const parseMaxValue = (maxInput, target) => {
    const maxParsed = parseInt(maxInput);
    return (maxInput === '' || isNaN(maxParsed)) ? target : maxParsed;
  };

  const isValidNumericInput = (value) => {
    if (value === '') return true;
    if (!/^\d+$/.test(value)) return false;
    if (value.length > 1 && value.startsWith('0')) return false;
    if (parseInt(value) > MAX_INPUT_VALUE) return false;
    return true;
  };

  const escapeCSV = (cell) => {
    const str = String(cell);
    if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return `"${str}"`;
  };

  // ============================================================================
  // MEMOIZED CALCULATIONS
  // ============================================================================

  const totalTargetShifts = useMemo(() =>
    Object.values(shifts).reduce((sum, s) => sum + (parseInt(s.target) || 0), 0),
    [shifts]
  );

  const totalMaxShifts = useMemo(() =>
    Object.values(shifts).reduce((sum, s) => {
      const target = parseInt(s.target) || 0;
      const max = parseMaxValue(s.max, target);
      return sum + max;
    }, 0),
    [shifts]
  );

  const minRequiredRiders = useMemo(() =>
    totalTargetShifts / SHIFTS_PER_RIDER,
    [totalTargetShifts]
  );

  const maxAllowedRiders = useMemo(() =>
    Math.floor(totalMaxShifts / SHIFTS_PER_RIDER),
    [totalMaxShifts]
  );

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleShiftChange = (slotKey, field, value) => {
    if (!isValidNumericInput(value)) {
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
    if (!isValidNumericInput(value)) {
      return;
    }

    setTotalRiders(value);
    setError('');
    setValidationDetails(null);
    setSuccess('');
  };

  const generateSchedule = () => {
    setError('');
    setSuccess('');
    setSchedule(null);
    setValidationDetails(null);
    setIsGenerating(true);

    setTimeout(() => {
      try {
        const riders = parseInt(totalRiders);
        const shiftData = {};

        for (const key of Object.keys(shifts)) {
          const targetInput = shifts[key].target;
          const maxInput = shifts[key].max;

          const target = parseInt(targetInput) || 0;
          const max = parseMaxValue(maxInput, target);

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

        const completenessIssues = validateInputCompleteness6(riders, shiftData);
        validationResults.errors.push(...completenessIssues);

        if (completenessIssues.length > 0) {
          setError('Incomplete input - please fill in all required fields');
          setValidationDetails(validationResults);
          setIsGenerating(false);
          return;
        }

        const maxCapacityIssues = validateMaxCapacity6(shiftData);
        validationResults.errors.push(...maxCapacityIssues);

        if (maxCapacityIssues.length > 0) {
          setError('Invalid maximum capacity values detected');
          setValidationDetails(validationResults);
          setIsGenerating(false);
          return;
        }

        if (riders > MAX_RIDERS_LIMIT) {
          validationResults.errors.push({
            type: 'performance_limit',
            severity: 'error',
            message: `Maximum ${MAX_RIDERS_LIMIT.toLocaleString()} riders allowed for performance reasons`,
            details: { requested: riders, maximum: MAX_RIDERS_LIMIT },
            suggestion: `Please reduce the number of riders to ${MAX_RIDERS_LIMIT.toLocaleString()} or less`
          });
          setError(`Too many riders requested - maximum is ${MAX_RIDERS_LIMIT.toLocaleString()}`);
          setValidationDetails(validationResults);
          setIsGenerating(false);
          return;
        }

        const totalTargetShifts = Object.values(shiftData).reduce((sum, s) => sum + s.target, 0);
        const totalMaxShifts = Object.values(shiftData).reduce((sum, s) => sum + s.max, 0);

        const divisibleShiftsIssue = validateDivisibleShifts6(totalTargetShifts);
        if (divisibleShiftsIssue) {
          validationResults.errors.push(divisibleShiftsIssue);
          setError('Total target shifts must be divisible by 3 (each rider needs 3 shifts)');
          setValidationDetails(validationResults);
          setIsGenerating(false);
          return;
        }

        const riderCapacityIssues = validateRiderCapacity6(riders, totalTargetShifts, totalMaxShifts);

        const riderErrors = riderCapacityIssues.filter(issue => issue.severity === 'error');
        const riderWarnings = riderCapacityIssues.filter(issue => issue.severity === 'warning');

        validationResults.errors.push(...riderErrors);
        validationResults.warnings.push(...riderWarnings);

        if (riderErrors.length > 0) {
          setError('Rider count exceeds maximum capacity');
          setValidationDetails(validationResults);
          setIsGenerating(false);
          return;
        }

        const { issues: pairingIssues, pairingAnalysis } = validatePairingFeasibility6(shiftData, riders);
        // For 6-shift, pairing issues are warnings not errors
        validationResults.warnings.push(...pairingIssues);

        const strandedWarnings = detectStrandedCapacity6(shiftData, riders);
        validationResults.warnings.push(...strandedWarnings);

        validationResults.info.push({
          type: 'configuration_summary',
          message: 'Configuration Summary',
          details: {
            totalRiders: riders,
            totalTargetShifts: totalTargetShifts,
            totalMaxShifts: totalMaxShifts,
            minRidersNeeded: totalTargetShifts / SHIFTS_PER_RIDER,
            maxRidersPossible: Math.floor(totalMaxShifts / SHIFTS_PER_RIDER),
            shiftsPerRider: SHIFTS_PER_RIDER,
            extraCapacity: totalMaxShifts - totalTargetShifts,
            extraCapacityPercent: (((totalMaxShifts - totalTargetShifts) / totalTargetShifts) * 100).toFixed(1) + '%'
          }
        });

        // ============================================================================
        // PHASE 2: RUN SCHEDULING ALGORITHM
        // ============================================================================

        const result = createSchedule6(riders, shiftData);

        if (result.success) {
          setSchedule(result.schedule);
          const actualRiders = result.schedule.length;
          const targetRiders = totalTargetShifts / SHIFTS_PER_RIDER;
          const totalShiftsScheduled = actualRiders * SHIFTS_PER_RIDER;

          let message;

          if (actualRiders < targetRiders) {
            const unmetShifts = totalTargetShifts - totalShiftsScheduled;
            message = `Partial schedule: Scheduled all ${actualRiders} riders (${totalShiftsScheduled} shifts). ${unmetShifts} target shifts remain unfilled.`;
          } else if (actualRiders < riders) {
            message = `Partially scheduled: ${actualRiders} of ${riders} riders. ${riders - actualRiders} rider(s) could not be scheduled due to capacity constraints.`;
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
            message = `Successfully scheduled all ${actualRiders} riders!`;
          }

          message += ` ${result.consecutiveTriplets} rider(s) have consecutive triplet shifts.`;

          if (actualRiders >= targetRiders) {
            message += ' All targets met.';
          } else {
            const unmetShifts = totalTargetShifts - totalShiftsScheduled;
            message += ` ${unmetShifts} target shifts not met (need ${targetRiders - actualRiders} more riders).`;
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
      } catch (err) {
        setError('An unexpected error occurred. Please check your inputs and try again.');
        console.error('Schedule generation error:', err);
      } finally {
        setIsGenerating(false);
      }
    }, 50);
  };

  const downloadCSV = () => {
    if (!schedule) return;

    try {
      const headers = ['Rider ID', 'Shift 1', 'Shift 2', 'Shift 3', 'Shift 1 Time', 'Shift 2 Time', 'Shift 3 Time', 'Consecutive Triplet', 'Type'];
      const rows = schedule.map(rider => {
        const slot1 = timeSlots6.find(s => s.key === rider.shifts[0]);
        const slot2 = timeSlots6.find(s => s.key === rider.shifts[1]);
        const slot3 = timeSlots6.find(s => s.key === rider.shifts[2]);
        return [
          `Rider ${rider.riderId}`,
          slot1?.label || rider.shifts[0],
          slot2?.label || rider.shifts[1],
          slot3?.label || rider.shifts[2],
          slot1?.time || '',
          slot2?.time || '',
          slot3?.time || '',
          isConsecutiveTriplet(rider.shifts[0], rider.shifts[1], rider.shifts[2]) ? 'Yes' : 'No',
          rider.isExtra ? 'Extra' : 'Required'
        ];
      });

      const csvContent = [
        headers.map(escapeCSV).join(','),
        ...rows.map(row => row.map(escapeCSV).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `shift-schedule-6shifts-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setError('Failed to download CSV. Please try again.');
      console.error('CSV download error:', error);
    }
  };

  const getShiftMetrics = () => {
    if (!schedule) return null;

    const metrics = timeSlots6.map(slot => {
      const count = schedule.filter(r => r.shifts.includes(slot.key)).length;
      const target = parseInt(shifts[slot.key].target) || 0;
      const max = parseMaxValue(shifts[slot.key].max, target);

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

    // Count by consecutive status
    let consecutiveCount = 0;
    let partiallyConsecutiveCount = 0;
    let nonConsecutiveCount = 0;

    schedule.forEach(r => {
      const status = getConsecutiveStatus(r.shifts);
      if (status === 'consecutive') {
        consecutiveCount++;
      } else if (status === 'partial') {
        partiallyConsecutiveCount++;
      } else {
        nonConsecutiveCount++;
      }
    });

    const extraRiders = schedule.filter(r => r.isExtra).length;
    const requiredRiders = totalScheduled - extraRiders;

    return {
      shifts: metrics,
      totalScheduled,
      consecutiveCount,
      partiallyConsecutiveCount,
      nonConsecutiveCount,
      extraRiders,
      requiredRiders,
      consecutivePercentage: totalScheduled > 0 ? (consecutiveCount / totalScheduled) * 100 : 0,
      partiallyConsecutivePercentage: totalScheduled > 0 ? (partiallyConsecutiveCount / totalScheduled) * 100 : 0
    };
  };

  const metrics = getShiftMetrics();

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ backgroundColor: '#ffe30020' }}>
            <Users className="w-5 h-5" style={{ color: '#00d097' }} />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Configuration (6 Shifts - 3 per Rider)</h2>
        </div>

        <div className="space-y-6">
          {/* Total Riders Input */}
          <div className="p-6 rounded-xl border-2" style={{
            background: 'linear-gradient(135deg, #ffe30010 0%, #00d09710 100%)',
            borderColor: '#ffe300'
          }}>
            <label htmlFor="totalRiders6" className="block text-sm font-semibold text-gray-900 mb-2">
              Total Number of Riders
            </label>
            <input
              id="totalRiders6"
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
              disabled={isGenerating}
              aria-label="Total number of riders to schedule"
              aria-required="true"
              onFocus={(e) => e.target.style.borderColor = '#00d097'}
              onBlur={(e) => e.target.style.borderColor = '#ffe300'}
            />
            <div className="mt-3 flex flex-wrap items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4" style={{ color: '#00d097' }} />
                <span className="text-gray-600">Minimum Required:</span>
                <span className="font-bold text-gray-900">{minRequiredRiders || 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" style={{ color: '#00d097' }} />
                <span className="text-gray-600">Maximum Capacity:</span>
                <span className="font-bold text-gray-900">{maxAllowedRiders || 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" style={{ color: '#00d097' }} />
                <span className="text-gray-600">Shifts per Rider:</span>
                <span className="font-bold text-gray-900">3</span>
              </div>
            </div>
          </div>

          {/* Shift Requirements */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg" style={{ backgroundColor: '#ffe30020' }}>
                <Clock className="w-5 h-5" style={{ color: '#00d097' }} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Shift Requirements (6 Time Slots)</h3>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {timeSlots6.map((slot) => (
                <div key={slot.id} className="bg-gray-50 p-5 rounded-xl border border-gray-200 hover:border-gray-300 transition-all">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl" role="img" aria-label={`${slot.label} icon`}>{slot.icon}</span>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{slot.label}</h4>
                      <p className="text-sm text-gray-600">{slot.time}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor={`${slot.key}-target-6`} className="block text-xs font-medium text-gray-700 mb-2">
                        Target Riders <span className="text-red-500">*</span>
                      </label>
                      <input
                        id={`${slot.key}-target-6`}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={shifts[slot.key].target}
                        onChange={(e) => handleShiftChange(slot.key, 'target', e.target.value)}
                        className="w-full px-3 py-2 border-2 rounded-lg focus:ring-2 transition-all"
                        style={{ borderColor: '#ffe300' }}
                        placeholder="Required"
                        disabled={isGenerating}
                        aria-label={`Target riders for ${slot.label}`}
                        aria-required="true"
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
                      <label htmlFor={`${slot.key}-max-6`} className="block text-xs font-medium text-gray-700 mb-2">
                        Maximum Capacity
                      </label>
                      <input
                        id={`${slot.key}-max-6`}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={shifts[slot.key].max}
                        onChange={(e) => handleShiftChange(slot.key, 'max', e.target.value)}
                        className="w-full px-3 py-2 border-2 rounded-lg focus:ring-2 transition-all"
                        style={{ borderColor: '#00d097' }}
                        placeholder="Extra capacity"
                        disabled={isGenerating}
                        aria-label={`Maximum capacity for ${slot.label}`}
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
            disabled={isGenerating}
            className="w-full text-gray-900 font-bold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: isGenerating ? '#e0e0e0' : 'linear-gradient(135deg, #ffe300 0%, #ffff00 100%)',
            }}
            aria-label="Generate optimal schedule"
            aria-busy={isGenerating}
            onMouseEnter={(e) => !isGenerating && (e.target.style.background = 'linear-gradient(135deg, #ffff00 0%, #ffe300 100%)')}
            onMouseLeave={(e) => !isGenerating && (e.target.style.background = 'linear-gradient(135deg, #ffe300 0%, #ffff00 100%)')}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating Schedule...
              </>
            ) : (
              <>
                <BarChart3 className="w-5 h-5" />
                Generate Optimal Schedule (6 Shifts)
              </>
            )}
          </button>
        </div>

        {/* Validation Details */}
        {validationDetails && (
          <div className="mt-6 space-y-4">
            {/* Errors */}
            {validationDetails.errors && validationDetails.errors.length > 0 && (
              <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg" role="alert">
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
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h5 className="font-semibold text-red-900 mb-1">{error.message}</h5>
                          {error.explanation && (
                            <p className="text-sm text-gray-700 mt-2">{error.explanation}</p>
                          )}
                          {error.suggestion && (
                            <div className="mt-3 p-3 rounded" style={{ backgroundColor: '#ffe30020', borderLeft: '3px solid #ffe300' }}>
                              <p className="text-sm">
                                <span className="font-semibold text-gray-900">Solution: </span>
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
              <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-lg" role="alert">
                <div className="flex items-start gap-3 mb-4">
                  <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-bold text-amber-900 text-lg mb-2">
                      {validationDetails.warnings.length} Warning{validationDetails.warnings.length > 1 ? 's' : ''}
                    </h4>
                  </div>
                </div>
                <div className="space-y-4">
                  {validationDetails.warnings.map((warning, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-lg border border-amber-200">
                      <div className="flex items-start gap-3">
                        <HelpCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h5 className="font-semibold text-amber-900 mb-1">{warning.message}</h5>
                          {warning.explanation && (
                            <p className="text-sm text-gray-700 mt-2">{warning.explanation}</p>
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
              <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg" role="status">
                <div className="flex items-start gap-3">
                  <Info className="w-6 h-6 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-bold text-blue-900 text-lg mb-3">Configuration Analysis</h4>
                    {validationDetails.info.map((info, idx) => (
                      <div key={idx}>
                        {info.details && (
                          <div className="bg-white p-4 rounded-lg border border-blue-200">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
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
          </div>
        )}

        {/* Error Message */}
        {error && !validationDetails && (
          <div className="mt-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg" role="alert">
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
          }} role="alert">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
                <h3 className="text-sm font-medium text-gray-600">Consecutive</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900">{metrics.consecutiveCount}</p>
              <p className="text-xs text-gray-500 mt-1">
                {metrics.consecutivePercentage.toFixed(0)}% - All 3 shifts consecutive
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg" style={{ backgroundColor: '#3b82f620' }}>
                  <Clock className="w-5 h-5" style={{ color: '#3b82f6' }} />
                </div>
                <h3 className="text-sm font-medium text-gray-600">Partially Consecutive</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900">{metrics.partiallyConsecutiveCount}</p>
              <p className="text-xs text-gray-500 mt-1">
                {metrics.partiallyConsecutivePercentage.toFixed(0)}% - 2 shifts consecutive
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
                {metrics.totalScheduled > 0 ? ((metrics.nonConsecutiveCount / metrics.totalScheduled) * 100).toFixed(0) : 0}% - No consecutive pairs
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg" style={{ backgroundColor: '#ffe30020' }}>
                  <BarChart3 className="w-5 h-5" style={{ color: '#00d097' }} />
                </div>
                <h3 className="text-sm font-medium text-gray-600">Total Shifts</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900">{metrics.totalScheduled * 3}</p>
              <p className="text-xs text-gray-500 mt-1">
                3 shifts per rider
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
            </div>

            <div className="grid gap-4 md:grid-cols-2">
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
                      <div className="text-xs text-gray-500">riders</div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-gray-600">Target Progress</span>
                      <span className="font-semibold text-gray-900">{shift.utilization.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all duration-500"
                        style={{
                          width: `${Math.min(shift.utilization, 100)}%`,
                          backgroundColor: shift.status === 'full' ? '#ffe300' : shift.status === 'good' ? '#00d097' : '#f59e0b'
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 bg-white rounded">
                      <div className="text-xs text-gray-600">Target</div>
                      <div className="font-bold text-gray-900">{shift.target}</div>
                    </div>
                    <div className="p-2 bg-white rounded">
                      <div className="text-xs text-gray-600">Assigned</div>
                      <div className="font-bold text-gray-900">{shift.count}</div>
                    </div>
                    <div className="p-2 bg-white rounded">
                      <div className="text-xs text-gray-600">Max</div>
                      <div className="font-bold text-gray-900">{shift.max}</div>
                    </div>
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
                aria-label="Export schedule as CSV"
                onMouseEnter={(e) => e.target.style.backgroundColor = '#00b885'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#00d097'}
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full" role="table" aria-label="Shift schedule">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Rider</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Shift 1</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Shift 2</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Shift 3</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Type</th>
                    <th scope="col" className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {schedule.map((rider, idx) => {
                    const consecutiveStatus = getConsecutiveStatus(rider.shifts);
                    const slot1 = timeSlots6.find(s => s.key === rider.shifts[0]);
                    const slot2 = timeSlots6.find(s => s.key === rider.shifts[1]);
                    const slot3 = timeSlots6.find(s => s.key === rider.shifts[2]);

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
                              <div className="font-medium text-gray-900 text-sm">{slot1?.label?.split(' (')[0]}</div>
                              <div className="text-xs text-gray-500">{slot1?.time}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{slot2?.icon}</span>
                            <div>
                              <div className="font-medium text-gray-900 text-sm">{slot2?.label?.split(' (')[0]}</div>
                              <div className="text-xs text-gray-500">{slot2?.time}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{slot3?.icon}</span>
                            <div>
                              <div className="font-medium text-gray-900 text-sm">{slot3?.label?.split(' (')[0]}</div>
                              <div className="text-xs text-gray-500">{slot3?.time}</div>
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
                              backgroundColor: consecutiveStatus === 'consecutive' ? '#00d09720' :
                                              consecutiveStatus === 'partial' ? '#3b82f620' : '#fef3c7',
                              color: consecutiveStatus === 'consecutive' ? '#000' :
                                    consecutiveStatus === 'partial' ? '#1d4ed8' : '#92400e'
                            }}
                          >
                            {consecutiveStatus === 'consecutive' ? (
                              <>
                                <CheckCircle className="w-3 h-3" />
                                Consecutive
                              </>
                            ) : consecutiveStatus === 'partial' ? (
                              <>
                                <Clock className="w-3 h-3" />
                                Partial
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
              Showing {schedule.length} rider{schedule.length !== 1 ? 's' : ''} · {schedule.length * 3} total shifts assigned
            </div>
          </div>
        </>
      )}
    </div>
  );
}
