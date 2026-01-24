import { useEffect, useState } from "react";

const SEHRI_BUFFER_MIN = 10;

export default function useRamadanTimes(userLocation) {
  const [ramadanTimes, setRamadanTimes] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userLocation?.lat || !userLocation?.lng) return;

    const fetchTimes = async () => {
      try {
        const res = await fetch(
          `https://api.aladhan.com/v1/timings?latitude=${userLocation.lat}&longitude=${userLocation.lng}&method=2&school=1`
        );

        const json = await res.json();
        const timings = json.data.timings;

        const [fH, fM] = timings.Fajr.split(":").map(Number);
        const sehriMin = fH * 60 + fM - SEHRI_BUFFER_MIN;

        setRamadanTimes({
          sehriEnd: `${String(Math.floor(sehriMin / 60)).padStart(2, "0")}:${String(sehriMin % 60).padStart(2, "0")}`,
          iftar: timings.Maghrib,
        });
      } catch (err) {
        console.error("Ramadan API error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTimes();
  }, [userLocation?.lat, userLocation?.lng]);

  return { ramadanTimes, loading };
}
