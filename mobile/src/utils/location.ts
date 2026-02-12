import * as Location from 'expo-location';

/**
 * Request location permissions
 */
export const requestLocationPermission = async (): Promise<boolean> => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
};

/**
 * Get current location
 */
export const getCurrentLocation = async (): Promise<Location.LocationObject | null> => {
  try {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      return null;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return location;
  } catch (error) {
    console.error('Error getting location:', error);
    return null;
  }
};

/**
 * Get coordinates as [longitude, latitude] tuple
 */
export const getCoordinates = async (): Promise<[number, number] | null> => {
  const location = await getCurrentLocation();
  if (!location) {
    return null;
  }
  return [location.coords.longitude, location.coords.latitude];
};

/**
 * Calculate distance between two coordinate pairs in kilometers
 */
export const calculateDistance = (
  coords1: [number, number],
  coords2: [number, number]
): number => {
  const [lon1, lat1] = coords1;
  const [lon2, lat2] = coords2;

  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c * 10) / 10; // Round to 1 decimal place
};

const toRad = (deg: number): number => deg * (Math.PI / 180);

/**
 * Format distance for display
 */
export const formatDistance = (distanceKm: number): string => {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  }
  return `${distanceKm.toFixed(1)}km`;
};

/**
 * Get address from coordinates (reverse geocoding)
 */
export const getAddressFromCoordinates = async (
  latitude: number,
  longitude: number
): Promise<string | null> => {
  try {
    const addresses = await Location.reverseGeocodeAsync({
      latitude,
      longitude,
    });

    if (addresses.length > 0) {
      const address = addresses[0];
      const parts = [
        address.streetNumber,
        address.street,
        address.city,
        address.region,
      ].filter(Boolean);
      return parts.join(', ');
    }

    return null;
  } catch (error) {
    console.error('Error getting address:', error);
    return null;
  }
};

/**
 * Get coordinates from address (geocoding)
 */
export const getCoordinatesFromAddress = async (
  address: string
): Promise<[number, number] | null> => {
  try {
    const locations = await Location.geocodeAsync(address);

    if (locations.length > 0) {
      const { longitude, latitude } = locations[0];
      return [longitude, latitude];
    }

    return null;
  } catch (error) {
    console.error('Error geocoding address:', error);
    return null;
  }
};

/**
 * Watch location changes
 */
export const watchLocation = async (
  callback: (location: Location.LocationObject) => void
): Promise<Location.LocationSubscription | null> => {
  try {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      return null;
    }

    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 10000, // Update every 10 seconds
        distanceInterval: 50, // Or when moved 50 meters
      },
      callback
    );

    return subscription;
  } catch (error) {
    console.error('Error watching location:', error);
    return null;
  }
};
