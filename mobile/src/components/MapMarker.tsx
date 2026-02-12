import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Marker, Callout } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { User, Request } from '../types';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { formatRating, getInitials } from '../utils/helpers';

interface UserMarkerProps {
  user: User;
  onPress: (user: User) => void;
}

interface RequestMarkerProps {
  request: Request;
  onPress: (request: Request) => void;
}

export const UserMarker: React.FC<UserMarkerProps> = ({ user, onPress }) => {
  const isSitter = user.userType === 'sitter';
  const markerColor = isSitter ? COLORS.sitter : COLORS.owner;

  return (
    <Marker
      coordinate={{
        latitude: user.location.coordinates[1],
        longitude: user.location.coordinates[0],
      }}
      tracksViewChanges={false}
    >
      <View style={styles.markerOuter}>
        <View style={[styles.markerBubble, { borderColor: markerColor }]}>
          {user.profilePicture ? (
            <Image source={{ uri: user.profilePicture }} style={styles.markerImage} />
          ) : (
            <View style={[styles.markerInitials, { backgroundColor: markerColor }]}>
              <Text style={styles.initialsText}>{getInitials(user.name)}</Text>
            </View>
          )}
        </View>
        {user.isAvailable && (
          <View style={styles.onlineDot} />
        )}
        <View style={[styles.markerTip, { borderTopColor: markerColor }]} />
      </View>

      <Callout style={styles.callout} onPress={() => onPress(user)}>
        <View style={styles.calloutBody}>
          <Text style={styles.calloutName} numberOfLines={1}>{user.name}</Text>
          <View style={styles.calloutMeta}>
            <Ionicons name="star" size={12} color={COLORS.star} />
            <Text style={styles.calloutRating}>
              {user.rating ? formatRating(user.rating) : 'New'}
            </Text>
            {isSitter && user.hourlyRate && (
              <>
                <Text style={styles.calloutDot}> · </Text>
                <Text style={styles.calloutRate}>${user.hourlyRate}/hr</Text>
              </>
            )}
          </View>
          {user.availabilityMessage && (
            <Text style={styles.calloutMsg} numberOfLines={1}>{user.availabilityMessage}</Text>
          )}
          <View style={styles.calloutAction}>
            <Text style={styles.calloutActionText}>View Profile</Text>
            <Ionicons name="chevron-forward" size={12} color={COLORS.primary} />
          </View>
        </View>
      </Callout>
    </Marker>
  );
};

export const RequestMarker: React.FC<RequestMarkerProps> = ({ request, onPress }) => {
  const owner = request.owner;

  return (
    <Marker
      coordinate={{
        latitude: request.location.coordinates[1],
        longitude: request.location.coordinates[0],
      }}
      tracksViewChanges={false}
    >
      {/* Marker icon: show the owner's photo if available, otherwise paw */}
      <View style={styles.markerOuter}>
        <View style={[styles.markerBubble, styles.requestBubble]}>
          {owner.profilePicture ? (
            <Image source={{ uri: owner.profilePicture }} style={styles.markerImage} />
          ) : (
            <View style={styles.requestInner}>
              <Ionicons name="paw" size={20} color={COLORS.white} />
            </View>
          )}
        </View>
        <View style={[styles.markerTip, { borderTopColor: COLORS.secondary }]} />
      </View>

      {/* Unified callout: owner profile + request text + action */}
      <Callout style={styles.calloutWide} onPress={() => onPress(request)}>
        <View style={styles.calloutBody}>
          {/* Owner header row */}
          <View style={styles.calloutHeader}>
            {owner.profilePicture ? (
              <Image source={{ uri: owner.profilePicture }} style={styles.calloutAvatar} />
            ) : (
              <View style={[styles.calloutAvatarFallback, { backgroundColor: COLORS.owner }]}>
                <Text style={styles.calloutAvatarText}>{getInitials(owner.name)}</Text>
              </View>
            )}
            <View style={styles.calloutHeaderText}>
              <Text style={styles.calloutName} numberOfLines={1}>{owner.name}</Text>
              <Text style={styles.calloutLabel}>Dog Owner</Text>
            </View>
          </View>

          {/* Request message */}
          <Text style={styles.calloutMsg} numberOfLines={3}>{request.message}</Text>

          {/* Action link */}
          <View style={styles.calloutAction}>
            <Text style={styles.calloutActionText}>View Details</Text>
            <Ionicons name="chevron-forward" size={12} color={COLORS.primary} />
          </View>
        </View>
      </Callout>
    </Marker>
  );
};

export const CurrentLocationMarker: React.FC<{
  coordinate: { latitude: number; longitude: number };
}> = ({ coordinate }) => {
  return (
    <Marker coordinate={coordinate}>
      <View style={styles.currentOuter}>
        <View style={styles.currentPulse} />
        <View style={styles.currentDot} />
      </View>
    </Marker>
  );
};

const styles = StyleSheet.create({
  markerOuter: { alignItems: 'center' },
  markerBubble: {
    width: 48, height: 48, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: COLORS.sitter,
    backgroundColor: COLORS.white,
    ...SHADOWS.lg,
  },
  markerImage: { width: 42, height: 42, borderRadius: 21 },
  markerInitials: {
    width: 42, height: 42, borderRadius: 21,
    justifyContent: 'center', alignItems: 'center',
  },
  initialsText: { color: COLORS.white, fontSize: FONTS.sizes.base, fontWeight: '700' },
  onlineDot: {
    position: 'absolute', top: 0, right: 0,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: COLORS.success,
    borderWidth: 2, borderColor: COLORS.white,
  },
  markerTip: {
    width: 0, height: 0,
    borderLeftWidth: 7, borderRightWidth: 7, borderTopWidth: 8,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    marginTop: -2,
  },
  requestBubble: { borderColor: COLORS.secondary },
  requestInner: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center', alignItems: 'center',
  },
  // Callout (compact - for UserMarker)
  callout: { width: 200 },
  // Callout (wider - for unified RequestMarker)
  calloutWide: { width: 230 },
  calloutBody: { padding: SPACING.sm },
  // Header row with avatar + name (for RequestMarker unified callout)
  calloutHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  calloutAvatar: { width: 36, height: 36, borderRadius: 18 },
  calloutAvatarFallback: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
  },
  calloutAvatarText: { color: COLORS.white, fontSize: FONTS.sizes.xs, fontWeight: '700' },
  calloutHeaderText: { marginLeft: SPACING.sm, flex: 1 },
  calloutLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted },
  // Shared callout styles
  calloutName: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },
  calloutMeta: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  calloutRating: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, marginLeft: 3 },
  calloutDot: { color: COLORS.textMuted },
  calloutRate: { fontSize: FONTS.sizes.xs, fontWeight: '600', color: COLORS.primary },
  calloutMsg: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, marginBottom: SPACING.sm, lineHeight: 16 },
  calloutAction: { flexDirection: 'row', alignItems: 'center', paddingTop: SPACING.xs, borderTopWidth: 1, borderTopColor: COLORS.borderLight },
  calloutActionText: { fontSize: FONTS.sizes.xs, fontWeight: '600', color: COLORS.primary },
  // Current location
  currentOuter: { width: 28, height: 28, justifyContent: 'center', alignItems: 'center' },
  currentPulse: {
    position: 'absolute', width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.primaryLight, opacity: 0.25,
  },
  currentDot: {
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: COLORS.primary, borderWidth: 3, borderColor: COLORS.white,
  },
});

export default { UserMarker, RequestMarker, CurrentLocationMarker };
