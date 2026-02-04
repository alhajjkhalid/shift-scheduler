/**
 * ============================================================================
 * SHIFT SCHEDULER - Ramadan 8 Shifts Version
 * ============================================================================
 *
 * Developer: Khalid Ahmad Alhajj
 * Version: 1.0.0 (Ramadan 8 Shifts Implementation)
 * Last Updated: February 2026
 *
 * Ramadan scheduling component with 8 shifts (2 day + 6 night)
 * Each rider works 10 hours/day using one of three methods:
 * - Method 1: Day shift (6h) + 2 early night shifts (2h + 2h)
 * - Method 2: Day shift (6h) + 2 evening night shifts (2h + 2h)
 * - Method 3: 5 night shifts (2h each) - Primary method (90%)
 *
 * ============================================================================
 */

import React, { useState, useMemo } from 'react';
import { AlertCircle, CheckCircle, Calendar, Users, TrendingUp, Download, Clock, Target, Zap, BarChart3, AlertTriangle, Info, HelpCircle, XCircle, Loader2, Moon, Sun } from 'lucide-react';

// Import utilities for Ramadan mode
import {
  createScheduleRamadan,
  getPatternMethod,
  hasConsecutiveNightShifts,
  getTotalHours,
  VALID_COMBINATIONS
} from './utils/schedulerRamadan';
import {
  timeSlotsRamadan,
  getSlotLabelRamadan,
  getNightSlots,
  getDaySlots,
  isDaySlot,
  validateInputCompletenessRamadan,
  validateMaxCapacityRamadan,
  validateRiderCapacityRamadan,
  validateSchedulingFeasibilityRamadan,
  detectStrandedCapacityRamadan,
  calculateMinRidersRamadan,
  calculateMaxRidersRamadan
} from './utils/validationRamadan';

// ============================================================================
// CONSTANTS
// ============================================================================
const MAX_RIDERS_LIMIT = 10000;
const MAX_INPUT_VALUE = 10000;

