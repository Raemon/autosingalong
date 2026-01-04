'use client';
import React, { useState, useMemo, useCallback, useRef, useEffect, Suspense } from 'react';
import SolsticeGlobe3D from './SolsticeGlobe3D';
import { SolsticeGlobePoint } from './types';
import { ProgramsPopup } from './ProgramsPopup';
import type { ProgramWithLocation } from '../../lib/programLocations';
import { groupProgramsByLocation } from '../../lib/programLocations';

const MIN_BANNER_WIDTH = 1100;

type LocationGroup = {
  city: string;
  lat: number;
  lng: number;
  programs: ProgramWithLocation[];
};

function ProgramGlobeBannerInner() {
  const [shouldRender, setShouldRender] = useState(false);
  const [selectedLocationKey, setSelectedLocationKey] = useState<string | null>(null);
  const [popupCoords, setPopupCoords] = useState<{ x: number; y: number } | null>(null);
  const markerClickInProgressRef = useRef(false);
  const [isHidden, setIsHidden] = useState(false);
  const [programs, setPrograms] = useState<ProgramWithLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const checkWidth = () => {
      setShouldRender(window.innerWidth >= MIN_BANNER_WIDTH);
    };
    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  useEffect(() => {
    async function fetchPrograms() {
      try {
        const response = await fetch('/api/programs/with-locations');
        if (!response.ok) throw new Error('Failed to fetch programs');
        const data = await response.json();
        setPrograms(data.programs || []);
      } catch (error) {
        console.error('Error fetching programs:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchPrograms();
  }, []);

  const defaultPointOfView = useMemo(() => ({
    lat: 20,
    lng: -70,
    altitude: 2.2
  }), []);

  // Group programs by location
  const locationGroups = useMemo((): LocationGroup[] => {
    const grouped = groupProgramsByLocation(programs);
    const groups: LocationGroup[] = [];
    for (const [key, progs] of grouped) {
      if (progs.length > 0) {
        groups.push({
          city: progs[0].city,
          lat: progs[0].lat,
          lng: progs[0].lng,
          programs: progs,
        });
      }
    }
    return groups;
  }, [programs]);

  const selectedGroup = useMemo(() => {
    if (!selectedLocationKey) return null;
    return locationGroups.find(g => `${g.lat},${g.lng}` === selectedLocationKey) || null;
  }, [selectedLocationKey, locationGroups]);

  const pointsData = useMemo(() => {
    return locationGroups.map((group) => ({
      lat: group.lat,
      lng: group.lng,
      size: Math.min(0.5 + group.programs.length * 0.1, 1.5), // Size based on program count
      eventId: `${group.lat},${group.lng}`,
      event: group,
    }));
  }, [locationGroups]);

  const handleMarkerClick = useCallback((event?: React.MouseEvent<HTMLDivElement>, locationKey?: string, screenCoords?: { x: number; y: number }) => {
    event?.stopPropagation();
    event?.preventDefault();
    if (locationKey) {
      markerClickInProgressRef.current = true;
      setSelectedLocationKey(locationKey);
      setPopupCoords(screenCoords || { x: window.innerWidth / 2, y: window.innerHeight / 2 });
      setTimeout(() => {
        markerClickInProgressRef.current = false;
      }, 0);
    } else {
      if (!markerClickInProgressRef.current) {
        setSelectedLocationKey(null);
        setPopupCoords(null);
      }
    }
  }, []);

  if (isHidden || !shouldRender) {
    return null;
  }

  return (
    <div className="fixed top-0 right-0 w-[50vw] h-full hidden min-[1100px]:block pointer-events-none z-[1] overflow-hidden">
      {/* Overlay that fades in on scroll */}
      <div className="absolute top-0 right-0 w-screen h-full bg-black opacity-0 z-10 pointer-events-none" />
      
      {/* Gradient overlay */}
      <div 
        className="absolute top-0 right-0 h-full z-[1] pointer-events-none transition-opacity duration-300"
        style={{
          width: '50vw',
          background: 'linear-gradient(to left, transparent 50%, black 100%)',
        }}
      />
      
      {/* Content blocking rect - allows clicks through to content on left */}
      <div 
        className="absolute top-0 h-full z-[5] pointer-events-none"
        style={{ width: '45vw', right: '55vw' }}
      />
      
      {/* Background */}
      <div 
        className="absolute top-0 right-0 w-[50vw] h-full pointer-events-none"
        style={{ background: 'linear-gradient(to left, black 50%, transparent 70%)' }}
      />
      
      {/* Globe container */}
      <div className="absolute top-0 right-0 w-full h-[calc(100vh+120px)] transition-opacity duration-300 z-0 pointer-events-auto">
        <SolsticeGlobe3D 
          pointsData={pointsData}
          defaultPointOfView={defaultPointOfView}
          onPointClick={(point: SolsticeGlobePoint, screenCoords: { x: number; y: number }) => handleMarkerClick(undefined, point.eventId, screenCoords)}
          onClick={(event) => handleMarkerClick(event, undefined)}
          style={{ width: '100%', height: '100%' }}
        />
        
        {selectedLocationKey && popupCoords && selectedGroup && (
          <ProgramsPopup
            programs={selectedGroup.programs}
            city={selectedGroup.city}
            screenCoords={popupCoords}
            onClose={() => {
              setSelectedLocationKey(null);
              setPopupCoords(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

export const ProgramGlobeBanner = () => {
  return (
    <Suspense fallback={null}>
      <ProgramGlobeBannerInner />
    </Suspense>
  );
};

export default ProgramGlobeBanner;