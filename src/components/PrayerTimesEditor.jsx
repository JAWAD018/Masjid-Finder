import React, { useState } from "react";
import firebase from "../firebase/firebaseService";
import { X, Save } from "lucide-react";


const PrayerTimesEditor = ({ masjid, onClose, onSave }) => {
  const [prayerTimes, setPrayerTimes] = useState(masjid.prayerTimes || {
    fajr: '05:30',
    dhuhr: '12:15',
    asr: '15:30',
    maghrib: '18:10',
    isha: '19:25'
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);

    try {
      await firebase.updateDoc('masjids', masjid.id, {
        prayerTimes,
        lastUpdated: new Date(),
        updatedBy: firebase.getCurrentUser()?.uid || 'anonymous'
      });

      onSave({ ...masjid, prayerTimes });
      onClose();
    } catch (error) {
      console.error('Error updating prayer times:', error);
      alert('Error updating prayer times. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b border-gray-100">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">Update Prayer Times</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">{masjid.name}</p>
        </div>

        <div className="p-6 space-y-4">
          {Object.entries(prayerTimes).map(([prayer, time]) => (
            <div key={prayer} className="flex justify-between items-center">
              <label className="text-sm font-medium text-gray-700 capitalize w-20">
                {prayer === 'dhuhr' ? 'Dhuhr' : prayer}
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setPrayerTimes({ ...prayerTimes, [prayer]: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
              />
            </div>
          ))}

          <div className="flex space-x-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving...' : 'Save'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrayerTimesEditor;