import React, { useEffect, useState } from "react";
import { MapPin, Search, Plus, X, Navigation, Clock, Phone, Globe, Star, Filter, Menu, Edit3, BellRing, User, BookOpen } from "lucide-react";
import AddMasjidModal from "./AddMasjidModal";
import firebase from "../firebase/firebaseService";
import RatingModal from "./RatingModal";
import { AiFillInstagram, AiFillLinkedin, AiFillStar, AiOutlineStar } from "react-icons/ai";
import SecurePrayerTimesEditor from "./SecurePrayerTimesEditor.jsx";
import HadithSection from "./HadithSection.jsx";

// Prayer times utility
const getPrayerTimes = () => {
  const now = new Date();
  const today = now.toDateString();

  return {
    date: today,
    fajr: "05:30",
    sunrise: "06:45",
    dhuhr: "12:15",
    asr: "15:30",
    maghrib: "18:10",
    isha: "19:25"
  };
};

const getCurrentPrayer = (times) => {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const prayers = [
    { name: 'Fajr', time: times.fajr },
    { name: 'Dhuhr', time: times.dhuhr },
    { name: 'Asr', time: times.asr },
    { name: 'Maghrib', time: times.maghrib },
    { name: 'Isha', time: times.isha }
  ];

  for (let i = 0; i < prayers.length; i++) {
    const [hours, minutes] = prayers[i].time.split(':').map(Number);
    const prayerTime = hours * 60 + minutes;

    if (currentTime < prayerTime) {
      return { current: prayers[i], next: prayers[i + 1] || prayers[0] };
    }
  }

  return { current: prayers[0], next: prayers[1] };
};

const formatTime12Hour = (time24) => {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
};


