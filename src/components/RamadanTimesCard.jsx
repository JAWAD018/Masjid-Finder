import React from "react";

const isRamadanInIndia = () => {
  const month = new Intl.DateTimeFormat("en-US-u-ca-islamic", {
    month: "long",
    timeZone: "Asia/Kolkata",
  }).format(new Date());

  return month.toLowerCase().includes("ramadan");
};

const getRamadanDayIndia = () => {
  const hijriDay = new Intl.DateTimeFormat("en-US-u-ca-islamic", {
    day: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date());

  const dayNum = Number(hijriDay);
  const suffix =
    dayNum % 10 === 1 && dayNum !== 11
      ? "st"
      : dayNum % 10 === 2 && dayNum !== 12
      ? "nd"
      : dayNum % 10 === 3 && dayNum !== 13
      ? "rd"
      : "th";

  return `${dayNum}${suffix} Ramadan`;
};

const RamadanTimesCard = ({ ramadanTimes, loading }) => {
  // ⛔ Hide completely outside Ramadan (India)
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
      <h3 className="font-semibold text-lg mb-3">
        🌙 {getRamadanDayIndia()}
      </h3>

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
