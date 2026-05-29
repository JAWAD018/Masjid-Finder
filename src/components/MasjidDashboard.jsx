import React, { useEffect, useState } from "react";
import {
  MapPin, Search, Plus, X, Navigation, Clock, Phone,
  Globe, Filter, Menu, Edit3, BellRing, User,
  BookOpen, Trophy, ChevronRight, Wifi, WifiOff
} from "lucide-react";
import AddMasjidModal from "./AddMasjidModal";
import firebase from "../firebase/firebaseService";
import { AiFillInstagram, AiFillLinkedin } from "react-icons/ai";
import SecurePrayerTimesEditor from "./SecurePrayerTimesEditor.jsx";
import HadithSection from "./HadithSection.jsx";
import Leaderboard from "./Leaderboard .jsx";
import RamadanTimesCard from "./RamadanTimesCard.jsx";
import useRamadanTimes from "../utils/useRamadanTimes.js";
import TaraweehInfo from "./TaraweehInfo.jsx";

// ─── Utilities ───────────────────────────────────────────────────────────────

const haversineDistance = (coords1, coords2) => {
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(coords2.lat - coords1.lat);
  const dLon = toRad(coords2.lng - coords1.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 *
      Math.cos(toRad(coords1.lat)) *
      Math.cos(toRad(coords2.lat));
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

const formatTime12Hour = (time24) => {
  if (!time24) return "—";
  const [hours, minutes] = time24.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const h = hours % 12 || 12;
  return `${h}:${minutes.toString().padStart(2, "0")} ${period}`;
};

const PRAYER_KEYS = [
  "fajr",
  "dhuhr",
  "asr",
  "maghrib",
  "isha",
  "jummah"
];
const PRAYER_LABELS = {
  fajr: "Fajr",
  dhuhr: "Dhuhr",
  asr: "Asr",
  maghrib: "Maghrib",
  isha: "Isha",
  jummah: "Jummah"
};
const getCurrentPrayer = (times) => {
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  const prayers = PRAYER_KEYS.map((k) => {
    const [h, m] = (times[k] || "00:00").split(":").map(Number);
    return { name: PRAYER_LABELS[k], key: k, mins: h * 60 + m };
  });
  for (let i = 0; i < prayers.length; i++) {
    if (cur < prayers[i].mins)
      return { current: prayers[i > 0 ? i - 1 : 4], next: prayers[i] };
  }
  return { current: prayers[4], next: prayers[0] };
};

const getPrayerAlert = (prayerTimes) => {
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  for (const k of PRAYER_KEYS) {
    const [h, m] = (prayerTimes[k] || "00:00").split(":").map(Number);
    const diff = h * 60 + m - cur;
    if (diff > 0 && diff <= 30) return { status: "upcoming", key: k, name: PRAYER_LABELS[k], timeLeft: diff };
    if (Math.abs(diff) <= 15) return { status: "active", key: k, name: PRAYER_LABELS[k] };
  }
  return null;
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const PrayerPill = ({ prayer, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 ${
      active
        ? "bg-green-600 text-white shadow-sm"
        : "bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-700"
    }`}
  >
    {PRAYER_LABELS[prayer]}
  </button>
);


const Badge = ({ children, variant = "green" }) => {
  const cls = {
    green: "bg-green-50 text-green-700 border border-green-100",
    yellow: "bg-amber-50 text-amber-700 border border-amber-100",
    blue: "bg-blue-50 text-blue-700 border border-blue-100",
    gray: "bg-gray-100 text-gray-600",
  }[variant];
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cls}`}>
      {children}
    </span>
  );
};

const PrayerGrid = ({ prayerTimes, selectedPrayer }) => {
  const activePrayer = getCurrentPrayer(prayerTimes).current.key;
  return (
    <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-6 gap-1.5 mt-3">
      {PRAYER_KEYS.filter((k) => {
          if (k === "jummah") {
            return new Date().getDay() === 5;
          }

          return true;
        }).map((k) => {
        const time = prayerTimes[k];
        if (!time) return null;
        const isSelected = selectedPrayer === k;
        const isCurrent = activePrayer === k;
        return (
          <div
            key={k}
            className={`text-center py-2 px-1 rounded-xl transition-colors ${
              isSelected
                ? "bg-green-600 text-white"
                : isCurrent
                ? "bg-green-50 border border-green-200"
                : "bg-gray-100"
            }`}
          >
            <div className={`text-[10px] font-medium mb-0.5 ${isSelected ? "text-green-100" : "text-gray-400"}`}>
              {PRAYER_LABELS[k]}
            </div>
            <div className={`text-xs font-bold leading-tight ${isSelected ? "text-white" : "text-gray-800"}`}>
              {formatTime12Hour(time)}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const AlertBanner = ({ alert }) => {
  if (!alert) return null;
  const isActive = alert.status === "active";
  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium mb-3 ${
        isActive
          ? "bg-green-50 text-green-800 border border-green-200"
          : "bg-amber-50 text-amber-800 border border-amber-200"
      }`}
    >
      <BellRing className="w-4 h-4 flex-shrink-0" />
      {isActive
        ? `${alert.name} prayer time now!`
        : `${alert.name} in ${alert.timeLeft} min`}
    </div>
  );
};

// ─── MasjidCard ───────────────────────────────────────────────────────────────

const MasjidCard = ({ m, userLocation, selectedPrayer, user, onSelect, onDirections, onEdit }) => {
  const alert = m.prayerTimes ? getPrayerAlert(m.prayerTimes) : null;
  const dist = userLocation
    ? haversineDistance(userLocation, m.location).toFixed(1)
    : null;

  return (
    <div className="bg-white rounded-2xl border border-gray-300 hover:border-green-200 hover:shadow-md transition-all duration-200">
      {/* Card Top */}
      <div className="p-4">
        {/* Title row */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <button
              onClick={() => onSelect(m)}
              className="font-semibold text-base text-gray-900 hover:text-green-700 transition-colors text-left line-clamp-1"
            >
              {m.name}
            </button>
            <div className="flex items-start gap-1.5 mt-1">
              <MapPin className="w-3.5 h-3.5 text-gray-300 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-gray-500 line-clamp-1">{m.address}</p>
            </div>
          </div>
        </div>

        <AlertBanner alert={alert} />

        {/* Prayer times */}
        {m.prayerTimes && (
          <>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Prayer Times</span>
              {user && (
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(m); }}
                  className="text-gray-300 hover:text-green-600 transition-colors p-1 -mr-1 rounded"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <TaraweehInfo masjid={m} />
            <PrayerGrid prayerTimes={m.prayerTimes} selectedPrayer={selectedPrayer} />
          </>
        )}
      </div>

      {/* Card Footer */}
      <div className="px-4 pb-4 flex items-center justify-between gap-2 pt-3 border-t border-gray-50">
        {dist ? (
          <div className="flex items-center gap-1.5 text-green-600">
            <Navigation className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold">{dist} km</span>
          </div>
        ) : <div />}

        <div className="flex items-center gap-2">
          <button
            onClick={() => onSelect(m)}
            className="px-3 py-1.5 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 rounded-xl transition-colors"
          >
            Details
          </button>
          <button
            onClick={() => onDirections(m)}
            className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors flex items-center gap-1"
          >
            <Navigation className="w-3 h-3" />
            Go
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── MasjidDetailModal ────────────────────────────────────────────────────────

const MasjidDetailModal = ({ masjid, userLocation, user, onClose, onEdit }) => {
  const dist = userLocation
    ? haversineDistance(userLocation, masjid.location).toFixed(1)
    : null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl max-h-[92vh] overflow-y-auto">
        {/* Handle bar (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 pt-4 pb-5 border-b border-gray-100">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">{masjid.name}</h2>
              {masjid.userName && (
                <p className="text-xs text-gray-400 mt-1">Added by {masjid.userName}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors mt-0.5"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-6">
          {/* Prayer Times */}
          {masjid.prayerTimes && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Prayer Times</h3>
                <button
                  onClick={() => onEdit(masjid)}
                  className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Update
                </button>
              </div>
              <div className="space-y-1.5">
                {PRAYER_KEYS.filter((k) => {
                  if (k === "jummah") {
                    return new Date().getDay() === 5;
                  }

                  return true;
                }).map((k) => {
                  const time = masjid.prayerTimes[k];
                  if (!time) return null;
                  const alert = getPrayerAlert(masjid.prayerTimes);
                  const isActive = alert?.key === k && alert?.status === "active";
                  const isUpcoming = alert?.key === k && alert?.status === "upcoming";
                  return (
                    <div
                      key={k}
                      className={`flex items-center justify-between px-4 py-2.5 rounded-xl ${
                        isActive
                          ? "bg-green-50 border border-green-200"
                          : isUpcoming
                          ? "bg-amber-50 border border-amber-200"
                          : "bg-gray-50"
                      }`}
                    >
                      <span className="text-sm font-medium text-gray-700">{PRAYER_LABELS[k]}</span>
                      <div className="text-right">
                        <span className="text-sm font-bold text-gray-900">{formatTime12Hour(time)}</span>
                        {isActive && <div className="text-xs text-green-600 font-medium">Active now</div>}
                        {isUpcoming && <div className="text-xs text-amber-600 font-medium">In {alert.timeLeft} min</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <TaraweehInfo masjid={masjid} />

          {/* Location */}
          <section className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-4.5 h-4.5 text-green-600" style={{ width: 18, height: 18 }} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Address</p>
              <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{masjid.address}</p>
              {dist && (
                <Badge variant="green">
                  <Navigation className="w-3 h-3" />{dist} km away
                </Badge>
              )}
            </div>
          </section>

          {/* Phone */}
          {masjid.phone && (
            <section className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Phone className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Phone</p>
                <a href={`tel:${masjid.phone}`} className="text-sm text-green-600 hover:underline mt-0.5 block">
                  {masjid.phone}
                </a>
              </div>
            </section>
          )}

          {/* Website */}
          {masjid.website && (
            <section className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                <Globe className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Website</p>
                <a href={masjid.website} target="_blank" rel="noopener noreferrer" className="text-sm text-green-600 hover:underline mt-0.5 block">
                  Visit Website →
                </a>
              </div>
            </section>
          )}

          {/* Description */}
          {masjid.description && (
            <section>
              <p className="text-sm font-semibold text-gray-800 mb-1">About</p>
              <p className="text-sm text-gray-500 leading-relaxed">{masjid.description}</p>
            </section>
          )}

          {/* Facilities */}
          {masjid.facilities?.length > 0 && (
            <section>
              <p className="text-sm font-semibold text-gray-800 mb-2">Facilities</p>
              <div className="flex flex-wrap gap-2">
                {masjid.facilities.map((f) => (
                  <Badge key={f} variant="gray">{f}</Badge>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 pb-6 pt-2 grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              const url = `https://www.google.com/maps/dir/?api=1&destination=${masjid.location.lat},${masjid.location.lng}`;
              window.open(url, "_blank");
            }}
            className="flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <Navigation className="w-4 h-4" />
            Directions
          </button>
        </div>
      </div>
    </div>
  );
};

const SearchBar = ({
  searchQuery,
  setSearchQuery,
  filterOpen,
  setFilterOpen,
  sortBy,
  setSortBy,
  selectedPrayer,
}) => (
  <div className="px-4 pb-3 space-y-2">
    <div className="relative">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />

      <input
        type="text"
        placeholder="Search masjids..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        autoComplete="off"
        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-gray-400"
      />

      <button
        onClick={() => setFilterOpen((o) => !o)}
        className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors ${
          filterOpen
            ? "bg-green-100 text-green-600"
            : "text-gray-300 hover:text-gray-500"
        }`}
      >
        <Filter className="w-4 h-4" />
      </button>
    </div>

    {filterOpen && (
      <div className="bg-green-50 border border-green-100 rounded-xl px-3 py-2.5 flex items-center gap-3">
        <span className="text-xs font-medium text-green-700 whitespace-nowrap">
          Sort by
        </span>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="flex-1 text-sm bg-white border border-green-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="distance">Distance</option>
          <option value="prayer-time">
            Prayer time ({selectedPrayer})
          </option>
          <option value="name">Name (A–Z)</option>
        </select>
      </div>
    )}
  </div>
);

// ─── Main Dashboard ───────────────────────────────────────────────────────────

const MasjidDashboard = () => {
  const [activeTab, setActiveTab] = useState("prayer-times");
  const [userLocation, setUserLocation] = useState(null);
  const [masjids, setMasjids] = useState([]);
  const [selectedMasjid, setSelectedMasjid] = useState(null);
  const [addingMasjid, setAddingMasjid] = useState(false);
  const [editingPrayerTimes, setEditingPrayerTimes] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState("distance");
  const [selectedPrayer, setSelectedPrayer] = useState("dhuhr");
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [user, setUser] = useState(null);
  const [syncStatus, setSyncStatus] = useState("idle");
  const [ratingMasjid, setRatingMasjid] = useState(null);
  const [locationError, setLocationError] = useState(null);

  const locationForRamadan = userLocation || { lat: 17.385, lng: 78.4867 };
  const { ramadanTimes, loading: ramadanLoading } = useRamadanTimes(locationForRamadan);

  useEffect(() => {
    const unsub = firebase.onAuthStateChanged(setUser);
    loadMasjids();
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = firebase.onSnapshot("masjids", setMasjids);
    return unsub;
  }, []);

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) { setLocationError("Geolocation not supported"); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => { setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocationError(null); },
      (err) => setLocationError(err.code === 1 ? "Location permission denied" : "Unable to fetch location"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const loadMasjids = async () => {
    try {
      setSyncStatus("syncing");
      const data = await firebase.getDocs("masjids");
      setMasjids(data.length ? data : await firebase.getDocs("masjids"));
      setSyncStatus("synced");
    } catch {
      setSyncStatus("error");
    } finally {
      setLoading(false);
    }
  };

  const filteredMasjids = masjids.filter((m) => {
  const query = searchQuery.trim().toLowerCase();

  if (!query) return true;

  return (
    (m.name || "").toLowerCase().includes(query) ||
    (m.address || "").toLowerCase().includes(query)
  );
});

  const sortedMasjids = [...filteredMasjids].sort((a, b) => {
    if (sortBy === "distance" && userLocation)
      return haversineDistance(userLocation, a.location) - haversineDistance(userLocation, b.location);
    if (sortBy === "prayer-time") {
      const tA = a.prayerTimes?.[selectedPrayer] || "00:00";
      const tB = b.prayerTimes?.[selectedPrayer] || "00:00";
      return tA.localeCompare(tB);
    }
    if (sortBy === "name") return a.name.localeCompare(b.name);
    return 0;
  });

  const handleDirections = (m) => {
    if (!m.location) return;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${m.location.lat},${m.location.lng}`, "_blank");
  };

  // ── Loading Screen ──
  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-b from-green-50 to-white gap-4">
        <div className="w-12 h-12 rounded-2xl bg-green-600 flex items-center justify-center">
          <MapPin className="w-6 h-6 text-white" />
        </div>
        <div className="text-center">
          <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-600">Loading masjids…</p>
        </div>
      </div>
    );
  }



  const EmptyState = ({ icon: Icon, title, subtitle }) => (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-gray-300" />
      </div>
      <p className="text-base font-semibold text-gray-500 mb-1">{title}</p>
      <p className="text-sm text-gray-400">{subtitle}</p>
    </div>
  );

  // ── TABS ─────────────────────────────────────────────────────────────────────
  const tabs = [
    { id: "prayer-times", label: "Prayer", icon: Clock },
    { id: "list", label: "Masjids", icon: MapPin },
    { id: "hadith", label: "Hadith", icon: BookOpen },
    { id: "about", label: "About", icon: User },
  ];

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-100 px-4 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-green-600 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-lg font-bold text-gray-900">Masjid Finder</h1>
            </div>
            <p className="text-xs text-gray-400 mt-0.5 ml-9">
              {locationError ? (
                <span className="text-amber-500">{locationError}</span>
              ) : userLocation ? (
                "Using your location"
              ) : (
                "Getting location…"
              )}
            </p>
          </div>

          <div className="text-right">
            <div className="text-sm font-bold text-gray-800 font-mono tabular-nums">
              {currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}
            </div>
            <div className="text-xs text-gray-400">
              {currentTime.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            </div>
            <div className="text-[10px] text-green-600 font-medium">
              {new Intl.DateTimeFormat("en-US-u-ca-islamic", {
                day: "numeric", month: "short", year: "numeric",
              }).format(currentTime)}
            </div>
          </div>
        </div>
      </header>

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-hidden flex flex-col">

        {/* PRAYER TIMES TAB */}
        {activeTab === "prayer-times" && (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Ramadan card + prayer selector */}
            <div className="bg-white border-b border-gray-100 px-4 pt-3 pb-3 space-y-3">
              <RamadanTimesCard ramadanTimes={ramadanTimes} loading={ramadanLoading} />

              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Filter by prayer</p>
                <div className="flex gap-2 flex-wrap">
                  {PRAYER_KEYS.map((k) => (
                    <PrayerPill key={k} prayer={k} active={selectedPrayer === k} onClick={() => setSelectedPrayer(k)} />
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white border-b border-gray-100">
            <SearchBar
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                filterOpen={filterOpen}
                setFilterOpen={setFilterOpen}
                sortBy={sortBy}
                setSortBy={setSortBy}
                selectedPrayer={selectedPrayer}
              />
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {sortedMasjids.length === 0 ? (
                <EmptyState icon={Clock} title="No masjids found" subtitle="Try a different search or add a new masjid" />
              ) : (
                sortedMasjids.map((m) => (
                  <MasjidCard
                    key={m.id}
                    m={m}
                    userLocation={userLocation}
                    selectedPrayer={selectedPrayer}
                    user={user}
                    onSelect={setSelectedMasjid}
                    onDirections={handleDirections}
                    onEdit={setEditingPrayerTimes}
                  />
                ))
              )}
            </div>

            <div className="bg-white border-t border-gray-100 px-4 py-3">
              <button
                onClick={() => setAddingMasjid(true)}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add New Masjid
              </button>
            </div>
          </div>
        )}

        {/* LIST TAB */}
        {activeTab === "list" && (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="bg-white border-b border-gray-100 pt-3">
              <SearchBar />
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              <RamadanTimesCard ramadanTimes={ramadanTimes} loading={ramadanLoading} />
              {sortedMasjids.length === 0 ? (
                <EmptyState icon={MapPin} title="No masjids found" subtitle="Try adjusting your search" />
              ) : (
                sortedMasjids.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => setSelectedMasjid(m)}
                    className="bg-white rounded-2xl border border-gray-100 hover:border-green-200 hover:shadow-md transition-all cursor-pointer p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h2 className="font-semibold text-base text-gray-900 line-clamp-1">{m.name}</h2>
                        <div className="flex items-start gap-1.5 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-gray-300 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-gray-500 line-clamp-2">{m.address}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <ChevronRight className="w-4 h-4 text-gray-300" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      {userLocation && (
                        <Badge variant="green">
                          <Navigation className="w-3 h-3" />
                          {haversineDistance(userLocation, m.location).toFixed(1)} km
                        </Badge>
                      )}
                      {m.facilities?.length > 0 && (
                        <div className="flex gap-1 flex-wrap justify-end">
                          {m.facilities.slice(0, 2).map((f) => <Badge key={f} variant="gray">{f}</Badge>)}
                          {m.facilities.length > 2 && <Badge variant="gray">+{m.facilities.length - 2}</Badge>}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="bg-white border-t border-gray-100 px-4 py-3">
              <button
                onClick={() => setAddingMasjid(true)}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add New Masjid
              </button>
            </div>
          </div>
        )}

        {/* HADITH TAB */}
        {activeTab === "hadith" && (
          <div className="flex-1 overflow-y-auto">
            <HadithSection />
          </div>
        )}

        {/* LEADERBOARD TAB */}
        {activeTab === "leaderboard" && (
          <div className="flex-1 overflow-y-auto">
            <Leaderboard firebase={firebase} />
          </div>
        )}

        {/* ABOUT TAB */}
        {activeTab === "about" && (
          <div className="flex-1 overflow-y-auto px-5 py-8">
            <div className="max-w-sm mx-auto text-center space-y-5">
              {/* Avatar */}
              <div className="w-16 h-16 rounded-2xl bg-green-600 flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-white">MJ</span>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900">Mohammed Jawad</h2>
                <p className="text-sm text-gray-500">Creator · Hyderabad</p>
              </div>

              <div className="bg-gray-50 rounded-2xl p-4 text-left space-y-3">
                <p className="text-sm text-gray-600 leading-relaxed">
                  Assalamu Alaikum! While traveling, I often struggled to find nearby masjids and accurate prayer times sometimes missing Zuhr or Jummah.
                </p>
                <p className="text-sm text-gray-600 leading-relaxed">
                  <strong className="text-gray-800">Masjid Finder</strong> helps you locate nearby mosques, check prayer times, and navigate there so you never miss salah.
                </p>
              </div>

              <div className="flex justify-center gap-4">
                <a href="https://www.instagram.com/Jawad_0018" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 bg-pink-50 text-pink-600 rounded-xl text-sm font-medium hover:bg-pink-100 transition-colors">
                  <AiFillInstagram className="w-4 h-4" />
                  Instagram
                </a>
                <a href="https://www.linkedin.com/in/mohammed-jawad018" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-600 rounded-xl text-sm font-medium hover:bg-blue-100 transition-colors">
                  <AiFillLinkedin className="w-4 h-4" />
                  LinkedIn
                </a>
              </div>

              <p className="text-xs text-gray-300">© {new Date().getFullYear()} Mohammed Jawad</p>
            </div>
          </div>
        )}
      </main>

      {/* ── Bottom Nav ────────────────────────────────────────────────────── */}
      <nav className="bg-white border-t border-gray-100 flex">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 py-3 flex flex-col items-center gap-1 text-[11px] font-semibold transition-colors ${
              activeTab === id
                ? "text-green-600"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <div className={`relative ${activeTab === id ? "text-green-600" : ""}`}>
              <Icon className="w-5 h-5" />
              {activeTab === id && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-green-600 rounded-full" />
              )}
            </div>
            {label}
          </button>
        ))}
      </nav>

      {/* ── Modals ────────────────────────────────────────────────────────── */}
      {selectedMasjid && (
        <MasjidDetailModal
          masjid={selectedMasjid}
          userLocation={userLocation}
          user={user}
          onClose={() => setSelectedMasjid(null)}
          onEdit={(m) => { setSelectedMasjid(null); setEditingPrayerTimes(m); }}
        />
      )}

      {addingMasjid && (
        <AddMasjidModal
          userLocation={userLocation}
          onClose={() => setAddingMasjid(false)}
          onSave={(m) => { setMasjids((p) => [...p, m]); setSyncStatus("synced"); setAddingMasjid(false); }}
        />
      )}

      {editingPrayerTimes && (
        <SecurePrayerTimesEditor
          masjid={editingPrayerTimes}
          onClose={() => setEditingPrayerTimes(null)}
          onSave={(updated) => {
            setMasjids((p) => p.map((m) => (m.id === updated.id ? updated : m)));
            if (selectedMasjid?.id === updated.id) setSelectedMasjid(updated);
            setSyncStatus("synced");
            setEditingPrayerTimes(null);
          }}
        />
      )}
    </div>
  );
};

export default MasjidDashboard;