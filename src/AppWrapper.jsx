/**
 * ============================================================================
 * SHIFT SCHEDULER - App Wrapper with Mode Toggle
 * ============================================================================
 *
 * Developer: Khalid Ahmad Alhajj
 * Version: 1.3.0 (Added 6-Shift Mode)
 * Last Updated: November 2024
 *
 * Wrapper component that allows switching between 5-shift and 6-shift modes
 *
 * ============================================================================
 */

import React, { useState } from 'react';
import { Calendar } from 'lucide-react';

// Import both scheduler components
import ShiftScheduler5 from './App';
import ShiftScheduler6 from './ShiftScheduler6';

export default function AppWrapper() {
  const [mode, setMode] = useState('5shifts'); // '5shifts' or '6shifts'

  // Mode Toggle Component (shared between both modes)
  const ModeToggle = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <span className="text-sm font-medium text-gray-700">Select Scheduling Mode:</span>
        <div className="flex rounded-xl overflow-hidden border-2 border-gray-200">
          <button
            onClick={() => setMode('5shifts')}
            className={`px-6 py-3 font-semibold text-sm transition-all duration-200 flex items-center gap-2 ${
              mode === '5shifts'
                ? 'text-gray-900'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
            style={{
              backgroundColor: mode === '5shifts' ? '#ffe300' : undefined,
            }}
          >
            <span className="text-lg font-bold">5</span>
            <span>Shifts Tool</span>
            <span className="text-xs text-gray-500 ml-1">(2 per rider)</span>
          </button>
          <button
            onClick={() => setMode('6shifts')}
            className={`px-6 py-3 font-semibold text-sm transition-all duration-200 flex items-center gap-2 border-l-2 border-gray-200 ${
              mode === '6shifts'
                ? 'text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
            style={{
              backgroundColor: mode === '6shifts' ? '#00d097' : undefined,
            }}
          >
            <span className="text-lg font-bold">6</span>
            <span>Shifts Tool</span>
            <span className={`text-xs ml-1 ${mode === '6shifts' ? 'text-green-100' : 'text-gray-500'}`}>(3 per rider)</span>
          </button>
        </div>
      </div>

      {/* Mode Description */}
      <div className="mt-4 p-4 rounded-lg" style={{
        backgroundColor: mode === '5shifts' ? '#ffe30015' : '#00d09715',
        borderLeft: `4px solid ${mode === '5shifts' ? '#ffe300' : '#00d097'}`
      }}>
        {mode === '5shifts' ? (
          <div className="text-sm text-gray-700">
            <p className="font-semibold mb-1">5 Shifts Mode (Current Standard)</p>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>5 time slots throughout the day</li>
              <li>Each rider is assigned exactly 2 shifts</li>
              <li>Total work time: 8-11 hours per rider</li>
              <li>Optimizes for consecutive shift pairs</li>
            </ul>
          </div>
        ) : (
          <div className="text-sm text-gray-700">
            <p className="font-semibold mb-1">6 Shifts Mode (New Scheme)</p>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>6 time slots: Midnight, Early Morning, Morning, Lunch, Evening, Dinner</li>
              <li>Each rider is assigned exactly 3 shifts</li>
              <li>Total work time: 11-13 hours per rider</li>
              <li>Optimizes for consecutive triplet assignments</li>
              <li>Better supply-demand matching for peak hours</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );

  // For 5-shift mode, render the full layout with 5-shift scheduler
  if (mode === '5shifts') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-yellow-50 to-teal-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Mode Toggle */}
          <ModeToggle />

          {/* Header */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              <div className="p-3 rounded-xl" style={{ backgroundColor: '#ffe300' }}>
                <Calendar className="w-8 h-8 text-gray-900" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                  Shift Scheduler - 5 Shifts Mode
                </h1>
                <p className="text-gray-600 text-sm sm:text-base">
                  Assign 2 shifts per rider (8-11 hours) with optimal capacity utilization and consecutive shift preferences
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Developed by <span className="font-semibold" style={{ color: '#00d097' }}>Khalid Ahmad Alhajj</span> • v1.3.0
                </p>
              </div>
            </div>
          </div>

          {/* 5-Shift Scheduler Content */}
          <ShiftScheduler5 />
        </div>

        {/* Footer */}
        <div className="mt-8 text-center pb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200">
            <span className="text-sm text-gray-600">Developed by</span>
            <span className="text-sm font-bold" style={{ color: '#00d097' }}>Khalid Ahmad Alhajj</span>
            <span className="text-xs text-gray-400">© 2025 • v1.3.0</span>
          </div>
        </div>
      </div>
    );
  }

  // For 6-shift mode, render the full layout with 6-shift scheduler
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-yellow-50 to-teal-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Mode Toggle */}
        <ModeToggle />

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="p-3 rounded-xl" style={{ backgroundColor: '#00d097' }}>
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                Shift Scheduler - 6 Shifts Mode
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">
                Assign 3 shifts per rider (11-13 hours) with optimal consecutive triplet placement
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Developed by <span className="font-semibold" style={{ color: '#00d097' }}>Khalid Ahmad Alhajj</span> • v1.3.0
              </p>
            </div>
          </div>
        </div>

        {/* 6-Shift Scheduler Content */}
        <ShiftScheduler6 />
      </div>

      {/* Footer */}
      <div className="mt-8 text-center pb-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200">
          <span className="text-sm text-gray-600">Developed by</span>
          <span className="text-sm font-bold" style={{ color: '#00d097' }}>Khalid Ahmad Alhajj</span>
          <span className="text-xs text-gray-400">© 2025 • v1.3.0</span>
        </div>
      </div>
    </div>
  );
}
