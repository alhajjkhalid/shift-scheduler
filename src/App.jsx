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
      
      setSuccess(message);
    } else {
      setError(result.error);
    }
  };

  const createSchedule = (numRiders, shiftData) => {
    const riderSchedule = Array(numRiders).fill(null).map((_, i) => ({
      riderId: i + 1,
      shifts: [],
      isExtra: false
    }));

    const totalTargetShifts = Object.values(shiftData).reduce((sum, s) => sum + s.target, 0);
    const minRidersForTarget = totalTargetShifts / SHIFTS_PER_RIDER;

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
    
    const backtrackTarget = (riderIndex) => {
      if (riderIndex >= minRidersForTarget) {
        const totalRemaining = Object.values(targetRemaining).reduce((a, b) => a + b, 0);
        return totalRemaining === 0;
      }

      const rider = riderSchedule[riderIndex];

      for (const [slot1, slot2] of consecutivePairs) {
        if (targetRemaining[slot1] > 0 && targetRemaining[slot2] > 0) {
          rider.shifts = [slot1, slot2];
          targetRemaining[slot1]--;
          targetRemaining[slot2]--;
          
          if (backtrackTarget(riderIndex + 1)) {
            return true;
          }
          
          rider.shifts = [];
          targetRemaining[slot1]++;
          targetRemaining[slot2]++;
        }
      }
      
      for (const [slot1, slot2] of nonConsecutivePairs) {
        if (targetRemaining[slot1] > 0 && targetRemaining[slot2] > 0) {
          rider.shifts = [slot1, slot2];
          targetRemaining[slot1]--;
          targetRemaining[slot2]--;
          
          if (backtrackTarget(riderIndex + 1)) {
            return true;
          }
          
          rider.shifts = [];
          targetRemaining[slot1]++;
          targetRemaining[slot2]++;
        }
      }
      
      return false;
    };

    if (!backtrackTarget(0)) {
      return {
        success: false,
        error: 'Could not generate valid schedule. Please adjust shift requirements.'
      };
    }

    const maxRemaining = {};
    Object.keys(shiftData).forEach(key => {
      maxRemaining[key] = shiftData[key].max - shiftData[key].target;
    });

    const allPairs = [...consecutivePairs, ...nonConsecutivePairs];
    
    const getValidPartners = (slot) => {
      const partners = new Set();
      for (const [s1, s2] of allPairs) {
        if (s1 === slot) partners.add(s2);
        if (s2 === slot) partners.add(s1);
      }
      return Array.from(partners);
    };
    
    let riderIndex = Math.ceil(minRidersForTarget);
    const extraRidersNeeded = numRiders - riderIndex;
    
    for (let i = 0; i < extraRidersNeeded; i++) {
      let bestPair = null;
      let bestScore = -Infinity;
      
      for (const [s1, s2] of allPairs) {
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
          
          const isConsec = consecutivePairs.some(([p1, p2]) => 
            (s1 === p1 && s2 === p2) || (s1 === p2 && s2 === p1)
          );
          
          const minRemaining = Math.min(maxRemaining[s1], maxRemaining[s2]);
          
          let score = 0;
          score -= potentialWaste * 100;
          score += (30 / (minRemaining + 1));
          
          const balance = 1 - Math.abs(maxRemaining[s1] - maxRemaining[s2]) / (maxRemaining[s1] + maxRemaining[s2] + 1);
          score += balance * 15;
          
          if (isConsec) {
            score += 10;
          }
          
          if (score > bestScore) {
            bestScore = score;
            bestPair = [s1, s2];
          }
        }
      }
      
      if (bestPair) {
        const [s1, s2] = bestPair;
        riderSchedule[riderIndex].shifts = [s1, s2];
        riderSchedule[riderIndex].isExtra = true;
        maxRemaining[s1]--;
        maxRemaining[s2]--;
        riderIndex++;
      } else {
        break;
      }
    }

    const finalSchedule = riderSchedule.filter(r => r.shifts.length === SHIFTS_PER_RIDER);
    
    const consecutivePairsCount = finalSchedule.filter(rider => 
      isConsecutive(rider.shifts[0], rider.shifts[1])
    ).length;
    
    const extraRidersAssigned = finalSchedule.filter(r => r.isExtra).length;

    return {
      success: true,
      schedule: finalSchedule,
      consecutivePairs: consecutivePairsCount,
      extraRiders: extraRidersAssigned
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
      
      const utilization = max > 0 ? (count / max) * 100 : 0;
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
                        <span className="text-gray-600">Capacity Utilization</span>
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