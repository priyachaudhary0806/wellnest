import React, { useState, useEffect } from 'react';
import { locationService } from '../services/locationService';
import { useAccessibility } from '../context/AccessibilityContext';
import { LeafletMap } from '../components/LeafletMap';
import { Navigation, MapPin, Volume2, ArrowRight, ArrowLeft, Compass } from 'lucide-react';

export const TravelAssistant = () => {
  const { speak, triggerHaptic } = useAccessibility();
  const [currentLoc, setCurrentLoc] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [places, setPlaces] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [navSteps, setNavSteps] = useState([]);
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  useEffect(() => {
    fetchLocation();

    const handleVoiceCmd = (e) => {
      const { intent, destination, query } = e.detail || {};
      if (intent === 'NAVIGATE_TO' && destination) {
        handleVoiceNavigate(destination);
      }
      if (intent === 'SEARCH_PLACE' && query) {
        handleVoiceSearch(query);
      }
    };

    window.addEventListener('wellnest-voice-cmd', handleVoiceCmd);
    return () => window.removeEventListener('wellnest-voice-cmd', handleVoiceCmd);
  }, []);

  const handleVoiceNavigate = (destination) => {
    const allPlaces = locationService.getNearbyPlaces('all');
    const match = allPlaces.find(p => p.name.toLowerCase().includes(destination.toLowerCase()));
    if (match) {
      handleStartNavigation(match);
    } else {
      speak(`Could not find ${destination} in nearby places. Showing all places.`, true);
      setPlaces(allPlaces);
    }
  };

  const handleVoiceSearch = (query) => {
    const allPlaces = locationService.getNearbyPlaces('all');
    const results = allPlaces.filter(p =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.category?.toLowerCase().includes(query.toLowerCase())
    );
    if (results.length > 0) {
      setPlaces(results);
      speak(`Found ${results.length} results for ${query}. ${results[0].name} is nearest.`, true);
    } else {
      speak(`No results found for ${query}.`, true);
    }
  };

  const fetchLocation = async () => {
    const loc = await locationService.getCurrentLocation();
    setCurrentLoc(loc);
    speak(loc.spokenLocation, false);

    const foundPlaces = locationService.getNearbyPlaces(activeCategory);
    setPlaces(foundPlaces);
  };

  const handleCategoryChange = (catId) => {
    triggerHaptic();
    setActiveCategory(catId);
    const updated = locationService.getNearbyPlaces(catId);
    setPlaces(updated);
    speak(`Filtered by ${catId}`, true);
  };

  const handleStartNavigation = (place) => {
    triggerHaptic('medium');
    setSelectedPlace(place);
    const steps = locationService.getNavigationSteps(place.name);
    setNavSteps(steps);
    setActiveStepIndex(0);

    speak(`Navigating to ${place.name}. Step 1: ${steps[0].text}`, true);
  };

  const handleNextStep = () => {
    if (activeStepIndex < navSteps.length - 1) {
      triggerHaptic('medium');
      const nextIdx = activeStepIndex + 1;
      setActiveStepIndex(nextIdx);
      const step = navSteps[nextIdx];
      speak(`Step ${nextIdx + 1}: ${step.text}`, true);
    }
  };

  const handlePrevStep = () => {
    if (activeStepIndex > 0) {
      triggerHaptic();
      const prevIdx = activeStepIndex - 1;
      setActiveStepIndex(prevIdx);
      const step = navSteps[prevIdx];
      speak(`Step ${prevIdx + 1}: ${step.text}`, true);
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.25rem', paddingBottom: '2.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.65rem', color: 'var(--text-primary)', fontWeight: 800 }}>
          Travel Assistant
        </h1>
        <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
          GPS location tracking & audio directions
        </p>
      </div>

      {/* Search Box */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          type="text"
          className="form-input"
          placeholder='Search place or say "navigate to hospital"'
          id="travel-search"
          style={{ flex: 1, fontSize: '1rem' }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const query = e.target.value.trim();
              if (query) handleVoiceSearch(query);
            }
          }}
        />
        <button
          className="btn-primary"
          onClick={() => {
            const input = document.getElementById('travel-search');
            if (input?.value.trim()) handleVoiceSearch(input.value.trim());
          }}
          style={{ minWidth: '80px', justifyContent: 'center' }}
        >
          Search
        </button>
      </div>

      {/* Current Location Box */}
      {currentLoc && (
        <div className="card" style={{
          display: 'flex',
          alignItems: 'center',
          justify: 'space-between',
          padding: '1.25rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-light)',
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
              color: 'var(--accent-primary)',
              flexShrink: 0
            }}>
              <MapPin size={26} />
            </div>
            <div>
              <h4 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', fontWeight: 800 }}>
                {currentLoc.address}
              </h4>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
                ABESIT Campus Area
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              triggerHaptic();
              speak(currentLoc.spokenLocation, true);
            }}
            className="btn-secondary"
            aria-label="Announce location"
            style={{ padding: '0.5rem' }}
          >
            <Volume2 size={22} color="var(--accent-primary)" />
          </button>
        </div>
      )}

      {/* Leaflet Map */}
      {currentLoc && (
        <LeafletMap
          center={[currentLoc.lat, currentLoc.lng]}
          markers={selectedPlace ? [selectedPlace] : places}
          height="220px"
        />
      )}

      {/* Active Navigation Directive */}
      {selectedPlace && navSteps.length > 0 && (
        <div className="card fade-in" style={{ border: '2px solid var(--accent-primary)', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
              Step {activeStepIndex + 1} of {navSteps.length}
            </span>
            <button
              onClick={() => {
                triggerHaptic();
                setSelectedPlace(null);
                speak("Navigation ended.", true);
              }}
              style={{ fontSize: '1rem', color: 'var(--danger)', fontWeight: 700 }}
            >
              Exit Navigation
            </button>
          </div>

          <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: 800 }}>
            {selectedPlace.name}
          </h3>

          <div style={{
            backgroundColor: 'var(--bg-app)',
            padding: '1.25rem',
            borderRadius: 'var(--radius-md)',
            borderLeft: '4px solid var(--accent-primary)',
            margin: '1rem 0'
          }}>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-primary)', fontWeight: 800, lineHeight: 1.4 }}>
              "{navSteps[activeStepIndex].text}"
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              className="btn-secondary"
              onClick={handlePrevStep}
              disabled={activeStepIndex === 0}
              style={{ flex: 1, justifyContent: 'center', opacity: activeStepIndex === 0 ? 0.4 : 1 }}
            >
              <ArrowLeft size={20} />
              <span>Previous</span>
            </button>

            <button
              className="btn-primary"
              onClick={handleNextStep}
              disabled={activeStepIndex === navSteps.length - 1}
              style={{ flex: 1, justifyContent: 'center', opacity: activeStepIndex === navSteps.length - 1 ? 0.4 : 1 }}
            >
              <span>Next</span>
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Category Filters */}
      <div style={{ display: 'flex', gap: '0.6rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
        {[
          { id: 'all', label: 'All' },
          { id: 'bus', label: 'Bus & Metro' },
          { id: 'hospitals', label: 'Hospitals' },
          { id: 'groceries', label: 'Stores' },
          { id: 'pharmacies', label: 'Pharmacies' }
        ].map(cat => (
          <button
            key={cat.id}
            onClick={() => handleCategoryChange(cat.id)}
            style={{
              flexShrink: 0,
              padding: '0.6rem 1rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '1rem',
              fontWeight: 700,
              backgroundColor: activeCategory === cat.id ? 'var(--accent-primary)' : 'var(--bg-card)',
              color: activeCategory === cat.id ? '#ffffff' : 'var(--text-primary)',
              border: '1.5px solid var(--border-color)'
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Places List */}
      <div>
        <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: 800, marginBottom: '0.75rem' }}>
          Places for Navigation ({places.length})
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {places.map((place) => (
            <div
              key={place.id}
              className="card card-interactive"
              style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}
            >
              <div>
                <h4 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', fontWeight: 800 }}>
                  {place.name}
                </h4>
                <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  {place.address} • {place.distanceKm} km
                </p>
              </div>

              <button
                className="btn-primary"
                onClick={() => handleStartNavigation(place)}
                aria-label={`Start turn guidance to ${place.name}`}
                style={{ width: '100%', justifyContent: 'center', fontSize: '1.05rem' }}
              >
                <Navigation size={20} />
                <span>Start Voice Directions</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
