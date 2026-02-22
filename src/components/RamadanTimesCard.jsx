import React from "react";

// ✅ Ramadan start in Hyderabad (India timezone)
const RAMADAN_START = "2026-02-19T00:00:00+05:30";

// ✅ Get India date only
const getIndiaDate = () => {
  const now = new Date();

  const indiaDate = new Date(
    now.toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    }),
  );

  indiaDate.setHours(0, 0, 0, 0);

  return indiaDate;
};

// ✅ Check Ramadan
const isRamadanInIndia = () => {
  const today = getIndiaDate();

  const start = new Date(RAMADAN_START);

  const diff = (today - start) / (1000 * 60 * 60 * 24);

  return diff >= 0 && diff < 30;
};

// ✅ Correct Roza day
const getRamadanDayIndia = () => {
  const today = getIndiaDate();

  const start = new Date(RAMADAN_START);

  const diffDays = Math.floor((today - start) / (1000 * 60 * 60 * 24)) + 1;

  const suffix =
    diffDays % 10 === 1 && diffDays !== 11
      ? "st"
      : diffDays % 10 === 2 && diffDays !== 12
        ? "nd"
        : diffDays % 10 === 3 && diffDays !== 13
          ? "rd"
          : "th";

  return `${diffDays}${suffix} Ramadan`;
};

const RamadanTimesCard = ({ ramadanTimes, loading }) => {
  if (!isRamadanInIndia()) return null;

  if (loading) {
    return (
      <div className="m-4 p-4 rounded-xl bg-emerald-100 text-emerald-800">
        🌙 Loading Ramadan timings…
      </div>
    );
  }

  if (!ramadanTimes) {
    return (
      <div className="m-4 p-4 rounded-xl bg-red-100 text-red-700">
        ⚠️ Unable to load Ramadan timings
      </div>
    );
  }

  return (
    <div className="m-2 p-3 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 text-white">
      <h3 className="font-semibold text-lg mb-3">🌙 {getRamadanDayIndia()}</h3>

      <div className="flex justify-between">
        <div>
          <p className="text-sm opacity-80">Sehri Ends</p>

          <p className="font-bold text-lg">{ramadanTimes.sehriEnd}</p>
        </div>

        <div>
          <p className="text-sm opacity-80">Iftar</p>

          <p className="font-bold text-lg">{ramadanTimes.iftar}</p>
        </div>
      </div>
    </div>
  );
};

export default RamadanTimesCard;
