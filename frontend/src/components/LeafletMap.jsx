import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

export const LeafletMap = ({ center = [28.6337, 77.4472], markers = [], height = '220px' }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Initialize map instance
      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: false
      }).setView(center, 14);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
      }).addTo(map);

      mapInstanceRef.current = map;
    } else {
      mapInstanceRef.current.setView(center, 14);
    }

    const map = mapInstanceRef.current;

    // Clear existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    // Add user marker
    const userIcon = L.divIcon({
      className: 'custom-user-pin',
      html: `<div style="background-color: #3b82f6; width: 18px; height: 18px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 0 10px #3b82f6;"></div>`,
      iconSize: [24, 24]
    });
    L.marker(center, { icon: userIcon }).addTo(map).bindPopup('<b>You are here</b>');

    // Add places markers
    markers.forEach(m => {
      if (m.lat && m.lng) {
        const placeIcon = L.divIcon({
          className: 'custom-place-pin',
          html: `<div style="background-color: ${m.category === 'hospitals' ? '#ef4444' : '#f59e0b'}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid #ffffff;"></div>`,
          iconSize: [18, 18]
        });
        L.marker([m.lat, m.lng], { icon: placeIcon })
          .addTo(map)
          .bindPopup(`<b>${m.name}</b><br/>${m.distanceKm} km away`);
      }
    });
  }, [center, markers]);

  return (
    <div
      ref={mapContainerRef}
      style={{
        width: '100%',
        height: height,
        borderRadius: 'var(--radius-lg)',
        border: '2px solid var(--border-color)',
        overflow: 'hidden',
        zIndex: 1
      }}
      aria-label="Interactive Accessible Map view showing nearby locations"
    />
  );
};
