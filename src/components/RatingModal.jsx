import { useState, useEffect } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";

const RatingModal = ({ masjid, isOpen, onClose, onRated }) => {
  const [rating, setRating] = useState(0);
  const [alreadyRated, setAlreadyRated] = useState(false);

  useEffect(() => {
    if (!masjid) return;
    const ratedMasjids = JSON.parse(localStorage.getItem("ratedMasjids") || "[]");
    setAlreadyRated(ratedMasjids.includes(masjid.id));
  }, [masjid]);

  useEffect(() => {
    if (alreadyRated && masjid.rating) {
      setRating(masjid.rating); // prefill existing rating
    }
  }, [alreadyRated, masjid]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    try {
      const ratedMasjids = JSON.parse(localStorage.getItem("ratedMasjids") || "[]");
      if (alreadyRated) {
        const confirmUpdate = window.confirm(
          "You have already rated this masjid. Do you want to update your rating?"
        );
        if (!confirmUpdate) {
          onClose();
          return;
        }
      }

      // Update Firebase
      const masjidRef = doc(db, "masjids", masjid.id);
      await updateDoc(masjidRef, { rating });

      // Update localStorage if first time rating
      if (!alreadyRated) {
        localStorage.setItem(
          "ratedMasjids",
          JSON.stringify([...ratedMasjids, masjid.id])
        );
      }

      // Callback to update UI
      onRated(masjid.id, rating);

      onClose();
    } catch (err) {
      console.error("Failed to update rating:", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-lg p-6 w-80">
        <h3 className="text-lg font-bold text-gray-800 mb-4">{masjid.name}</h3>
        <p className="text-sm text-gray-500 mb-4">Rate this masjid:</p>
        <div className="flex justify-center mb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              className={`text-3xl cursor-pointer ${
                i < rating ? "text-yellow-400" : "text-gray-300"
              }`}
              onClick={() => setRating(i + 1)}
            >
              ★
            </span>
          ))}
        </div>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={rating === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default RatingModal;
