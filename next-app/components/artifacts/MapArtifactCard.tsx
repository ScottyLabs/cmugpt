'use client';

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import type { MapArtifact } from '@/types/chat';

export function MapArtifactCard({ artifact }: { artifact: MapArtifact }) {
  const nodeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!nodeRef.current) return;

    const map = new maplibregl.Map({
      container: nodeRef.current,
      style: 'https://demotiles.maplibre.org/style.json',
      center: [artifact.center.lng, artifact.center.lat],
      zoom: artifact.zoom ?? 12,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');

    for (const marker of artifact.markers ?? []) {
      const popup = marker.label ? new maplibregl.Popup().setText(marker.label) : undefined;
      new maplibregl.Marker({ color: '#0d8f6f' })
        .setLngLat([marker.lng, marker.lat])
        .setPopup(popup)
        .addTo(map);
    }

    return () => map.remove();
  }, [artifact]);

  return (
    <section
      style={{
        marginTop: 10,
        border: '1px solid var(--border)',
        borderRadius: 12,
        overflow: 'hidden',
        background: '#ffffff',
      }}
    >
      <header style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: 13 }}>
        {artifact.title ?? 'Map Result'}
      </header>
      <div ref={nodeRef} style={{ height: 320, width: '100%' }} />
    </section>
  );
}
