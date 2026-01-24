import React from "react";
import { Moon, Clock } from "lucide-react";
import { isRamadanInIndia } from "../utils/isRamadanIndia";

const TaraweehInfo = ({ masjid }) => {
  const isRamadan = isRamadanInIndia();

  // ⛔ Block outside Ramadan
  if (!isRamadan) return null;

  // ⛔ Block if no Taraweeh data
  if (!masjid?.ramadan?.taraweehTime) return null;

  return (
    <div className="m-1 p-2 rounded-xl bg-emerald-50 border border-emerald-200">
      <div className="flex items-center gap-2 text-emerald-700 font-medium text-sm">
        <Moon className="w-4 h-4" />
        <span>Taraweeh</span>
      </div>

      <div className="flex items-center justify-between mt-2 text-sm">
        <div className="flex items-center gap-2 text-gray-700">
          <Clock className="w-4 h-4" />
          <span>{masjid.ramadan.taraweehTime}</span>
        </div>

        {masjid.ramadan.taraweehParah && (
          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
            {masjid.ramadan.taraweehParah} Parah
          </span>
        )}
      </div>
    </div>
  );
};

export default TaraweehInfo;
