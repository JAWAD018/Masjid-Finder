import React, { useState, useEffect, useRef } from "react";
import firebase from "../firebase/firebaseService";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { serverTimestamp } from "firebase/firestore";
import { isRamadanInIndia } from "../utils/isRamadanIndia";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const LocationSelector = ({ location, setLocation }) => {
  useMapEvents({
    click(e) {
      setLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return location ? <Marker position={[location.lat, location.lng]} /> : null;
};

const MapResizeFix = () => {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => map.invalidateSize(), 200);
  }, [map]);
  return null;
};

const getAnonUserId = () => {
  let id = localStorage.getItem("anonId");
  if (!id) {
    id = Math.random().toString(36).substring(2, 12);
    localStorage.setItem("anonId", id);
  }
  return id;
};

const PRAYERS = [
  { key: "fajr",    label: "Fajr",     default: "05:30" },
  { key: "dhuhr",   label: "Dhuhr",   default: "12:15" },
  { key: "jummah",  label: "Jummah",  default: "12:30" },
  { key: "asr",     label: "Asr",      default: "15:30" },
  { key: "maghrib", label: "Maghrib",  default: "18:10" },
  { key: "isha",    label: "Isha",     default: "19:25" },
];

const FACILITIES = [
  "Parking",
  "Wudu Area",
  "Prayer Mats",
  "Air Conditioning",
  "Library",
  "Madrasah",
  "Wheelchair Access",
  "Women Section",
];

const SectionHeader = ({ icon, title }) => (
  <div className="amm-section-header">
    <span className="amm-section-icon">{icon}</span>
    <span className="amm-section-title">{title}</span>
  </div>
);

