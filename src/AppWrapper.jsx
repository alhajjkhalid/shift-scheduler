/**
 * ============================================================================
 * SHIFT SCHEDULER - App Wrapper with Mode Toggle
 * ============================================================================
 *
 * Developer: Khalid Ahmad Alhajj
 * Version: 1.4.0 (Improved scheduling logic and UI)
 * Last Updated: November 2024
 *
 * Wrapper component that allows switching between 5-shift and 6-shift modes
 *
 * ============================================================================
 */

import React, { useState } from 'react';
import { Calendar, Moon } from 'lucide-react';

// Import all scheduler components
import ShiftScheduler5 from './App';
import ShiftScheduler6 from './ShiftScheduler6';
import ShiftSchedulerRamadan from './ShiftSchedulerRamadan';
import FeedbackSection from './FeedbackSection';

export default function AppWrapper() {
  const [mode, setMode] = useState('6shifts'); // '5shifts', '6shifts', or 'ramadan'

  // Mode Toggle Component (shared between all modes)
  const ModeToggle = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Select Your Scheduling Mode</h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* 5 Shifts Card */}
        <button
          onClick={() => setMode('5shifts')}
          className={`relative p-6 rounded-xl border-2 transition-all duration-300 text-left group ${
            mode === '5shifts'
              ? 'border-yellow-400 shadow-lg scale-105'
              : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
          }`}
          style={{
            backgroundColor: mode === '5shifts' ? '#fffbeb' : '#ffffff',
          }}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-2xl transition-all ${
                  mode === '5shifts' ? 'text-gray-900' : 'text-gray-600 group-hover:text-gray-900'
                }`}
                style={{
                  backgroundColor: mode === '5shifts' ? '#ffe300' : '#f3f4f6',
                }}
              >
                5
              </div>
              <div>
                <h4 className="font-bold text-gray-900">5 Shifts Tool</h4>
                <p className="text-xs text-gray-600">Current Standard</p>
              </div>
            </div>
            {mode === '5shifts' && (
              <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>

          <div className="space-y-2 text-sm text-gray-700">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
              <span>2 shifts per rider</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
              <span>8-11 hours total</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
              <span>5 time slots</span>
            </div>
          </div>
        </button>

        {/* 6 Shifts Card */}
        <button
          onClick={() => setMode('6shifts')}
          className={`relative p-6 rounded-xl border-2 transition-all duration-300 text-left group ${
            mode === '6shifts'
              ? 'border-green-400 shadow-lg scale-105'
              : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
          }`}
          style={{
            backgroundColor: mode === '6shifts' ? '#ecfdf5' : '#ffffff',
          }}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-2xl transition-all ${
                  mode === '6shifts' ? 'text-white' : 'text-gray-600 group-hover:text-gray-900'
                }`}
                style={{
                  backgroundColor: mode === '6shifts' ? '#00d097' : '#f3f4f6',
                }}
              >
                6
              </div>
              <div>
                <h4 className="font-bold text-gray-900">6 Shifts Tool</h4>
                <p className="text-xs text-gray-600">New Scheme</p>
              </div>
            </div>
            {mode === '6shifts' && (
              <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>

          <div className="space-y-2 text-sm text-gray-700">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#00d097' }}></span>
              <span>3 shifts per rider</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#00d097' }}></span>
              <span>11-13 hours total</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#00d097' }}></span>
              <span>6 time slots</span>
            </div>
          </div>
        </button>

        {/* Ramadan Card */}
        <button
          onClick={() => setMode('ramadan')}
          className={`relative p-6 rounded-xl border-2 transition-all duration-300 text-left group ${
            mode === 'ramadan'
              ? 'border-indigo-400 shadow-lg scale-105'
              : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
          }`}
          style={{
            backgroundColor: mode === 'ramadan' ? '#eef2ff' : '#ffffff',
          }}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                  mode === 'ramadan' ? 'text-white' : 'text-gray-600 group-hover:text-gray-900'
                }`}
                style={{
                  backgroundColor: mode === 'ramadan' ? '#6366f1' : '#f3f4f6',
                }}
              >
                <Moon className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900">Ramadan</h4>
                <p className="text-xs text-gray-600">8 Shifts Special</p>
              </div>
            </div>
            {mode === 'ramadan' && (
              <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>

          <div className="space-y-2 text-sm text-gray-700">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#6366f1' }}></span>
              <span>10 hours per rider</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#6366f1' }}></span>
              <span>90% night / 10% day</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#6366f1' }}></span>
              <span>8 time slots</span>
            </div>
          </div>
        </button>
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
                  Developed by <span className="font-semibold" style={{ color: '#00d097' }}>Khalid Ahmad Alhajj</span> • v1.4.0
                </p>
              </div>
            </div>
          </div>

          {/* 5-Shift Scheduler Content */}
          <ShiftScheduler5 />

          {/* Feedback Section */}
          <FeedbackSection />
        </div>

        {/* Footer */}
        <div className="mt-8 text-center pb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200">
            <span className="text-sm text-gray-600">Developed by</span>
            <span className="text-sm font-bold" style={{ color: '#00d097' }}>Khalid Ahmad Alhajj</span>
            <span className="text-xs text-gray-400">© 2025 • v1.4.0</span>
          </div>
        </div>
      </div>
    );
  }

  // For Ramadan mode, render the full layout with Ramadan scheduler
  if (mode === 'ramadan') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-slate-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Mode Toggle */}
          <ModeToggle />

          {/* Header */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              <div className="p-3 rounded-xl" style={{ backgroundColor: '#6366f1' }}>
                <Moon className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                  Shift Scheduler - Ramadan Mode
                </h1>
                <p className="text-gray-600 text-sm sm:text-base">
                  Assign 10-hour shifts per rider with 8 time slots (2 day + 6 night) optimized for Ramadan schedules
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Developed by <span className="font-semibold" style={{ color: '#6366f1' }}>Khalid Ahmad Alhajj</span> • v1.5.0
                </p>
              </div>
            </div>
          </div>

          {/* Ramadan Scheduler Content */}
          <ShiftSchedulerRamadan />

          {/* Feedback Section */}
          <FeedbackSection />
        </div>

        {/* Footer */}
        <div className="mt-8 text-center pb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200">
            <span className="text-sm text-gray-600">Developed by</span>
            <span className="text-sm font-bold" style={{ color: '#6366f1' }}>Khalid Ahmad Alhajj</span>
            <span className="text-xs text-gray-400">© 2025 • v1.5.0</span>
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
                Developed by <span className="font-semibold" style={{ color: '#00d097' }}>Khalid Ahmad Alhajj</span> • v1.4.0
              </p>
            </div>
          </div>
        </div>

        {/* 6-Shift Scheduler Content */}
        <ShiftScheduler6 />

        {/* Feedback Section */}
        <FeedbackSection />
      </div>

      {/* Footer */}
      <div className="mt-8 text-center pb-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200">
          <span className="text-sm text-gray-600">Developed by</span>
          <span className="text-sm font-bold" style={{ color: '#00d097' }}>Khalid Ahmad Alhajj</span>
          <span className="text-xs text-gray-400">© 2025 • v1.4.0</span>
        </div>
      </div>
    </div>
  );
}
