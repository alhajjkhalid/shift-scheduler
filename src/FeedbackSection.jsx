/**
 * ============================================================================
 * FEEDBACK SECTION - User Feedback QR Code Component
 * ============================================================================
 *
 * Developer: Khalid Ahmad Alhajj
 * Version: 1.0.0
 * Last Updated: December 2024
 *
 * A component that displays a QR code linking to a user feedback survey.
 *
 * ============================================================================
 */

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { MessageCircle, QrCode } from 'lucide-react';

const SURVEY_URL = 'https://wenjuan.meituan.com/m/survey/5555626';

export default function FeedbackSection() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
      <div className="flex flex-col items-center text-center">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg" style={{ backgroundColor: '#ffe30020' }}>
            <MessageCircle className="w-6 h-6" style={{ color: '#00d097' }} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">We Value Your Feedback</h2>
        </div>

        <p className="text-gray-600 mb-6 max-w-2xl">
          Help us improve the Shift Scheduler! Scan the QR code below or click the button to share your thoughts and suggestions.
        </p>

        {/* QR Code */}
        <div className="mb-6 p-6 bg-gray-50 rounded-xl border-2 border-gray-200">
          <div className="bg-white p-4 rounded-lg inline-block shadow-sm">
            <QRCodeSVG
              value={SURVEY_URL}
              size={200}
              level="M"
              includeMargin={true}
              bgColor="#ffffff"
              fgColor="#000000"
            />
          </div>
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-600">
            <QrCode className="w-4 h-4" />
            <span>Scan with your phone camera</span>
          </div>
        </div>

        {/* Button for direct link */}
        <a
          href={SURVEY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg text-white"
          style={{ backgroundColor: '#00d097' }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#00b885'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#00d097'}
        >
          <MessageCircle className="w-5 h-5" />
          Open Feedback Survey
        </a>

        <p className="text-xs text-gray-500 mt-4">
          Your feedback helps us make this tool better for everyone. Thank you!
        </p>
      </div>
    </div>
  );
}
