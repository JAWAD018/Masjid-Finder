import React, { useState, useEffect, useRef } from "react";
import firebase from "../firebase/firebaseService";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import {  Clock } from "react-feather";
import { X } from "react-feather";
import "leaflet/dist/leaflet.css";

// Fix Leaflet marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Select location by clicking
const LocationSelector = ({ location, setLocation }) => {
  useMapEvents({
    click(e) {
      setLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return location ? <Marker position={[location.lat, location.lng]} /> : null;
};

// Fix Leaflet resize inside modal
const MapResizeFix = () => {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => map.invalidateSize(), 200);
  }, [map]);
  return null;
};

const AddMasjidModal = ({ userLocation, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    website: "",
    description: "",
    location: userLocation || { lat: 17.385, lng: 78.486 },
    facilities: [],
    prayerTimes: {
      fajr: "05:30",
      dhuhr: "12:15",
      jummah: "12:30", // Added Jummah prayer
      asr: "15:30",
      maghrib: "18:10",
      isha: "19:25",
    },
  });
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const mapRef = useRef();

  const facilitiesList = [
    "Parking",
    "Wudu Area",
    "Prayer Mats",
    "Air Conditioning",
    "Library",
    "Madrasah",
    "Wheelchair Access",
    "Women Section",
  ];

  // Search using OpenStreetMap Nominatim
  const handleSearch = async () => {
    if (!searchText) return;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchText)}&format=json&limit=5`
      );
      const data = await res.json();
      if (data[0]) {
        const loc = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        setFormData({ ...formData, location: loc });
        mapRef.current?.setView([loc.lat, loc.lng], 16);
      }
    } catch (err) {
      console.error("Search error:", err);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.address || !formData.location) {
      alert("Please fill in required fields and select a location");
      return;
    }

    setLoading(true);
    try {
      // Anyone can add, use anonymous id
      const anonymousId = localStorage.getItem("anonId") || Math.random().toString(36).substring(2, 10);
      localStorage.setItem("anonId", anonymousId);

      const masjidData = {
        ...formData,
        rating: 0,
        reviews: 0,
        createdBy: anonymousId,
        status: "active",
      };

      const docRef = await firebase.addDoc("masjids", masjidData);
      onSave({ id: docRef.id, ...masjidData });
      onClose();
    } catch (err) {
      console.error("Error adding masjid:", err);
      alert("Error adding masjid. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[95vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-white p-6 border-b z-10 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Add New Masjid</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="p-6 space-y-6 overflow-auto flex-1">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Basic Information</h3>
            <input
              type="text"
              placeholder="Masjid Name *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
            <textarea
              placeholder="Address *"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              rows={2}
            />
          </div>

          {/* Map + Search */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-2">Select Location *</h3>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Search address..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-lg"
              />
              <button onClick={handleSearch} className="px-3 py-2 bg-green-600 text-white rounded-lg">
                Search
              </button>
            </div>
            <div className="w-full h-64 md:h-80 rounded-lg overflow-hidden">
              <MapContainer
                center={formData.location}
                zoom={13}
                scrollWheelZoom
                style={{ height: "100%", width: "100%" }}
                whenCreated={(map) => (mapRef.current = map)}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <LocationSelector location={formData.location} setLocation={(loc) => setFormData({ ...formData, location: loc })} />
                <MapResizeFix />
              </MapContainer>
            </div>
            {formData.location && (
              <p className="text-sm text-gray-600 mt-2">
                Selected: {formData.location.lat.toFixed(5)}, {formData.location.lng.toFixed(5)}
              </p>
            )}
          </div>

          {/* Prayer Times */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 flex items-center gap-2">
              <Clock className="w-5 h-5 text-green-600" /> Prayer Times
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(formData.prayerTimes).map(([prayer, time]) => (
                <div key={prayer}>
                  <label className="capitalize">{prayer}</label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        prayerTimes: { ...formData.prayerTimes, [prayer]: e.target.value },
                      })
                    }
                    className="w-full px-2 py-1 border rounded-lg"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Facilities */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-2">Facilities</h3>
            <div className="grid grid-cols-2 gap-2">
              {facilitiesList.map((f) => (
                <label
                  key={f}
                  className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formData.facilities.includes(f)}
                    onChange={(e) => {
                      if (e.target.checked) setFormData({ ...formData, facilities: [...formData.facilities, f] });
                      else setFormData({ ...formData, facilities: formData.facilities.filter((fac) => fac !== f) });
                    }}
                    className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">{f}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button onClick={onClose} className="flex-1 px-6 py-2 border rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              {loading ? "Adding..." : "Add Masjid"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddMasjidModal;
