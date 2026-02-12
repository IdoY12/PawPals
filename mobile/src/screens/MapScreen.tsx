import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  ScrollView,
  Platform,
  Dimensions,
} from 'react-native';
import MapView, { Region, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation } from '@apollo/client';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import {
  GET_NEARBY_AVAILABLE_SITTERS,
  GET_NEARBY_REQUESTS,
  GET_NEARBY_USERS,
} from '../graphql/queries';
import { UPDATE_LOCATION } from '../graphql/mutations';
import { UserMarker, RequestMarker } from '../components/MapMarker';
import { UserCard } from '../components/UserCard';
import { RequestCard } from '../components/RequestCard';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS, MAP_STYLE } from '../constants/theme';
import { User, Request, RootStackParamList } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const RADIUS_OPTIONS = [1, 5, 10, 20];
const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const MapScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const { coordinates, isLoading: locationLoading } = useLocation();
  const mapRef = useRef<MapView>(null);

  const [selectedRadius, setSelectedRadius] = useState(10);
  const [showList, setShowList] = useState(false);

  const isOwner = user?.userType === 'owner';

  // Auto-update user location in backend when GPS coordinates change
  const [updateLocationMutation] = useMutation(UPDATE_LOCATION);
  const locationUpdatedRef = useRef(false);

  useEffect(() => {
    if (coordinates && !locationUpdatedRef.current) {
      locationUpdatedRef.current = true;
      updateLocationMutation({
        variables: {
          location: { coordinates },
        },
      }).catch((err: any) => console.log('Location update:', err.message));
    }
  }, [coordinates]);

  // For owners: fetch sitters (both available via dedicated query AND general nearby)
  const { data: sittersData, loading: sittersLoading, refetch: refetchSitters } = useQuery(
    GET_NEARBY_USERS,
    {
      variables: {
        radius: selectedRadius,
        userType: 'sitter',
        longitude: coordinates?.[0] || 0,
        latitude: coordinates?.[1] || 0,
      },
      skip: !coordinates || !isOwner,
      fetchPolicy: 'cache-and-network',
      pollInterval: 30000,
    }
  );

  // For sitters: fetch nearby requests
  const { data: requestsData, loading: requestsLoading, refetch: refetchRequests } = useQuery(
    GET_NEARBY_REQUESTS,
    {
      variables: {
        radius: selectedRadius,
        longitude: coordinates?.[0] || 0,
        latitude: coordinates?.[1] || 0,
      },
      skip: !coordinates || isOwner,
      fetchPolicy: 'cache-and-network',
      pollInterval: 30000,
    }
  );

  // For sitters: also fetch nearby owners
  const { data: ownersData } = useQuery(
    GET_NEARBY_USERS,
    {
      variables: {
        radius: selectedRadius,
        userType: 'owner',
        longitude: coordinates?.[0] || 0,
        latitude: coordinates?.[1] || 0,
      },
      skip: !coordinates || isOwner,
      fetchPolicy: 'cache-and-network',
      pollInterval: 30000,
    }
  );

  const sitters: User[] = sittersData?.nearbyUsers || [];
  const requests: Request[] = requestsData?.nearbyRequests || [];
  const allOwners: User[] = ownersData?.nearbyUsers || [];
  const loading = sittersLoading || requestsLoading;

  // Filter out owners who already have a visible request marker to prevent
  // duplicate overlapping markers at the same location.
  const requestOwnerIds = new Set(requests.map((r) => r.owner?.id).filter(Boolean));
  const owners = allOwners.filter((o) => !requestOwnerIds.has(o.id));

  // Center map on user location
  useEffect(() => {
    if (coordinates && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: coordinates[1],
        longitude: coordinates[0],
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
      });
    }
  }, [coordinates]);

  const handleRefresh = useCallback(() => {
    if (isOwner) {
      refetchSitters();
    } else {
      refetchRequests();
    }
  }, [isOwner]);

  const handleCenterOnUser = useCallback(() => {
    if (coordinates && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: coordinates[1],
        longitude: coordinates[0],
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });
    }
  }, [coordinates]);

  const handleUserPress = useCallback((pressedUser: User) => {
    navigation.navigate('UserDetail', { user: pressedUser });
  }, [navigation]);

  const handleRequestPress = useCallback((request: Request) => {
    navigation.navigate('UserDetail', { user: request.owner });
  }, [navigation]);

  const handleMessagePress = useCallback((targetUser: User) => {
    navigation.navigate('Chat', {
      userId: targetUser.id,
      userName: targetUser.name,
    });
  }, [navigation]);

  const markerCount = isOwner ? sitters.length : (requests.length + owners.length);

  if (locationLoading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <View style={styles.loadingIcon}>
            <Ionicons name="paw" size={32} color={COLORS.primary} />
          </View>
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: SPACING.lg }} />
          <Text style={styles.loadingText}>Finding your location...</Text>
          <Text style={styles.loadingSubtext}>
            Make sure location services are enabled
          </Text>
        </View>
      </View>
    );
  }

  if (!coordinates) {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorIcon}>
          <Ionicons name="location-outline" size={48} color={COLORS.primary} />
        </View>
        <Text style={styles.errorText}>Location Access Needed</Text>
        <Text style={styles.errorSubtext}>
          Enable location services to discover nearby {isOwner ? 'dog sitters' : 'sitting requests'}.
        </Text>
      </View>
    );
  }

  const initialRegion: Region = {
    latitude: coordinates[1],
    longitude: coordinates[0],
    latitudeDelta: 0.04,
    longitudeDelta: 0.04,
  };

  return (
    <View style={styles.container}>
      {/* Map - Use Apple Maps on iOS (no API key needed), Google on Android */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={initialRegion}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={false}
        customMapStyle={Platform.OS === 'android' ? MAP_STYLE : undefined}
      >
        {/* Sitter markers (for owners) */}
        {isOwner &&
          sitters.map((sitter) => (
            <UserMarker
              key={sitter.id}
              user={sitter}
              onPress={handleUserPress}
            />
          ))}

        {/* Request markers (for sitters) */}
        {!isOwner &&
          requests.map((request) => (
            <RequestMarker
              key={request.id}
              request={request}
              onPress={handleRequestPress}
            />
          ))}

        {/* Owner markers (for sitters - show owners who have dogs) */}
        {!isOwner &&
          owners.map((owner) => (
            <UserMarker
              key={owner.id}
              user={owner}
              onPress={handleUserPress}
            />
          ))}
      </MapView>

      {/* Radius Filter Pills */}
      <View style={styles.radiusContainer}>
        <View style={styles.radiusPillRow}>
          {RADIUS_OPTIONS.map((radius) => (
            <TouchableOpacity
              key={radius}
              style={[
                styles.radiusPill,
                selectedRadius === radius && styles.radiusPillActive,
              ]}
              onPress={() => setSelectedRadius(radius)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.radiusPillText,
                  selectedRadius === radius && styles.radiusPillTextActive,
                ]}
              >
                {radius} km
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Map Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={handleCenterOnUser}
          activeOpacity={0.7}
        >
          <Ionicons name="locate" size={22} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={handleRefresh}
          activeOpacity={0.7}
        >
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <Ionicons name="refresh" size={22} color={COLORS.primary} />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => setShowList(!showList)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={showList ? 'map' : 'list'}
            size={22}
            color={COLORS.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Bottom Info Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.countChip}>
          <Ionicons
            name={isOwner ? 'people' : 'paw'}
            size={16}
            color={COLORS.primary}
          />
          <Text style={styles.countText}>
            {markerCount} {isOwner ? 'sitters' : 'results'} nearby
          </Text>
        </View>
        {loading && (
          <View style={styles.refreshingChip}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.refreshingText}>Updating...</Text>
          </View>
        )}
      </View>

      {/* Bottom Sheet List */}
      {showList && (
        <View style={styles.listContainer}>
          {/* Handle bar */}
          <View style={styles.sheetHandle}>
            <View style={styles.handleBar} />
          </View>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>
              {isOwner ? 'Available Sitters' : 'Nearby Requests'}
            </Text>
            <TouchableOpacity
              onPress={() => setShowList(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={20} color={COLORS.gray600} />
            </TouchableOpacity>
          </View>

          {isOwner ? (
            <FlatList
              data={sitters}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <UserCard
                  user={item}
                  onPress={handleUserPress}
                  onMessagePress={handleMessagePress}
                  showDistance
                />
              )}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyList}>
                  <View style={styles.emptyIcon}>
                    <Ionicons name="search" size={32} color={COLORS.gray400} />
                  </View>
                  <Text style={styles.emptyTitle}>No sitters found</Text>
                  <Text style={styles.emptyText}>
                    Try increasing the search radius
                  </Text>
                </View>
              }
            />
          ) : (
            <FlatList
              data={requests}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <RequestCard
                  request={item}
                  onPress={handleRequestPress}
                  onMessagePress={() =>
                    navigation.navigate('Chat', {
                      userId: item.owner.id,
                      userName: item.owner.name,
                    })
                  }
                />
              )}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyList}>
                  <View style={styles.emptyIcon}>
                    <Ionicons name="search" size={32} color={COLORS.gray400} />
                  </View>
                  <Text style={styles.emptyTitle}>No requests nearby</Text>
                  <Text style={styles.emptyText}>
                    Try increasing the search radius
                  </Text>
                </View>
              }
            />
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  map: {
    flex: 1,
  },
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingContent: {
    alignItems: 'center',
    padding: SPACING.xxl,
  },
  loadingIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONTS.sizes.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  loadingSubtext: {
    marginTop: SPACING.xs,
    fontSize: FONTS.sizes.md,
    color: COLORS.textMuted,
  },
  // Error
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SPACING.xxl,
  },
  errorIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  errorText: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  errorSubtext: {
    fontSize: FONTS.sizes.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  // Radius pills
  radiusContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 16 : 12,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  radiusPillRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.full,
    padding: SPACING.xs,
    ...SHADOWS.lg,
  },
  radiusPill: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.base,
    borderRadius: BORDER_RADIUS.full,
  },
  radiusPillActive: {
    backgroundColor: COLORS.primary,
  },
  radiusPillText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  radiusPillTextActive: {
    color: COLORS.white,
  },
  // Controls
  controlsContainer: {
    position: 'absolute',
    right: SPACING.base,
    top: Platform.OS === 'ios' ? 72 : 64,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    ...SHADOWS.lg,
  },
  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: SPACING.lg,
    left: SPACING.base,
    right: SPACING.base,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  countChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.base,
    borderRadius: BORDER_RADIUS.full,
    ...SHADOWS.lg,
    gap: SPACING.sm,
  },
  countText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  refreshingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    ...SHADOWS.md,
    gap: SPACING.xs,
  },
  refreshingText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
  },
  // Bottom sheet
  listContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.xxl,
    borderTopRightRadius: BORDER_RADIUS.xxl,
    ...SHADOWS.xl,
  },
  sheetHandle: {
    alignItems: 'center',
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xs,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.gray300,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  listTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: SPACING.base,
  },
  emptyList: {
    alignItems: 'center',
    paddingVertical: SPACING.xxxl,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  emptyText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textMuted,
  },
});

export default MapScreen;
