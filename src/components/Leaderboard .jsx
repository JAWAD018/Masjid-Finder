import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Award, Users, Calendar, TrendingUp } from 'lucide-react';
import firebase from "../firebase/firebaseService"; 

const normalizeName = (name = "") =>
  name.toString().trim().toLowerCase();

export const getLeaderboard = async (firebase, period = "all") => {
   try {
    let masjids = await firebase.getDocs("masjids");

    const now = new Date();
    if (period !== "all") {
      masjids = masjids.filter((m) => {
        if (!m.createdAt) return false;
        const createdDate = m.createdAt.toDate ? m.createdAt.toDate() : new Date(m.createdAt);
        if (period === "month") return createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear();
        if (period === "week") return createdDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return true;
      });
    }

    // Count how many masjids have each normalized userName
    const nameCount = {};
    masjids.forEach((m) => {
      if (m.userName) {
        const norm = normalizeName(m.userName);
        nameCount[norm] = (nameCount[norm] || 0) + 1;
      }
    });

    const contributorMap = {};

    masjids.forEach((m) => {
      let key;
      if (m.userName && nameCount[normalizeName(m.userName)] > 1) {
        // If userName appears multiple times, use normalized name as key
        key = normalizeName(m.userName);
      } else {
        // Otherwise fallback to createdBy
        key = m.createdBy || normalizeName(m.userName || "anonymous");
      }

      const displayName = m.userName || "Anonymous";

      if (!contributorMap[key]) {
        contributorMap[key] = {
          key,
          userName: displayName,
          count: 0,
          masjids: [],
        };
      }

      contributorMap[key].count++;
      contributorMap[key].masjids.push(m.name);
    });

    const leaderboard = Object.values(contributorMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return leaderboard;
  } catch (err) {
    console.error("getLeaderboardNameFirst error", err);
    return [];
  }
};

export default function Leaderboard() {
    const [totalMasjids, setTotalMasjids] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
   const loadLeaderboard = async () => {
  setLoading(true);
  const data = await getLeaderboard(firebase, selectedPeriod);

  // Assign tie-aware ranks
  const sorted = data.sort((a, b) => b.count - a.count);
  let lastCount = null;
  let lastRank = 0;
  let skip = 1;

  sorted.forEach((c, index) => {
    if (c.count === lastCount) {
      c.rank = lastRank; // same rank as previous
      skip++;
    } else {
      c.rank = lastRank + skip;
      lastRank = c.rank;
      lastCount = c.count;
      skip = 1;
    }
  });

  setLeaderboard(sorted);
  setTotalMasjids(sorted.reduce((sum, contributor) => sum + contributor.count, 0));
  setLoading(false);
};
    loadLeaderboard();
  }, [selectedPeriod]);

  const getRankIcon = (index) => {
    if (index === 0) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (index === 1) return <Medal className="w-6 h-6 text-gray-400" />;
    if (index === 2) return <Award className="w-6 h-6 text-amber-600" />;
    return <div className="w-6 h-6 flex items-center justify-center text-gray-500 font-bold">{index + 1}</div>;
  };

  const getRankBgColor = (index) => {
    if (index === 0) return 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-300';
    if (index === 1) return 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-300';
    if (index === 2) return 'bg-gradient-to-r from-amber-50 to-amber-100 border-amber-300';
    return 'bg-white border-gray-200';
  };

  const periods = [
    { value: 'all', label: 'All Time', icon: <TrendingUp className="w-4 h-4" /> },
    { value: 'month', label: 'This Month', icon: <Calendar className="w-4 h-4" /> },
    { value: 'week', label: 'This Week', icon: <Calendar className="w-4 h-4" /> }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-green-700 font-medium">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-4 pb-20">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-6">
          <div className="flex items-center justify-center space-x-3 mb-3">
            <Trophy className="w-10 h-10 text-green-600" />
            <h1 className="text-3xl font-bold text-gray-800">Top Contributors</h1>
          </div>
          <p className="text-gray-600">
            Honoring those who help Muslims find nearby masjids
          </p>
          <div className="mt-4 flex items-center justify-center space-x-2 text-sm text-gray-500">
            <Users className="w-4 h-4" />
            <span>{totalMasjids} masjids added {selectedPeriod !== 'all' && `this ${selectedPeriod}`}</span>
          </div>
        </div>

        {/* Period Filter */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-2 mb-6">
          <div className="grid grid-cols-3 gap-2">
            {periods.map(period => (
              <button
                key={period.value}
                onClick={() => setSelectedPeriod(period.value)}
                className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-medium transition-all ${
                  selectedPeriod === period.value
                    ? 'bg-green-600 text-white shadow-md'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {period.icon}
                <span className="text-sm">{period.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Leaderboard */}
        {leaderboard.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No contributors found for this period</p>
            <p className="text-gray-400 text-sm mt-2">
              Be the first to add a masjid!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
           {leaderboard
  .filter(c => c.userName.toLowerCase() !== "anonymous") // remove anonymous
  .map((contributor, index) => (
    <div
      key={contributor.key} // use unique key
      className={`${getRankBgColor(contributor.rank - 1)} rounded-2xl shadow-sm border-2 p-5 transition-all hover:shadow-md`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          {/* Rank Icon */}
          <div className="flex-shrink-0">
            {getRankIcon(contributor.rank - 1)}
          </div>

          {/* Contributor Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-800 truncate">
              {contributor.userName}
            </h3>
            <p className="text-sm text-gray-600">
              {contributor.count} masjid{contributor.count !== 1 ? "s" : ""} added
            </p>

            {/* Show masjid names on hover or expand */}
            {contributor.rank <= 3 && contributor.masjids.length > 0 && (
              <details className="mt-2">
                <summary className="text-xs text-green-600 cursor-pointer hover:text-green-700">
                  View masjids
                </summary>
                <ul className="mt-2 space-y-1 text-xs text-gray-600 ml-4">
                  {contributor.masjids.map((name, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <span className="text-green-600 mt-0.5">•</span>
                      <span>{name}</span>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        </div>

        {/* Count Badge */}
        <div
          className={`flex-shrink-0 ${
            contributor.rank === 1
              ? "bg-yellow-500"
              : contributor.rank === 2
              ? "bg-gray-400"
              : contributor.rank === 3
              ? "bg-amber-600"
              : "bg-green-600"
          } text-white rounded-full px-4 py-2 font-bold text-lg min-w-[60px] text-center`}
        >
          {contributor.count}
        </div>
      </div>
    </div>
  ))}

          </div>
        )}

        {/* Footer Message */}
        <div className="mt-8 text-center">
          <div className="bg-green-100 border border-green-300 rounded-xl p-4">
            <p className="text-green-800 text-sm font-medium">
              May Allah reward all contributors who make it easier for Muslims to pray on time
            </p>
            <p className="text-green-700 text-xs mt-1">
              JazakAllah Khair for your efforts!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

