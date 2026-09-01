/* =========================================================
   LOCATION SERVICE
   AOI polygon -> center coordinates -> real location
========================================================= */

/* ---------------------------------------------------------
   PARSE LOCATION
--------------------------------------------------------- */
export function parseLocation(value) {
  if (!value) return null;

  if (typeof value === "string") {
    const text = value.trim();

    if (!text) return null;

    // JSON string
    if (text.startsWith("{") || text.startsWith("[")) {
      try {
        return parseLocation(JSON.parse(text));
      } catch {
        return null;
      }
    }

    // IMPORTANT:
    // These are not real locations
    const invalidLocations = [
      "location unavailable",
      "location not available",
      "location lookup unavailable",
      "location could not be determined",
      "unable to determine location",
      "null",
      "undefined",
    ];

    if (invalidLocations.includes(text.toLowerCase())) {
      return null;
    }

    return text;
  }

  if (typeof value === "object") {
    return (
      parseLocation(value.display_name) ||
      parseLocation(value.name) ||
      parseLocation(value.city) ||
      parseLocation(value.town) ||
      parseLocation(value.village) ||
      parseLocation(value.municipality) ||
      parseLocation(value.district) ||
      parseLocation(value.state) ||
      parseLocation(value.location)
    );
  }

  return null;
}

/* ---------------------------------------------------------
   EXTRACT POLYGON COORDINATES
--------------------------------------------------------- */
export function extractCoordinates(value) {
  if (!value) return [];

  let data = value;

  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch {
      return [];
    }
  }

  // GeoJSON Feature
  if (data?.type === "Feature") {
    data = data.geometry;
  }

  // GeoJSON Polygon
  if (
    data?.type === "Polygon" &&
    Array.isArray(data.coordinates)
  ) {
    return data.coordinates[0] || [];
  }

  // GeoJSON MultiPolygon
  if (
    data?.type === "MultiPolygon" &&
    Array.isArray(data.coordinates)
  ) {
    return data.coordinates?.[0]?.[0] || [];
  }

  // [{lat, lng}, ...]
  if (Array.isArray(data)) {
    const latLngPoints = data
      .filter(
        (point) =>
          point &&
          typeof point === "object" &&
          Number.isFinite(Number(point.lat)) &&
          Number.isFinite(Number(point.lng))
      )
      .map((point) => [
        Number(point.lng),
        Number(point.lat),
      ]);

    if (latLngPoints.length > 0) {
      return latLngPoints;
    }

    // [[lng, lat], ...]
    if (
      Array.isArray(data[0]) &&
      typeof data[0][0] === "number"
    ) {
      return data;
    }

    // [[[lng, lat], ...]]
    if (
      Array.isArray(data[0]) &&
      Array.isArray(data[0][0])
    ) {
      return data[0];
    }
  }

  return [];
}

/* ---------------------------------------------------------
   GET CENTER OF AOI
--------------------------------------------------------- */
export function getPolygonCenter(polygon) {
  const coordinates = extractCoordinates(polygon);

  if (!coordinates.length) {
    return null;
  }

  let lngTotal = 0;
  let latTotal = 0;
  let count = 0;

  coordinates.forEach((point) => {
    if (
      Array.isArray(point) &&
      point.length >= 2 &&
      Number.isFinite(Number(point[0])) &&
      Number.isFinite(Number(point[1]))
    ) {
      lngTotal += Number(point[0]);
      latTotal += Number(point[1]);
      count++;
    }
  });

  if (!count) return null;

  return {
    lat: latTotal / count,
    lng: lngTotal / count,
  };
}

/* ---------------------------------------------------------
   REVERSE GEOCODING
--------------------------------------------------------- */
export async function reverseGeocode(lat, lng) {
  try {
    if (
      !Number.isFinite(Number(lat)) ||
      !Number.isFinite(Number(lng))
    ) {
      return null;
    }

    const url =
      `https://nominatim.openstreetmap.org/reverse` +
      `?format=jsonv2` +
      `&lat=${encodeURIComponent(lat)}` +
      `&lon=${encodeURIComponent(lng)}` +
      `&zoom=10` +
      `&addressdetails=1`;

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.warn(
        "Reverse geocoding HTTP error:",
        response.status
      );
      return null;
    }

    const data = await response.json();

    const address = data?.address || {};

    const place =
      address.city ||
      address.town ||
      address.village ||
      address.municipality ||
      address.county ||
      address.district;

    const state = address.state;

    if (place && state) {
      return `${place}, ${state}`;
    }

    if (place) {
      return place;
    }

    if (state) {
      return state;
    }

    return parseLocation(data?.display_name);
  } catch (error) {
    console.warn(
      "Reverse geocoding failed:",
      error
    );

    return null;
  }
}

/* ---------------------------------------------------------
   GET PROJECT LOCATION

   Priority:
   1. projects.location
   2. aoi_records.location
   3. AOI polygon -> reverse geocoding
--------------------------------------------------------- */
export async function getProjectLocation(
  project,
  aoi
) {
  // 1. Project location
  let location = parseLocation(
    project?.location
  );

  if (location) {
    return location;
  }

  // 2. AOI location
  location = parseLocation(
    aoi?.location
  );

  if (location) {
    return location;
  }

  // 3. AOI polygon
  if (aoi?.polygon) {
    const center = getPolygonCenter(
      aoi.polygon
    );

    if (center) {
      console.log(
        "🌍 Reverse geocoding:",
        center.lat,
        center.lng
      );

      return await reverseGeocode(
        center.lat,
        center.lng
      );
    }
  }

  return null;
}