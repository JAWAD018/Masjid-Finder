import React, { useState } from "react";
import firebase from "../firebase/firebaseService";
import { X, Save, Phone, Send, AlertCircle, Shield, Loader } from "lucide-react";

const SecurePrayerTimesEditor = ({ masjid, onClose, onSave }) => {
  const [step, setStep] = useState('phone'); // 'phone' or 'edit'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [prayerTimes, setPrayerTimes] = useState(masjid.prayerTimes || {
    fajr: '05:30',
    dhuhr: '12:15',
    asr: '15:30',
    maghrib: '18:10',
    isha: '19:25'
  });
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Validate phone number format
  const isValidPhone = (phone) => {
    return phone.match(/^\+?[\d\s-()]{10,15}$/);
  };

  // Handle phone number submission
  const handlePhoneSubmit = async () => {
    setError('');
    
    if (!phoneNumber.trim()) {
      setError('Please enter your phone number');
      return;
    }

    if (!isValidPhone(phoneNumber)) {
      setError('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    
    try {
      // Check spam prevention - limit 3 requests per phone per day
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Mock spam check (in real app, this would be a Firestore query)
      // For now, we'll simulate it
      const recentRequestsCount = 0; // This should query Firestore

      if (recentRequestsCount >= 3) {
        setError('You have reached the daily limit of 3 requests. Please try again tomorrow.');
        return;
      }

      // Store phone number and proceed to editing
      setStep('edit');
    } catch (err) {
      setError('Error validating phone number. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle prayer times update request submission
  const handleRequestSubmit = async () => {
    setError('');

    // Check if any times actually changed
    const hasChanges = Object.keys(prayerTimes).some(
      prayer => prayerTimes[prayer] !== masjid.prayerTimes[prayer]
    );

    if (!hasChanges) {
      setError('Please modify at least one prayer time before submitting');
      return;
    }

    setLoading(true);
    
    try {
      // Create update request in Firestore
      const requestData = {
        masjidId: masjid.id,
        masjidName: masjid.name,
        phoneNumber: phoneNumber.trim(),
        currentTimes: masjid.prayerTimes,
        requestedTimes: prayerTimes,
        reason: reason.trim(),
        status: 'pending',
        createdAt: new Date(),
        requesterInfo: {
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        }
      };

      // Add to updateRequests collection
      await firebase.addDoc('updateRequests', requestData);

      // Track phone request for spam prevention
      await firebase.addDoc('phoneRequests', {
        phoneNumber: phoneNumber.trim(),
        requestTimestamp: new Date()
      });

      // Create notification for admins (optional)
      try {
        await firebase.addDoc('adminNotifications', {
          type: 'new_request',
          title: 'New Prayer Time Update Request',
          message: `${masjid.name} - ${phoneNumber}`,
          data: {
            masjidId: masjid.id,
            masjidName: masjid.name,
            phoneNumber: phoneNumber
          },
          read: false,
          createdAt: new Date()
        });
      } catch (notificationError) {
        console.warn('Could not create admin notification:', notificationError);
      }

      setSuccess(true);
      
      // Auto-close after showing success
      setTimeout(() => {
        onClose();
      }, 3000);

    } catch (err) {
      console.error('Error submitting update request:', err);
      if (err.message && err.message.includes('Maximum 3 requests')) {
        setError('You have reached the daily limit of 3 requests. Please try again tomorrow.');
      } else {
        setError('Failed to submit request. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Get changed prayer times for display
  const getChangedTimes = () => {
    return Object.keys(prayerTimes).filter(
      prayer => prayerTimes[prayer] !== masjid.prayerTimes[prayer]
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">
                {step === 'phone' ? 'Request Prayer Time Update' : 'Update Prayer Times'}
              </h2>
              <p className="text-white text-sm mt-1">{masjid.name}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
              disabled={loading}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {success ? (
            // Success State
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Request Submitted Successfully!</h3>
              <p className="text-gray-600 mb-4">
                Your prayer time update request has been sent to the masjid administrators for review.
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
                <p>You will be contacted at <strong>{phoneNumber}</strong> once your request is processed.</p>
              </div>
            </div>
          ) : step === 'phone' ? (
            // Phone Number Step
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Enter Your Phone Number</h3>
                <p className="text-gray-600 text-sm">
                  We need your phone number to verify your identity and contact you about this request.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <span className="text-red-700 text-sm">{error}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    disabled={loading}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  We only need your number to verify and contact you if necessary, no spam, we promise.
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                <div className="flex items-start space-x-2">
                  <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium mb-1">Security Notice</p>
                    <ul className="text-xs space-y-1">
                      <li>• Prayer times cannot be changed directly</li>
                      <li>• All requests require admin approval</li>
                      <li>• Maximum 3 requests per phone per day</li>
                      <li>• You will not be contacted. This is to prevent spam.</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handlePhoneSubmit}
                  disabled={loading || !phoneNumber.trim()}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center space-x-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      <span>Validating...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            // Prayer Times Editing Step
            <div className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <span className="text-red-700 text-sm">{error}</span>
                </div>
              )}

              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
                <p><strong>Phone:</strong> {phoneNumber}</p>
                <p className="mt-1">Modify the prayer times below and provide a reason for the changes.</p>
              </div>

              {/* Current vs Requested Times */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-800">Prayer Times</h3>
                {Object.entries(prayerTimes).map(([prayer, time]) => {
                  const isChanged = time !== masjid.prayerTimes[prayer];
                  return (
                    <div key={prayer} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-medium text-gray-700 capitalize w-20">
                          {prayer === 'dhuhr' ? 'Dhuhr' : prayer}
                        </label>
                        <input
                          type="time"
                          value={time}
                          onChange={(e) => setPrayerTimes({ ...prayerTimes, [prayer]: e.target.value })}
                          className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm ${
                            isChanged ? 'border-green-300 bg-green-50' : 'border-gray-300'
                          }`}
                          disabled={loading}
                        />
                      </div>
                      {isChanged && (
                        <p className="text-xs text-green-600 text-right">
                          Current: {masjid.prayerTimes[prayer]} → Requested: {time}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Reason for Change */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Update (optional)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Please explain the reason for updating these prayer times (e.g., seasonal change, mosque committee decision, or calculation adjustment)."
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  rows={3}
                  disabled={loading}
                  maxLength={500}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Minimum 10 characters required</span>
                  <span>{reason.length}/500</span>
                </div>
              </div>

              {/* Changes Summary */}
              {getChangedTimes().length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-green-800 mb-1">
                    Changes to be requested: {getChangedTimes().length} prayer time{getChangedTimes().length !== 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-green-700">
                    {getChangedTimes().join(', ')}
                  </p>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => setStep('phone')}
                  className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={loading}
                >
                  Back
                </button>
                <button
                  onClick={handleRequestSubmit}
                //   disabled={loading || !reason.trim() || reason.length < 10 || getChangedTimes().length === 0}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center space-x-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Request</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SecurePrayerTimesEditor;