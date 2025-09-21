import React, { useState } from "react";
import firebase from "../firebase/firebaseService";

const RequestUpdateModal = ({ masjid, onClose }) => {
  const [phone, setPhone] = useState("");
  const [fajr, setFajr] = useState(masjid.prayerTimes.fajr);
  const [dhuhr, setDhuhr] = useState(masjid.prayerTimes.dhuhr);
  const [asr, setAsr] = useState(masjid.prayerTimes.asr);
  const [maghrib, setMaghrib] = useState(masjid.prayerTimes.maghrib);
  const [isha, setIsha] = useState(masjid.prayerTimes.isha);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!phone) return alert("Enter your phone number");

    setLoading(true);
    try {
      await firebase.addDoc("updateRequests", {
        masjidId: masjid.id,
        phoneNumber: phone,
        requestedTimes: { fajr, dhuhr, asr, maghrib, isha },
        status: "pending",
        createdAt: firebase.serverTimestamp()
      });
      alert("Request submitted! Admin will review it.");
      onClose();
    } catch (err) {
      console.error(err);
      alert("Error submitting request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full">
        <h2 className="text-lg font-bold mb-4">Request Prayer Time Update</h2>
        <input
          type="tel"
          placeholder="Your phone number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full mb-2 p-2 border rounded"
        />
        {["fajr", "dhuhr", "asr", "maghrib", "isha"].map(prayer => (
          <input
            key={prayer}
            type="time"
            value={{ fajr, dhuhr, asr, maghrib, isha }[prayer]}
            onChange={(e) => {
              const val = e.target.value;
              if (prayer === "fajr") setFajr(val);
              if (prayer === "dhuhr") setDhuhr(val);
              if (prayer === "asr") setAsr(val);
              if (prayer === "maghrib") setMaghrib(val);
              if (prayer === "isha") setIsha(val);
            }}
            className="w-full mb-2 p-2 border rounded"
          />
        ))}
        <div className="flex justify-end space-x-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit Request"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RequestUpdateModal;
