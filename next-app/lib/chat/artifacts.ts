import type { MapArtifact } from '@/types/chat';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const toNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
};

export const mapArtifactFromUnknown = (value: unknown): MapArtifact | null => {
  if (!isRecord(value)) return null;

  const center = isRecord(value.center) ? value.center : value;
  const lat = toNumber(center.lat);
  const lng = toNumber(center.lng);
  if (lat === null || lng === null) return null;

  const markersRaw = Array.isArray(value.markers) ? value.markers : [];
  const markers = markersRaw
    .map((item, index) => {
      if (!isRecord(item)) return null;
      const markerLat = toNumber(item.lat);
      const markerLng = toNumber(item.lng);
      if (markerLat === null || markerLng === null) return null;

      return {
        id: String(item.id ?? index),
        lat: markerLat,
        lng: markerLng,
        label: typeof item.label === 'string' ? item.label : undefined,
      };
    })
    .filter((marker): marker is NonNullable<typeof marker> => marker !== null);

  return {
    title: typeof value.title === 'string' ? value.title : undefined,
    center: { lat, lng },
    zoom: toNumber(value.zoom) ?? 13,
    markers,
  };
};