// Utility to calculate distance
const haversineDistance = (coords1, coords2) => {
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(coords2.lat - coords1.lat);
  const dLon = toRad(coords2.lng - coords1.lng);
  const lat1 = toRad(coords1.lat);
  const lat2 = toRad(coords2.lat);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

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
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, synced, error
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [ratingMasjid, setRatingMasjid] = useState(null)


  // Initialize Firebase and load data
  useEffect(() => {
    // Auth state listener
    const unsubscribeAuth = firebase.onAuthStateChanged((user) => {
      setUser(user);
    });

    // Load masjids from Firebase
    loadMasjids();

    return () => {
      unsubscribeAuth();
    };
  }, []);

  // Load masjids from Firebase
  const loadMasjids = async () => {
    try {
      setSyncStatus('syncing');
      const masjidsData = await firebase.getDocs('masjids');

      // If no data in Firebase, add sample data
      if (masjidsData.length === 0) {
        const updatedData = await firebase.getDocs('masjids');
        setMasjids(updatedData);
      } else {
        setMasjids(masjidsData);
      }
      setSyncStatus('synced');
    } catch (error) {
      console.error('Error loading masjids:', error);
      setSyncStatus('error');
    } finally {
      setLoading(false);
    }
  };




  // Add sample data to Firebase
  // const addSampleData = async () => {
  //   const sampleMasjids = [
  //     {
  //       name: "Masjid Al-Noor",
  //       address: "123 Main Street, Hyderabad, Telangana",
  //       phone: "+91 98765 43210",
  //       website: "https://masjidalnoor.com",
  //       description: "A beautiful mosque with modern facilities and excellent community programs.",
  //       location: { lat: 17.385, lng: 78.486 },
  //       rating: 4.8,
  //       reviews: 156,
  //       facilities: ["Parking", "Air Conditioning", "Prayer Mats", "Wudu Area"],
  //       prayerTimes: {
  //         fajr: '05:30',
  //         dhuhr: '12:15',
  //         asr: '15:30',
  //         maghrib: '18:10',
  //         isha: '19:25'
  //       },
  //       status: 'active'
  //     },
  //     {
  //       name: "Jamia Masjid",
  //       address: "456 Heritage Road, Old City, Hyderabad",
  //       phone: "+91 98765 43211",
  //       description: "Historic mosque serving the community for over 100 years.",
  //       location: { lat: 17.375, lng: 78.476 },
  //       rating: 4.6,
  //       reviews: 89,
  //       facilities: ["Library", "Madrasah", "Prayer Mats"],
  //       prayerTimes: {
  //         fajr: '05:35',
  //         dhuhr: '12:20',
  //         asr: '15:35',
  //         maghrib: '18:15',
  //         isha: '19:30'
  //       },
  //       status: 'active'
  //     },
  //     {
  //       name: "Masjid Al-Huda",
  //       address: "789 Community Center, Banjara Hills, Hyderabad",
  //       phone: "+91 98765 43212",
  //       description: "Modern community mosque with youth programs and Islamic education.",
  //       location: { lat: 17.395, lng: 78.496 },
  //       rating: 4.7,
  //       reviews: 92,
  //       facilities: ["Parking", "Library", "Air Conditioning", "Women Section"],
  //       prayerTimes: {
  //         fajr: '05:25',
  //         dhuhr: '12:10',
  //         asr: '15:25',
  //         maghrib: '18:05',
  //         isha: '19:20'
  //       },
  //       status: 'active'
  //     }
  //   ];

  //   for (const masjid of sampleMasjids) {
  //     await firebase.addDoc('masjids', masjid);
  //   }
  // };

  // Real-time updates listener
  useEffect(() => {
    const unsubscribe = firebase.onSnapshot('masjids', (data) => {
      setMasjids(data);
    });

    return () => unsubscribe();
  }, []);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Get user location
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => {
        console.error(err);
      },
      { enableHighAccuracy: true }
    );
  }, []);

  const handleMasjidAdd = async (newMasjid) => {
    setMasjids(prev => [...prev, newMasjid]);
    setSyncStatus('synced');
  };

  const handleMasjidUpdate = async (updatedMasjid) => {
    setMasjids(prev => prev.map(m => m.id === updatedMasjid.id ? updatedMasjid : m));
    if (selectedMasjid && selectedMasjid.id === updatedMasjid.id) {
      setSelectedMasjid(updatedMasjid);
    }
    setSyncStatus('synced');
  };

  const filteredMasjids = masjids.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedMasjids = [...filteredMasjids].sort((a, b) => {
    switch (sortBy) {
      case "distance":
        if (!userLocation) return 0;
        return haversineDistance(userLocation, a.location) - haversineDistance(userLocation, b.location);

      case "rating":
        return (b.rating || 0) - (a.rating || 0);

      case "prayer-time": {
        if (!a.prayerTimes || !b.prayerTimes) return 0;
        const timeA = a.prayerTimes[selectedPrayer] || "00:00";
        const timeB = b.prayerTimes[selectedPrayer] || "00:00";
        return timeA.localeCompare(timeB);
      }

      case "name":
        return a.name.localeCompare(b.name);

      default:
        return 0;
    }
  });

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  const getCurrentPrayerStatus = (masjidPrayerTimes) => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const prayers = [
      { name: 'Fajr', time: masjidPrayerTimes.fajr, key: 'fajr' },
      { name: 'Dhuhr', time: masjidPrayerTimes.dhuhr, key: 'dhuhr' },
      { name: 'Asr', time: masjidPrayerTimes.asr, key: 'asr' },
      { name: 'Maghrib', time: masjidPrayerTimes.maghrib, key: 'maghrib' },
      { name: 'Isha', time: masjidPrayerTimes.isha, key: 'isha' }
    ];

    for (let i = 0; i < prayers.length; i++) {
      const [hours, minutes] = prayers[i].time.split(':').map(Number);
      const prayerMinutes = hours * 60 + minutes;
      const timeDiff = prayerMinutes - currentMinutes;

      if (timeDiff > 0 && timeDiff <= 30) {
        return { status: 'upcoming', prayer: prayers[i], timeLeft: timeDiff };
      }
      if (Math.abs(timeDiff) <= 15) {
        return { status: 'active', prayer: prayers[i] };
      }
    }
    return null;
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-green-700 font-medium">Loading masjids from DB...</p>
          <p className="text-green-600 text-sm mt-2">
            Status: {syncStatus === 'syncing' ? 'Syncing with database...' :
              syncStatus === 'synced' ? 'Data synchronized' :
                syncStatus === 'error' ? 'Connection error' : 'Connecting...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header with Auth */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Masjid Finder</h1>
              <p className="text-green-100 text-sm">Find nearby mosques with prayer times</p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Sync Status */}
              <div className="flex items-center space-x-2">
                {/* <div className={`w-2 h-2 rounded-full ${syncStatus === 'synced' ? 'bg-green-300' :
                  syncStatus === 'syncing' ? 'bg-yellow-300 animate-pulse' :
                    syncStatus === 'error' ? 'bg-red-300' : 'bg-gray-300'
                  }`}></div>
                <span className="text-xs text-green-100">
                  {syncStatus === 'synced' ? 'Synced' :
                    syncStatus === 'syncing' ? 'Syncing...' :
                      syncStatus === 'error' ? 'Offline' : 'Connecting...'}
                </span> */}
              </div>

              {/* Time Display */}
              <div className="text-right text-sm">
                {/* Gregorian Date */}
                <div className="text-green-100">
                  {currentTime.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>

                {/* Gregorian Time */}
                <div className="font-mono">
                  {currentTime.toLocaleTimeString('en-US', {
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>

                {/* Islamic / Hijri Date */}
                <div className="text-yellow-200 text-xs mt-1">
                  {new Intl.DateTimeFormat('en-US-u-ca-islamic', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    weekday: 'short',
                  }).format(currentTime)}
                </div>
              </div>



              {/* User Menu */}
              {/* <div className="flex items-center space-x-2">
                {user ? (
                  <div className="flex items-center space-x-2">
                    <div className="bg-white bg-opacity-20 rounded-full p-2">
                      <User className="w-5 h-5" />
                    </div>
                    <div className="text-sm">
                      <div className="text-green-100">{user.displayName || user.email}</div>
                      <button
                        onClick={handleSignOut}
                        className="text-green-200 hover:text-white text-xs flex items-center space-x-1"
                      >
                        <LogOut className="w-3 h-3" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <div className="bg-white bg-opacity-20 rounded-full p-2">
                      <Clock className="w-6 h-6" />
                    </div>
                  </div>

                )}

                <div className="bg-white bg-opacity-20 rounded-full p-2">
                  <Clock className="w-6 h-6" />
                </div>
              </div> */}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "prayer-times" ? (
          <div className="flex flex-col h-full">
            {/* Prayer Times Overview */}
            <div className="p-4 bg-white shadow-sm border-b">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-800 mb-2">Today's Prayer Times</h2>
                <div className="grid grid-cols-5 gap-2">
                  {['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].map(prayer => (
                    <button
                      key={prayer}
                      onClick={() => setSelectedPrayer(prayer)}
                      className={`p-2 rounded-lg text-center transition-colors ${selectedPrayer === prayer
                        ? 'bg-green-600 text-white'
                        : 'bg-green-50 text-green-700 hover:bg-green-100'
                        }`}
                    >
                      <div className="text-xs font-medium capitalize">
                        {prayer === 'dhuhr' ? 'Dhuhr' : prayer}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Search and Filter */}
              <div className="flex space-x-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search masjids..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  />
                </div>
                <button
                  onClick={() => setFilterOpen(!filterOpen)}
                  className="px-4 py-3 bg-green-50 text-green-600 rounded-xl border border-green-200 hover:bg-green-100 transition-colors"
                >
                  <Filter className="w-5 h-5" />
                </button>
              </div>

              {filterOpen && (
                <div className="bg-green-50 rounded-xl p-3 border border-green-200 mt-3">
                  <label className="block text-sm font-medium text-green-700 mb-2">Sort by:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  >
                    <option value="distance">Distance</option>
                    <option value="prayer-time">Prayer Time ({selectedPrayer})</option>
                    <option value="rating">Rating</option>
                    <option value="name">Name</option>
                  </select>
                </div>
              )}
            </div>

            {/* Masjid List with Prayer Times */}
            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
              {sortedMasjids.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No masjids found</p>
                  <p className="text-gray-400 text-sm">
                    Try adjusting your search or add a new masjid
                  </p>
                </div>
              ) : (
                sortedMasjids.map((m) => {
                  const prayerStatus = m.prayerTimes
                    ? getCurrentPrayerStatus(m.prayerTimes)
                    : null;
                  return (
                    <div
                      key={`status-${m.id}`}   // ✅ prefixed key
                      className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-green-200 transition-all duration-200"
                    >
                      <div className="p-5">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h2 className="font-bold text-lg text-gray-800 mb-1">{m.name}</h2>
                            <div className="flex items-start space-x-2 mb-2">
                              <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                              <p className="text-sm text-gray-600 leading-relaxed">{m.address}</p>
                            </div>
                          </div>
                          {m.rating && (
                            <div className="flex items-center space-x-1 bg-green-50 px-2 py-1 rounded-full">
                              <div className="flex">{renderStars(m.rating || 0, m.id)}</div>
                              <span className="text-sm text-green-700 font-medium">{m.rating || 0}</span>
                            </div>
                          )}
                        </div>

                        {/* Prayer Status Alert */}
                        {prayerStatus && (
                          <div className={`mb-3 p-2 rounded-lg flex items-center space-x-2 ${prayerStatus.status === 'active'
                            ? 'bg-green-100 text-green-800 border border-green-200'
                            : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                            }`}>
                            <BellRing className="w-4 h-4" />
                            <span className="text-sm font-medium">
                              {prayerStatus.status === 'active'
                                ? `${prayerStatus.prayer.name} prayer time now!`
                                : `${prayerStatus.prayer.name} in ${prayerStatus.timeLeft} min`}
                            </span>
                          </div>
                        )}

                        {/* Prayer Times Display */}
                        {m.prayerTimes && (
                          <div className="mb-4">
                            <div className="flex justify-between items-center mb-2">
                              <h3 className="text-sm font-medium text-gray-700">Prayer Times</h3>
                              {user && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingPrayerTimes(m);
                                  }}
                                  className="text-green-600 hover:text-green-700 p-1 rounded"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                              )}
                            </div>

                            <div className="grid grid-cols-5 gap-2">
                              {["fajr", "dhuhr", "asr", "maghrib", "isha"].map((prayer) => {
                                const time = m.prayerTimes[prayer];
                                if (!time) return null;

                                const isCurrent = getCurrentPrayer(m.prayerTimes).current.name.toLowerCase() === prayer;

                                return (
                                  <div
                                    key={`${m.id}-${prayer}`}
                                    className={`text-center p-2 rounded-lg ${selectedPrayer === prayer
                                      ? "bg-green-100 border-2 border-green-300"
                                      : isCurrent
                                        ? "bg-green-50 border border-green-200"
                                        : "bg-gray-50"
                                      }`}
                                  >
                                    <div className="text-xs text-gray-600 capitalize">{prayer}</div>
                                    <div className="text-sm font-semibold text-gray-800">
                                      {formatTime12Hour(time)}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}


                        <div className="flex items-center justify-between">
                          {userLocation && (
                            <div className="flex items-center space-x-1 text-green-600">
                              <Navigation className="w-4 h-4" />
                              <span className="text-sm font-medium">
                                {haversineDistance(userLocation, m.location).toFixed(1)} km away
                              </span>
                            </div>
                          )}

                          <div className="flex space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedMasjid(m);
                              }}
                              className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm hover:bg-green-200 transition-colors"
                            >
                              Details
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!m.location) return;
                                const destination = `${m.location.lat},${m.location.lng}`;
                                // Optional: include current location as source if available
                                const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
                                window.open(url, "_blank");
                              }}
                              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200 transition-colors flex items-center space-x-1"
                            >
                              <Navigation className="w-3 h-3" />
                              <span>Directions</span>
                            </button>

                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Add Masjid Button */}
            <div className="p-4 bg-white border-t border-gray-200">
              <button
                onClick={() => setAddingMasjid(true)}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-md"
              >
                <Plus className="w-5 h-5" />
                <span>Add New Masjid</span>
              </button>

            </div>
          </div>
        ) : activeTab === "list" ? (
          <div className="flex flex-col h-full">
            {/* Search and Filter bar */}
            <div className="p-4 bg-white shadow-sm border-b">
              <div className="flex space-x-3 mb-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search masjids..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  />
                </div>
                <button
                  onClick={() => setFilterOpen(!filterOpen)}
                  className="px-4 py-3 bg-green-50 text-green-600 rounded-xl border border-green-200 hover:bg-green-100 transition-colors"
                >
                  <Filter className="w-5 h-5" />
                </button>
              </div>

              {filterOpen && (
                <div className="bg-green-50 rounded-xl p-3 border border-green-200">
                  <label className="block text-sm font-medium text-green-700 mb-2">Sort by:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  >
                    <option value="distance">Distance</option>
                    <option value="rating">Rating</option>
                    <option value="name">Name</option>
                  </select>
                </div>
              )}
            </div>

            {/* Masjid List */}
            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
              {sortedMasjids.length === 0 ? (
                <div className="text-center py-12">
                  <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No masjids found</p>
                  <p className="text-gray-400 text-sm">Try adjusting your search or add a new masjid</p>
                </div>
              ) : (
                sortedMasjids.map((m) => (
                  <div
                    key={`list-${m.id}`}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:border-green-200 transition-all duration-200"
                    onClick={() => setSelectedMasjid(m)}
                  >
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-3">
                        <h2 className="font-bold text-lg text-gray-800 pr-4">{m.name}</h2>
                        {m.rating && (
                          <div className="flex items-center space-x-1 bg-green-50 px-2 py-1 rounded-full">
                            <div className="flex">{renderStars(m.rating)}</div>
                            <span className="text-sm text-green-700 font-medium">{m.rating}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-start space-x-2 mb-3">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-600 leading-relaxed">{m.address}</p>
                      </div>

                      {m.description && (
                        <p className="text-sm text-gray-500 mb-3 line-clamp-2">{m.description}</p>
                      )}

                      <div className="flex items-center justify-between">
                        {userLocation && (
                          <div className="flex items-center space-x-1 text-green-600">
                            <Navigation className="w-4 h-4" />
                            <span className="text-sm font-medium">
                              {haversineDistance(userLocation, m.location).toFixed(1)} km away
                            </span>
                          </div>
                        )}

                        {m.facilities && m.facilities.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {m.facilities.slice(0, 2).map(facility => (
                              <span key={facility} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                                {facility}
                              </span>
                            ))}
                            {m.facilities.length > 2 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                                +{m.facilities.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add Masjid Button */}
            <div className="p-4 bg-white border-t border-gray-200">
              <button
                onClick={() => setAddingMasjid(true)}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-md"
              >
                <Plus className="w-5 h-5" />
                <span>Add New Masjid</span>
              </button>
            </div>
          </div>
        ) : (
         <div className="h-screen bg-gray-200 flex items-center justify-center">
      <HadithSection />
    </div>
        )}
      </div>

{activeTab === "about" && (
<div className="bg-green-50 py-10 h-full px-4 mt-8">
  <div className="max-w-2xl mx-auto text-center space-y-6">
    <h2 className="text-2xl font-bold text-green-800">About the Creator</h2>
    
    <p className="text-gray-700 text-sm md:text-base">
      Assalamu Alaikum! I'm <span className="font-semibold">Mohammed Jawad</span> from Hyderabad.  
      While traveling or visiting new places, I often struggled to find nearby masjids and accurate prayer times of salah.  
      Sometimes I would even miss <span className="font-medium">Zuhr</span> or have trouble making it to <span className="font-medium">Jummah</span> on time.  
    </p>
    
    <p className="text-gray-700 text-sm md:text-base">
      That’s when I thought — why not build a simple WebApp to help people like me?  
      <span className="font-semibold">Masjid Finder</span> helps you quickly locate nearby mosques, see prayer times, and navigate there easily.  
      My goal is to make it easier for everyone to pray on time, wherever they are.
    </p>
    
    <p className="text-gray-600 text-sm md:text-base">
      Feel free to connect with me on social media:
    </p>
    
    <div className="flex justify-center space-x-6 mb-4">
      <a
        href="https://www.instagram.com/Jawad_0018"
        target="_blank"
        rel="noopener noreferrer"
        className="text-pink-500 hover:text-pink-600 transition-colors"
      >
        <AiFillInstagram className="w-8 h-8" />
      </a>
      <a
        href="https://www.linkedin.com/in/mohammed-jawad018"
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-700 transition-colors"
      >
        <AiFillLinkedin className="w-8 h-8" />
      </a>
    </div>

    <p className="text-gray-500 text-xs mt-4">
      &copy; {new Date().getFullYear()} Mohammed Jawad. All rights reserved.
    </p>
  </div>
</div>

    )}


      {/* Bottom Navigation */}
      <div className="bg-white shadow-lg border-t border-gray-100">
       <div className="flex border-t border-gray-100 bg-white shadow-lg">
  {[
    { tab: "prayer-times", label: "Prayer", icon: <Clock className="w-4 h-4" /> },
    { tab: "list", label: "List", icon: <Menu className="w-4 h-4" /> },
    { tab: "hadith", label: "Hadith", icon: <BookOpen className="w-4 h-4" /> },
    { tab: "about", label: "About", icon: <User className="w-4 h-4" /> },
  ].map(({ tab, label, icon }) => (
    <button
      key={tab}
      onClick={() => setActiveTab(tab)}
      className={`flex-1 py-2 text-xs font-medium transition-colors flex flex-col items-center justify-center space-y-1 ${
        activeTab === tab
          ? "text-green-600 border-t-2 border-green-600 bg-green-50"
          : "text-gray-600 hover:text-green-600 hover:bg-green-50"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  ))}
</div>

      </div>

      {/* Enhanced Masjid Details Modal with Prayer Times */}
      {selectedMasjid && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-start">
                <div className="pr-4">
                  <h2 className="text-2xl font-bold mb-1">{selectedMasjid.name}</h2>
                  {selectedMasjid.rating && (
                    <div className="flex items-center space-x-2">
                      <div className="flex">{renderStars(selectedMasjid.rating)}</div>
                      <span className="text-green-100">({selectedMasjid.rating || 0} Rating)</span>
                    </div>

                  )}
                </div>
                <button
                  onClick={() => setSelectedMasjid(null)}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Prayer Times Section */}
              {selectedMasjid.prayerTimes && (
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                      <Clock className="w-5 h-5 text-green-600" />
                      <span>Prayer Times</span>
                    </h3>
                     
                      <button
                        onClick={() => setEditingPrayerTimes(selectedMasjid)}
                        className="text-green-600 hover:text-green-700 p-1 rounded flex items-center space-x-1 text-sm"
                      >
                        <Edit3 className="w-4 h-4" />
                        <span>Update</span>
                      </button>
                    
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {Object.entries(selectedMasjid.prayerTimes).map(([prayer, time]) => {
                      const prayerStatus = getCurrentPrayerStatus(selectedMasjid.prayerTimes);
                      const isActive = prayerStatus && prayerStatus.prayer.key === prayer;
                      const isUpcoming = prayerStatus && prayerStatus.status === 'upcoming' && prayerStatus.prayer.key === prayer;

                      return (
                        <div
                          key={prayer}
                          className={`flex justify-between items-center p-3 rounded-lg ${isActive ? 'bg-green-100 border-2 border-green-300' :
                            isUpcoming ? 'bg-yellow-100 border-2 border-yellow-300' :
                              'bg-gray-50'
                            }`}
                        >
                          <span className="font-medium text-gray-700 capitalize">
                            {prayer === 'dhuhr' ? 'Dhuhr' : prayer}
                          </span>
                          <div className="text-right">
                            <div className="font-semibold text-gray-800">
                              {formatTime12Hour(time)}
                            </div>
                            {isActive && (
                              <div className="text-xs text-green-700 font-medium">Prayer time now</div>
                            )}
                            {isUpcoming && (
                              <div className="text-xs text-yellow-700 font-medium">
                                In {prayerStatus.timeLeft} min
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Address */}
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-800">Address</p>
                  <p className="text-gray-600 text-sm leading-relaxed">{selectedMasjid.address}</p>
                  {userLocation && (
                    <p className="text-green-600 text-sm font-medium mt-1">
                      {haversineDistance(userLocation, selectedMasjid.location).toFixed(1)} km away
                    </p>
                  )}
                </div>
              </div>

              {/* Phone */}
              {selectedMasjid.phone && (
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-800">Phone</p>
                    <a href={`tel:${selectedMasjid.phone}`} className="text-green-600 hover:underline text-sm">
                      {selectedMasjid.phone}
                    </a>
                  </div>
                </div>
              )}

              {/* Website */}
              {selectedMasjid.website && (
                <div className="flex items-center space-x-3">
                  <Globe className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-800">Website</p>
                    <a href={selectedMasjid.website} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline text-sm">
                      Visit Website
                    </a>
                  </div>
                </div>
              )}

              {/* Description */}
              {selectedMasjid.description && (
                <div>
                  <p className="font-medium text-gray-800 mb-2">About</p>
                  <p className="text-gray-600 text-sm leading-relaxed">{selectedMasjid.description}</p>
                </div>
              )}

              {/* Facilities */}
              {selectedMasjid.facilities && selectedMasjid.facilities.length > 0 && (
                <div>
                  <p className="font-medium text-gray-800 mb-3">Facilities</p>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedMasjid.facilities.map(facility => (
                      <div key={facility} className="flex items-center space-x-2 p-2 bg-green-50 rounded-lg">
                        <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                        <span className="text-sm text-green-700">{facility}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4 border-t border-gray-100">
                {/* Call Button */}
                <button
                  onClick={() => {
                    if (selectedMasjid.phone) {
                      window.open(`tel:${selectedMasjid.phone}`, '_self');
                    }
                  }}
                  className="flex-1 bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 transition-colors font-medium flex items-center justify-center space-x-2"
                  disabled={!selectedMasjid.phone}
                >
                  <Phone className="w-4 h-4" />
                  <span>Call</span>
                </button>

                {/* Directions Button */}
                <button
                  onClick={() => {
                    const url = `https://maps.google.com/maps?daddr=${selectedMasjid.location.lat},${selectedMasjid.location.lng}`;
                    window.open(url, '_blank');
                  }}
                  className="flex-1 bg-emerald-600 text-white py-3 rounded-xl hover:bg-emerald-700 transition-colors font-medium flex items-center justify-center space-x-2"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Directions</span>
                </button>

                <button
                  onClick={() => {
                    setRatingMasjid(selectedMasjid);
                    setRatingModalOpen(true);
                  }}
                  className="flex-1 bg-yellow-500 text-white py-3 rounded-xl hover:bg-green-700 transition-colors font-medium flex items-center justify-center space-x-2"
                >
                  <AiFillStar className="w-4 h-4" />
                  <span>Rate</span>
                </button>

              </div>



            </div>
          </div>
        </div>
      )}



      {/* Add Masjid Modal */}
      {addingMasjid && (
        <AddMasjidModal
          userLocation={userLocation}
          onClose={() => setAddingMasjid(false)}
          onSave={handleMasjidAdd}
        />
      )}

      {/* Prayer Times Editor Modal */}
     {editingPrayerTimes && (
  <SecurePrayerTimesEditor
    masjid={editingPrayerTimes}
    onClose={() => setEditingPrayerTimes(null)}
    onSave={handleMasjidUpdate}
  />
      )}

      <RatingModal
        masjid={ratingMasjid}
        isOpen={ratingModalOpen}
        onClose={() => setRatingModalOpen(false)}
        onRated={(masjidId, rating) => {
          setMasjids((prev) =>
            prev.map((m) =>
              m.id === masjidId
                ? {
                  ...m,
                  rating,
                  reviews: (m.reviews || 0) + 1 // increment reviews count
                }
                : m
            )
          );
        }}
      />

    </div>
  );
};

export default MasjidDashboard;