const AddMasjidModal = ({ userLocation, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    userName: "",
    name: "",
    address: "",
    phone: "",
    description: "",
    location: userLocation || { lat: 17.385, lng: 78.486 },
    facilities: [],
    prayerTimes: Object.fromEntries(PRAYERS.map((p) => [p.key, p.default])),
    ramadan: { taraweehTime: "", taraweehParah: 1 },
  });
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const mapRef = useRef();

  const handleSearch = async () => {
    if (!searchText) return;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchText)}&format=json&limit=5`
      );
      const data = await res.json();
      if (data[0]) {
        const loc = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        setFormData((f) => ({ ...f, location: loc }));
        mapRef.current?.setView([loc.lat, loc.lng], 16);
      }
    } catch (err) {
      console.error("Search error:", err);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.address || !formData.location || !formData.userName) {
      alert("Please fill in all required fields and select a location.");
      return;
    }
    setLoading(true);
    try {
      const masjidData = {
        ...formData,
        rating: 0,
        reviews: 0,
        createdBy: getAnonUserId(),
        status: "active",
        createdAt: serverTimestamp(),
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

  const toggleFacility = (f) => {
    setFormData((prev) => ({
      ...prev,
      facilities: prev.facilities.includes(f)
        ? prev.facilities.filter((x) => x !== f)
        : [...prev.facilities, f],
    }));
  };

  return (
    <>
      <style>{`
        .amm-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.55);
          display: flex; align-items: center; justify-content: center;
          padding: 16px; z-index: 1000;
        }
        .amm-modal {
          background: #fff;
          border-radius: 20px;
          width: 100%; max-width: 520px;
          max-height: 92vh;
          display: flex; flex-direction: column;
          overflow: hidden;
          box-shadow: 0 24px 48px rgba(0,0,0,0.18);
        }

        /* Header */
        .amm-header {
          padding: 20px 24px 18px;
          border-bottom: 1px solid #F0F0F0;
          display: flex; align-items: center; justify-content: space-between;
          flex-shrink: 0;
        }
        .amm-header-left { display: flex; align-items: center; gap: 10px; }
        .amm-header-icon {
          width: 36px; height: 36px; border-radius: 10px;
          background: #E1F5EE;
          display: flex; align-items: center; justify-content: center;
          font-size: 18px;
        }
        .amm-header-title { font-size: 17px; font-weight: 600; color: #111; }
        .amm-header-sub { font-size: 12px; color: #888; margin-top: 1px; }
        .amm-close {
          width: 32px; height: 32px; border-radius: 8px;
          border: 1px solid #E8E8E8; background: transparent;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; font-size: 17px; color: #888;
          transition: background 0.15s;
        }
        .amm-close:hover { background: #F5F5F5; color: #333; }

        /* Body */
        .amm-body {
          flex: 1; overflow-y: auto; padding: 20px 24px;
          display: flex; flex-direction: column; gap: 24px;
        }
        .amm-body::-webkit-scrollbar { width: 4px; }
        .amm-body::-webkit-scrollbar-thumb { background: #DDD; border-radius: 4px; }

        /* Section header */
        .amm-section-header {
          display: flex; align-items: center; gap: 7px;
          margin-bottom: 12px;
        }
        .amm-section-icon { font-size: 14px; }
        .amm-section-title {
          font-size: 11px; font-weight: 600; color: #0F6E56;
          text-transform: uppercase; letter-spacing: 0.7px;
        }

        /* Inputs */
        .amm-field { display: flex; flex-direction: column; gap: 5px; margin-bottom: 10px; }
        .amm-field:last-child { margin-bottom: 0; }
        .amm-label {
          font-size: 12px; font-weight: 500; color: #555;
          display: flex; align-items: center; gap: 4px;
        }
        .amm-required {
          font-size: 10px; font-weight: 500; color: #D85A30;
          background: #FEF0EA; padding: 1px 5px; border-radius: 4px;
        }
        .amm-input {
          width: 100%; padding: 9px 12px;
          border: 1px solid #E4E4E4; border-radius: 10px;
          font-size: 14px; color: #111; background: #fff;
          outline: none; transition: border-color 0.15s, box-shadow 0.15s;
          font-family: inherit;
        }
        .amm-input::placeholder { color: #B0B0B0; }
        .amm-input:focus { border-color: #1D9E75; box-shadow: 0 0 0 3px rgba(29,158,117,0.1); }
        textarea.amm-input { resize: vertical; min-height: 72px; line-height: 1.5; }

        .amm-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

        /* Map search */
        .amm-search-row { display: flex; gap: 8px; margin-bottom: 10px; }
        .amm-search-row .amm-input { flex: 1; }
        .amm-search-btn {
          padding: 9px 14px; background:  #43A047; color: #fff;
          border: none; border-radius: 10px;
          font-size: 13px; font-weight: 500; cursor: pointer;
          font-family: inherit; white-space: nowrap; transition: background 0.15s;
        }
        .amm-search-btn:hover { background: #0F6E56; }
        .amm-map-wrap {
          border-radius: 12px; overflow: hidden;
          border: 1px solid #E4E4E4; height: 200px;
        }
        .amm-coords {
          font-size: 11px; color: #999; margin-top: 6px;
          display: flex; align-items: center; gap: 4px;
        }
        .amm-coords::before { content: "📍"; font-size: 11px; }

        /* Prayer time cards */
        .amm-prayer-grid {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;
        }
        .amm-prayer-card {
          background: #F8FDFB; border: 1px solid #D8F0E8;
          border-radius: 12px; padding: 10px 12px;
          display: flex; flex-direction: column; gap: 4px;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .amm-prayer-card:focus-within {
          border-color: #1D9E75; box-shadow: 0 0 0 3px rgba(29,158,117,0.1);
        }
        .amm-prayer-icon-label {
          display: flex; align-items: center; gap: 5px;
          font-size: 11px; font-weight: 600; color: #0F6E56;
          text-transform: uppercase; letter-spacing: 0.5px;
        }
        .amm-prayer-card input[type="time"] {
          border: none; background: transparent; padding: 0;
          font-size: 16px; font-weight: 600; color: #111;
          outline: none; width: 100%; font-family: inherit;
        }

        /* Ramadan */
        .amm-ramadan-wrap {
          background: linear-gradient(135deg, #FFF8E7 0%, #FFF3D4 100%);
          border: 1px solid #F5D88A; border-radius: 12px; padding: 14px 16px;
        }
        .amm-ramadan-title {
          font-size: 13px; font-weight: 600; color: #7A5A00; margin-bottom: 12px;
          display: flex; align-items: center; gap: 6px;
        }

        /* Facilities */
        .amm-facilities-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 6px;
        }
        .amm-facility {
          display: flex; align-items: center; gap: 8px;
          padding: 9px 12px; border-radius: 10px;
          border: 1px solid #E8E8E8; cursor: pointer;
          transition: all 0.15s; user-select: none;
        }
        .amm-facility:hover { background: #F5FBF8; border-color: #A8DECE; }
        .amm-facility.active { background: #E1F5EE; border-color: #5DCAA5; }
        .amm-facility input { display: none; }
        .amm-facility-check {
          width: 16px; height: 16px; border-radius: 5px;
          border: 1.5px solid #CCC; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          font-size: 10px; transition: all 0.15s;
        }
        .amm-facility.active .amm-facility-check {
          background: #1D9E75; border-color: #1D9E75; color: #fff;
        }
        .amm-facility-label { font-size: 13px; color: #333; }
        .amm-facility.active .amm-facility-label { color: #0F6E56; font-weight: 500; }

        /* Footer */
        .amm-footer {
          padding: 14px 24px; border-top: 1px solid #F0F0F0;
          display: flex; gap: 10px; flex-shrink: 0; background: #fff;
        }
        .amm-btn-cancel {
          flex: 1; padding: 11px; border: 1px solid #E0E0E0;
          border-radius: 10px; background: transparent;
          font-size: 14px; color: #666; cursor: pointer;
          font-family: inherit; transition: background 0.15s;
        }
        .amm-btn-cancel:hover { background: #F5F5F5; }
        .amm-btn-submit {
          flex: 2; padding: 11px; border: none;
          border-radius: 10px; background: #43A047;
          font-size: 14px; font-weight: 600; color: #fff;
          cursor: pointer; font-family: inherit;
          display: flex; align-items: center; justify-content: center; gap: 6px;
          transition: background 0.15s;
        }
        .amm-btn-submit:hover:not(:disabled) { background: #0F6E56; }
        .amm-btn-submit:disabled { opacity: 0.65; cursor: not-allowed; }
      `}</style>

      <div className="amm-overlay">
        <div className="amm-modal">

          {/* Header */}
          <div className="amm-header">
            <div className="amm-header-left">
              <div className="amm-header-icon">🕌</div>
              <div>
                <div className="amm-header-title">Add new masjid</div>
                <div className="amm-header-sub">Help the community find this place</div>
              </div>
            </div>
            <button className="amm-close" onClick={onClose} aria-label="Close">✕</button>
          </div>

          {/* Scrollable body */}
          <div className="amm-body">

            {/* Basic Info */}
            <div>
              <SectionHeader title="Basic information" />

              <div className="amm-field">
                <label className="amm-label">
                  Your name <span className="amm-required">required</span>
                </label>
                <input
                  className="amm-input"
                  type="text"
                  placeholder="e.g. Abdul Rahman"
                  value={formData.userName}
                  onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                />
              </div>

              <div className="amm-row">
                <div className="amm-field">
                  <label className="amm-label">
                    Masjid name <span className="amm-required">required</span>
                  </label>
                  <input
                    className="amm-input"
                    type="text"
                    placeholder="e.g. Masjid Al-Noor"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="amm-field">
                  <label className="amm-label">Phone number</label>
                  <input
                    className="amm-input"
                    type="text"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="amm-field">
                <label className="amm-label">
                  Address <span className="amm-required">required</span>
                </label>
                <textarea
                  className="amm-input"
                  placeholder="Street, area, city, PIN code…"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <SectionHeader title="Location" />
              <div className="amm-search-row">
                <input
                  className="amm-input"
                  type="text"
                  placeholder="Search an address…"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                <button className="amm-search-btn" onClick={handleSearch}>
                  Search
                </button>
              </div>
              <div className="amm-map-wrap">
                <MapContainer
                  center={[formData.location.lat, formData.location.lng]}
                  zoom={13}
                  scrollWheelZoom
                  style={{ height: "100%", width: "100%" }}
                  whenCreated={(map) => (mapRef.current = map)}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <LocationSelector
                    location={formData.location}
                    setLocation={(loc) => setFormData({ ...formData, location: loc })}
                  />
                  <MapResizeFix />
                </MapContainer>
              </div>
              {formData.location && (
                <div className="amm-coords">
                  {formData.location.lat.toFixed(5)}, {formData.location.lng.toFixed(5)}
                </div>
              )}
            </div>

            {/* Prayer Times */}
            <div>
              <SectionHeader title="Prayer times" />
              <div className="amm-prayer-grid">
                {PRAYERS.map(({ key, label, icon }) => (
                  <div className="amm-prayer-card" key={key}>
                    <div className="amm-prayer-icon-label">
                      <span>{icon}</span> {label}
                    </div>
                    <input
                      type="time"
                      value={formData.prayerTimes[key]}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          prayerTimes: { ...formData.prayerTimes, [key]: e.target.value },
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Ramadan (conditional) */}
            {isRamadanInIndia() && (
              <div>
                <SectionHeader icon="🌙" title="Ramadan" />
                <div className="amm-ramadan-wrap">
                  <div className="amm-ramadan-title">🌙 Taraweeh details</div>
                  <div className="amm-row">
                    <div className="amm-field">
                      <label className="amm-label">Taraweeh time</label>
                      <input
                        className="amm-input"
                        type="time"
                        value={formData.ramadan.taraweehTime}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            ramadan: { ...formData.ramadan, taraweehTime: e.target.value },
                          })
                        }
                      />
                    </div>
                    <div className="amm-field">
                      <label className="amm-label">Parah per night</label>
                      <select
                        className="amm-input"
                        value={formData.ramadan.taraweehParah}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            ramadan: { ...formData.ramadan, taraweehParah: Number(e.target.value) },
                          })
                        }
                      >
                        {Array.from({ length: 30 }, (_, i) => (
                          <option key={i + 1} value={i + 1}>{i + 1} Parah</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Facilities */}
            <div>
              <SectionHeader title="Facilities" />
              <div className="amm-facilities-grid">
                {FACILITIES.map((f) => {
                  const active = formData.facilities.includes(f);
                  return (
                    <div
                        key={f}
                        className={`amm-facility${active ? " active" : ""}`}
                        onClick={() => toggleFacility(f)}
                      >
                      <input type="checkbox" readOnly checked={active} />
                      <div className="amm-facility-check">{active ? "✓" : ""}</div>
                      <span className="amm-facility-label">{f}</span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="amm-footer">
            <button className="amm-btn-cancel" onClick={onClose}>Cancel</button>
            <button
              className="amm-btn-submit"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Adding…" : "✓ Add masjid"}
            </button>
          </div>

        </div>
      </div>
    </>
  );
};

export default AddMasjidModal;