export default function ShiftSchedulerRamadan() {
  const [totalRiders, setTotalRiders] = useState('');
  const [shifts, setShifts] = useState({
    slot1: { target: '', max: '' },
    slot2: { target: '', max: '' },
    slot3: { target: '', max: '' },
    slot4: { target: '', max: '' },
    slot5: { target: '', max: '' },
    slot6: { target: '', max: '' },
    slot7: { target: '', max: '' },
    slot8: { target: '', max: '' },
  });
  const [schedule, setSchedule] = useState(null);
  const [error, setError] = useState('');
  const [validationDetails, setValidationDetails] = useState(null);
  const [success, setSuccess] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [statistics, setStatistics] = useState(null);

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

  const shiftData = useMemo(() => {
    const data = {};
    for (const key of Object.keys(shifts)) {
      const target = parseInt(shifts[key].target) || 0;
      const max = parseMaxValue(shifts[key].max, target);
      data[key] = { target, max };
    }
    return data;
  }, [shifts]);

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
    calculateMinRidersRamadan(shiftData),
    [shiftData]
  );

  const maxAllowedRiders = useMemo(() =>
    calculateMaxRidersRamadan(shiftData),
    [shiftData]
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
    setStatistics(null);
    setValidationDetails(null);
    setIsGenerating(true);

    setTimeout(() => {
      try {
        const riders = parseInt(totalRiders);

        // ============================================================================
        // PHASE 1: COMPREHENSIVE VALIDATION WITH DETAILED DIAGNOSTICS
        // ============================================================================

        const validationResults = {
          errors: [],
          warnings: [],
          info: []
        };

        const completenessIssues = validateInputCompletenessRamadan(riders, shiftData);
        validationResults.errors.push(...completenessIssues);

        if (completenessIssues.length > 0) {
          setError('Incomplete input - please fill in all required fields');
          setValidationDetails(validationResults);
          setIsGenerating(false);
          return;
        }

        const maxCapacityIssues = validateMaxCapacityRamadan(shiftData);
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

        const riderCapacityIssues = validateRiderCapacityRamadan(riders, shiftData);
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

        const feasibilityIssues = validateSchedulingFeasibilityRamadan(shiftData, riders);
        feasibilityIssues.forEach(issue => {
          if (issue.severity === 'warning') {
            validationResults.warnings.push(issue);
          } else {
            validationResults.info.push(issue);
          }
        });

        const strandedWarnings = detectStrandedCapacityRamadan(shiftData);
        validationResults.warnings.push(...strandedWarnings);

        // Add configuration summary
        const totalDayTarget = getDaySlots().reduce((sum, key) => sum + (shiftData[key]?.target || 0), 0);
        const totalNightTarget = getNightSlots().reduce((sum, key) => sum + (shiftData[key]?.target || 0), 0);

        validationResults.info.push({
          type: 'configuration_summary',
          message: 'Configuration Summary',
          details: {
            totalRiders: riders,
            totalDayTarget,
            totalNightTarget,
            minRidersNeeded: minRequiredRiders,
            maxRidersPossible: maxAllowedRiders,
            targetDistribution: `${totalDayTarget} day / ${totalNightTarget} night shifts`
          }
        });

        // ============================================================================
        // PHASE 2: RUN SCHEDULING ALGORITHM
        // ============================================================================

        const result = createScheduleRamadan(riders, shiftData);

        if (result.success) {
          setSchedule(result.schedule);
          setStatistics(result.statistics);

          const stats = result.statistics;
          let message = `Successfully scheduled ${stats.totalScheduled} riders! `;
          message += `Distribution: ${stats.nightPercentage}% Night-only (${stats.method3Count}) / `;
          message += `${stats.dayPercentage}% Day+Night (${stats.dayRiders}).`;

          if (stats.totalScheduled < riders) {
            message = `Partially scheduled: ${stats.totalScheduled} of ${riders} riders. `;
            validationResults.warnings.push({
              type: 'partial_scheduling',
              severity: 'warning',
              message: `Only ${stats.totalScheduled} of ${riders} riders were scheduled`,
              details: {
                requested: riders,
                scheduled: stats.totalScheduled,
                unscheduled: riders - stats.totalScheduled
              },
              explanation: 'Maximum capacity constraints prevented scheduling all riders'
            });
          }

          if (stats.extraRiders > 0) {
            message += ` ${stats.extraRiders} extra rider(s) scheduled beyond targets.`;
          }

          setSuccess(message);
          if (validationResults.warnings.length > 0 || validationResults.info.length > 0) {
            setValidationDetails(validationResults);
          }
        } else {
          setError(result.error || 'Failed to generate schedule');
          validationResults.errors.push({
            type: 'algorithm_error',
            severity: 'error',
            message: result.error || 'Unknown error',
            suggestion: 'Please check your inputs and try again.'
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
      const headers = ['Rider ID', 'Method', 'Shifts', 'Shift Times', 'Total Hours', 'Consecutive', 'Type'];
      const rows = schedule.map(rider => {
        const shiftLabels = rider.shifts.map(s => {
          const slot = timeSlotsRamadan.find(sl => sl.key === s);
          return slot?.label || s;
        }).join(' + ');

        const shiftTimes = rider.shifts.map(s => {
          const slot = timeSlotsRamadan.find(sl => sl.key === s);
          return slot?.time || '';
        }).join(', ');

        return [
          `Rider ${rider.riderId}`,
          rider.methodName,
          shiftLabels,
          shiftTimes,
          getTotalHours(rider.shifts),
          hasConsecutiveNightShifts(rider.shifts) ? 'Yes' : 'No',
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
      a.download = `ramadan-schedule-${new Date().toISOString().split('T')[0]}.csv`;
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

    const metrics = timeSlotsRamadan.map(slot => {
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

    return { shifts: metrics };
  };

  const metrics = getShiftMetrics();

  // Group slots by type for display
  const nightSlots = timeSlotsRamadan.filter(s => s.type === 'night');
  const daySlots = timeSlotsRamadan.filter(s => s.type === 'day');

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ backgroundColor: '#4f46e520' }}>
            <Moon className="w-5 h-5" style={{ color: '#6366f1' }} />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Configuration (Ramadan - 8 Shifts)</h2>
        </div>

        {/* Info Box */}
        <div className="mb-6 p-4 rounded-xl border-2" style={{
          backgroundColor: '#f5f3ff',
          borderColor: '#a5b4fc'
        }}>
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-gray-700">
              <p className="font-semibold text-indigo-900 mb-1">Ramadan Scheduling (10 hours/rider)</p>
              <ul className="space-y-1 text-xs">
                <li><span className="font-medium">Method 1:</span> 1 Day shift (6h) + 2 Early night shifts (4h)</li>
                <li><span className="font-medium">Method 2:</span> 1 Day shift (6h) + 2 Evening night shifts (4h)</li>
                <li><span className="font-medium">Method 3:</span> 5 Night shifts (10h) - <span className="text-indigo-600 font-semibold">Primary (~90%)</span></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Day Shifts Section */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg" style={{ backgroundColor: '#fef3c7' }}>
                <Sun className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Day Shifts (6 hours each)</h3>
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">~10% of riders</span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {daySlots.map((slot) => (
                <div key={slot.id} className="bg-amber-50 p-5 rounded-xl border-2 border-amber-200 hover:border-amber-300 transition-all">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl" role="img" aria-label={`${slot.label} icon`}>{slot.icon}</span>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{slot.label}</h4>
                      <p className="text-sm text-gray-600">{slot.time} ({slot.duration}h)</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor={`${slot.key}-target-ramadan`} className="block text-xs font-medium text-gray-700 mb-2">
                        Target Riders <span className="text-red-500">*</span>
                      </label>
                      <input
                        id={`${slot.key}-target-ramadan`}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={shifts[slot.key].target}
                        onChange={(e) => handleShiftChange(slot.key, 'target', e.target.value)}
                        className="w-full px-3 py-2 border-2 rounded-lg focus:ring-2 transition-all"
                        style={{ borderColor: '#fbbf24' }}
                        placeholder="Required"
                        disabled={isGenerating}
                        aria-label={`Target riders for ${slot.label}`}
                        aria-required="true"
                        onFocus={(e) => {
                          e.target.style.borderColor = '#f59e0b';
                          e.target.style.boxShadow = '0 0 0 3px rgba(245, 158, 11, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#fbbf24';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                    </div>
                    <div>
                      <label htmlFor={`${slot.key}-max-ramadan`} className="block text-xs font-medium text-gray-700 mb-2">
                        Maximum Capacity
                      </label>
                      <input
                        id={`${slot.key}-max-ramadan`}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={shifts[slot.key].max}
                        onChange={(e) => handleShiftChange(slot.key, 'max', e.target.value)}
                        className="w-full px-3 py-2 border-2 rounded-lg focus:ring-2 transition-all"
                        style={{ borderColor: '#d97706' }}
                        placeholder="Extra capacity"
                        disabled={isGenerating}
                        aria-label={`Maximum capacity for ${slot.label}`}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#fbbf24';
                          e.target.style.boxShadow = '0 0 0 3px rgba(251, 191, 36, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#d97706';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Night Shifts Section */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg" style={{ backgroundColor: '#e0e7ff' }}>
                <Moon className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Night Shifts (2 hours each)</h3>
              <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">~90% of riders</span>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {nightSlots.map((slot) => (
                <div key={slot.id} className="bg-indigo-50 p-5 rounded-xl border-2 border-indigo-200 hover:border-indigo-300 transition-all">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl" role="img" aria-label={`${slot.label} icon`}>{slot.icon}</span>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{slot.label}</h4>
                      <p className="text-sm text-gray-600">{slot.time} ({slot.duration}h)</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor={`${slot.key}-target-ramadan`} className="block text-xs font-medium text-gray-700 mb-2">
                        Target <span className="text-red-500">*</span>
                      </label>
                      <input
                        id={`${slot.key}-target-ramadan`}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={shifts[slot.key].target}
                        onChange={(e) => handleShiftChange(slot.key, 'target', e.target.value)}
                        className="w-full px-3 py-2 border-2 rounded-lg focus:ring-2 transition-all"
                        style={{ borderColor: '#818cf8' }}
                        placeholder="Required"
                        disabled={isGenerating}
                        aria-label={`Target riders for ${slot.label}`}
                        aria-required="true"
                        onFocus={(e) => {
                          e.target.style.borderColor = '#6366f1';
                          e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#818cf8';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                    </div>
                    <div>
                      <label htmlFor={`${slot.key}-max-ramadan`} className="block text-xs font-medium text-gray-700 mb-2">
                        Max
                      </label>
                      <input
                        id={`${slot.key}-max-ramadan`}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={shifts[slot.key].max}
                        onChange={(e) => handleShiftChange(slot.key, 'max', e.target.value)}
                        className="w-full px-3 py-2 border-2 rounded-lg focus:ring-2 transition-all"
                        style={{ borderColor: '#6366f1' }}
                        placeholder="Extra"
                        disabled={isGenerating}
                        aria-label={`Maximum capacity for ${slot.label}`}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#818cf8';
                          e.target.style.boxShadow = '0 0 0 3px rgba(129, 140, 248, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#6366f1';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total Riders Input */}
          <div className="p-6 rounded-xl border-2" style={{
            background: 'linear-gradient(135deg, #e0e7ff 0%, #f5f3ff 100%)',
            borderColor: '#818cf8'
          }}>
            <label htmlFor="totalRidersRamadan" className="block text-sm font-semibold text-gray-900 mb-2">
              Total Number of Riders
            </label>
            <input
              id="totalRidersRamadan"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={totalRiders}
              onChange={(e) => handleTotalRidersChange(e.target.value)}
              className="w-full px-4 py-3 text-lg border-2 rounded-lg focus:ring-2 transition-all"
              style={{
                borderColor: '#818cf8',
                outlineColor: '#6366f1'
              }}
              placeholder="e.g., 100"
              disabled={isGenerating}
              aria-label="Total number of riders to schedule"
              aria-required="true"
              onFocus={(e) => e.target.style.borderColor = '#6366f1'}
              onBlur={(e) => e.target.style.borderColor = '#818cf8'}
            />
            <div className="mt-3 flex flex-wrap items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-600" />
                <span className="text-gray-600">Minimum Required:</span>
                <span className="font-bold text-gray-900">{minRequiredRiders || 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-indigo-600" />
                <span className="text-gray-600">Maximum Capacity:</span>
                <span className="font-bold text-gray-900">{maxAllowedRiders || 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span className="text-gray-600">Hours per Rider:</span>
                <span className="font-bold text-gray-900">10</span>
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={generateSchedule}
            disabled={isGenerating}
            className="w-full text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: isGenerating ? '#9ca3af' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            }}
            aria-label="Generate Ramadan schedule"
            aria-busy={isGenerating}
            onMouseEnter={(e) => !isGenerating && (e.target.style.background = 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)')}
            onMouseLeave={(e) => !isGenerating && (e.target.style.background = 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)')}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating Ramadan Schedule...
              </>
            ) : (
              <>
                <Moon className="w-5 h-5" />
                Generate Ramadan Schedule
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
                            <div className="mt-3 p-3 rounded bg-indigo-50 border-l-3 border-indigo-400">
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
              <div className="bg-indigo-50 border-l-4 border-indigo-500 p-6 rounded-lg" role="status">
                <div className="flex items-start gap-3">
                  <Info className="w-6 h-6 text-indigo-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-bold text-indigo-900 text-lg mb-3">Configuration Analysis</h4>
                    {validationDetails.info.map((info, idx) => (
                      <div key={idx}>
                        {info.details && (
                          <div className="bg-white p-4 rounded-lg border border-indigo-200">
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
            backgroundColor: '#e0e7ff',
            borderColor: '#6366f1'
          }} role="alert">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#6366f1' }} />
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Success</h4>
                <p className="text-gray-700 text-sm">{success}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Section */}
      {schedule && statistics && metrics && (
        <>
          {/* Method Distribution Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-indigo-100">
                  <Users className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="text-sm font-medium text-gray-600">Total Riders</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900">{statistics.totalScheduled}</p>
              <p className="text-xs text-gray-500 mt-1">10 hours each</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-purple-100">
                  <Moon className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="text-sm font-medium text-gray-600">Night-Only (M3)</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900">{statistics.method3Count}</p>
              <p className="text-xs text-gray-500 mt-1">{statistics.nightPercentage}% - 5 night shifts</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-amber-100">
                  <Sun className="w-5 h-5 text-amber-600" />
                </div>
                <h3 className="text-sm font-medium text-gray-600">Day+Night (M1+M2)</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900">{statistics.dayRiders}</p>
              <p className="text-xs text-gray-500 mt-1">
                {statistics.dayPercentage}% - {statistics.method1Count} early + {statistics.method2Count} evening
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-green-100">
                  <Zap className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="text-sm font-medium text-gray-600">Consecutive Shifts</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900">{statistics.consecutiveCount}</p>
              <p className="text-xs text-gray-500 mt-1">
                {statistics.totalScheduled > 0 ? ((statistics.consecutiveCount / statistics.totalScheduled) * 100).toFixed(0) : 0}% have consecutive
              </p>
            </div>
          </div>

          {/* Shift Capacity Analysis */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-100">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Capacity Analysis by Shift</h2>
              </div>
            </div>

            {/* Day Shifts */}
            <h3 className="text-md font-semibold text-amber-700 mb-3 flex items-center gap-2">
              <Sun className="w-4 h-4" /> Day Shifts
            </h3>
            <div className="grid gap-4 md:grid-cols-2 mb-6">
              {metrics.shifts.filter(s => s.type === 'day').map((shift) => (
                <div key={shift.key} className="bg-amber-50 rounded-xl p-5 border border-amber-200">
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
                          backgroundColor: shift.status === 'full' ? '#fbbf24' : shift.status === 'good' ? '#22c55e' : '#f59e0b'
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center">
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
                    <div className="p-2 bg-white rounded">
                      <div className="text-xs text-gray-600">Available</div>
                      <div className="font-bold" style={{ color: shift.available > 0 ? '#22c55e' : '#9ca3af' }}>
                        {shift.available}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Night Shifts */}
            <h3 className="text-md font-semibold text-indigo-700 mb-3 flex items-center gap-2">
              <Moon className="w-4 h-4" /> Night Shifts
            </h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {metrics.shifts.filter(s => s.type === 'night').map((shift) => (
                <div key={shift.key} className="bg-indigo-50 rounded-xl p-5 border border-indigo-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-2xl">{shift.icon}</span>
                      <div>
                        <h3 className="font-semibold text-gray-900">{shift.label}</h3>
                        <p className="text-sm text-gray-600">{shift.time}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-gray-900">{shift.count}</div>
                      <div className="text-xs text-gray-500">riders</div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-semibold text-gray-900">{shift.utilization.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all duration-500"
                        style={{
                          width: `${Math.min(shift.utilization, 100)}%`,
                          backgroundColor: shift.status === 'full' ? '#818cf8' : shift.status === 'good' ? '#22c55e' : '#f59e0b'
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="p-1.5 bg-white rounded">
                      <div className="text-gray-600">Tgt</div>
                      <div className="font-bold text-gray-900">{shift.target}</div>
                    </div>
                    <div className="p-1.5 bg-white rounded">
                      <div className="text-gray-600">Got</div>
                      <div className="font-bold text-gray-900">{shift.count}</div>
                    </div>
                    <div className="p-1.5 bg-white rounded">
                      <div className="text-gray-600">Max</div>
                      <div className="font-bold text-gray-900">{shift.max}</div>
                    </div>
                    <div className="p-1.5 bg-white rounded">
                      <div className="text-gray-600">Left</div>
                      <div className="font-bold" style={{ color: shift.available > 0 ? '#22c55e' : '#9ca3af' }}>
                        {shift.available}
                      </div>
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
                <div className="p-2 rounded-lg bg-indigo-100">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Detailed Schedule</h2>
              </div>
              <button
                onClick={downloadCSV}
                className="inline-flex items-center gap-2 text-white font-semibold py-2 px-4 rounded-lg transition-all shadow-sm hover:shadow-md"
                style={{ backgroundColor: '#6366f1' }}
                aria-label="Export schedule as CSV"
                onMouseEnter={(e) => e.target.style.backgroundColor = '#4f46e5'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#6366f1'}
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full" role="table" aria-label="Ramadan shift schedule">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Rider</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Method</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Shifts</th>
                    <th scope="col" className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Hours</th>
                    <th scope="col" className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {schedule.map((rider, idx) => {
                    const hours = getTotalHours(rider.shifts);
                    const methodColors = {
                      1: { bg: '#fef3c7', text: '#92400e' },
                      2: { bg: '#fed7aa', text: '#9a3412' },
                      3: { bg: '#e0e7ff', text: '#3730a3' }
                    };
                    const colors = methodColors[rider.method] || methodColors[3];

                    return (
                      <tr key={rider.riderId} className={`hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-indigo-100">
                              <span className="text-xs font-semibold text-indigo-700">
                                {rider.riderId}
                              </span>
                            </div>
                            <span className="font-medium text-gray-900">Rider {rider.riderId}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
                            style={{ backgroundColor: colors.bg, color: colors.text }}
                          >
                            M{rider.method}: {rider.methodName}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-1">
                            {rider.shifts.map((shiftKey, sIdx) => {
                              const slot = timeSlotsRamadan.find(s => s.key === shiftKey);
                              return (
                                <span
                                  key={sIdx}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
                                  style={{
                                    backgroundColor: slot?.type === 'day' ? '#fef3c7' : '#e0e7ff',
                                    color: slot?.type === 'day' ? '#92400e' : '#3730a3'
                                  }}
                                >
                                  {slot?.icon} {slot?.label}
                                </span>
                              );
                            })}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="font-bold text-gray-900">{hours}h</span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span
                            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: rider.isExtra ? '#dcfce7' : '#e0e7ff',
                              color: rider.isExtra ? '#166534' : '#3730a3'
                            }}
                          >
                            {rider.isExtra ? 'Extra' : 'Required'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-4 text-sm text-gray-600 text-center">
              Showing {schedule.length} rider{schedule.length !== 1 ? 's' : ''} · {schedule.length * 10} total hours scheduled
            </div>
          </div>
        </>
      )}
    </div>
  );
}
