import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { User } from '../types';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { formatRating, getInitials, formatDistance } from '../utils/helpers';

interface UserCardProps {
  user: User;
  onPress: (user: User) => void;
  onMessagePress?: (user: User) => void;
  showDistance?: boolean;
  compact?: boolean;
}

export const UserCard: React.FC<UserCardProps> = ({
  user,
  onPress,
  onMessagePress,
  showDistance = true,
  compact = false,
}) => {
  const isOwner = user.userType === 'owner';
  const userTypeColor = isOwner ? COLORS.owner : COLORS.sitter;
  const userTypeBg = isOwner ? COLORS.ownerLight : COLORS.sitterLight;

  if (compact) {
    return (
      <TouchableOpacity style={styles.compactCard} onPress={() => onPress(user)} activeOpacity={0.7}>
        <View style={styles.compactAvatar}>
          {user.profilePicture ? (
            <Image source={{ uri: user.profilePicture }} style={styles.compactImage} />
          ) : (
            <View style={[styles.compactInitials, { backgroundColor: userTypeColor }]}>
              <Text style={styles.compactInitialsText}>{getInitials(user.name)}</Text>
            </View>
          )}
          {user.isAvailable && <View style={styles.compactAvailableDot} />}
        </View>
        <View style={styles.compactInfo}>
          <Text style={styles.compactName} numberOfLines={1}>{user.name}</Text>
          {user.rating && (
            <View style={styles.compactRating}>
              <Ionicons name="star" size={10} color={COLORS.star} />
              <Text style={styles.compactRatingText}>{formatRating(user.rating)}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(user)} activeOpacity={0.7}>
      <View style={styles.cardContent}>
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {user.profilePicture ? (
            <Image source={{ uri: user.profilePicture }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: userTypeColor }]}>
              <Text style={styles.avatarInitials}>{getInitials(user.name)}</Text>
            </View>
          )}
          {user.isAvailable && (
            <View style={styles.availableBadge}>
              <View style={styles.availableDotInner} />
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.infoContainer}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>{user.name}</Text>
            <View style={[styles.typeBadge, { backgroundColor: userTypeBg }]}>
              <Text style={[styles.typeText, { color: userTypeColor }]}>
                {isOwner ? 'Owner' : 'Sitter'}
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            {user.rating ? (
              <View style={styles.stat}>
                <Ionicons name="star" size={13} color={COLORS.star} />
                <Text style={styles.statText}>
                  {formatRating(user.rating)}
                </Text>
                <Text style={styles.statCount}>({user.reviewCount || 0})</Text>
              </View>
            ) : (
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>New</Text>
              </View>
            )}

            {showDistance && user.distance != null && (
              <View style={styles.stat}>
                <Ionicons name="location-outline" size={13} color={COLORS.textMuted} />
                <Text style={styles.statText}>{formatDistance(user.distance)}</Text>
              </View>
            )}

            {user.userType === 'sitter' && user.hourlyRate != null && (
              <View style={styles.rateBadge}>
                <Text style={styles.rateText}>${user.hourlyRate}/hr</Text>
              </View>
            )}
          </View>

          {user.availabilityMessage && (
            <Text style={styles.message} numberOfLines={2}>{user.availabilityMessage}</Text>
          )}
          {user.bio && !user.availabilityMessage && (
            <Text style={styles.bio} numberOfLines={2}>{user.bio}</Text>
          )}

          {isOwner && user.dogs && user.dogs.length > 0 && (
            <View style={styles.dogsRow}>
              <Ionicons name="paw" size={12} color={COLORS.owner} />
              <Text style={styles.dogsText}>
                {user.dogs.map((d) => d.name).join(', ')}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Message button */}
      {onMessagePress && (
        <TouchableOpacity style={styles.messageButton} onPress={() => onMessagePress(user)}>
          <Ionicons name="chatbubble-outline" size={18} color={COLORS.white} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.base,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.md,
  },
  cardContent: { flexDirection: 'row' },
  avatarContainer: { position: 'relative', marginRight: SPACING.md },
  avatar: { width: 60, height: 60, borderRadius: 30 },
  avatarPlaceholder: {
    width: 60, height: 60, borderRadius: 30,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarInitials: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.white },
  availableBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: COLORS.white,
    justifyContent: 'center', alignItems: 'center',
    ...SHADOWS.sm,
  },
  availableDotInner: {
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: COLORS.success,
  },
  infoContainer: { flex: 1 },
  nameRow: {
    flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xs,
  },
  name: {
    fontSize: FONTS.sizes.base, fontWeight: '700',
    color: COLORS.textPrimary, flex: 1, marginRight: SPACING.sm,
  },
  typeBadge: {
    paddingHorizontal: SPACING.sm, paddingVertical: 3,
    borderRadius: BORDER_RADIUS.sm,
  },
  typeText: { fontSize: FONTS.sizes.xs, fontWeight: '600' },
  statsRow: {
    flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap',
    marginBottom: SPACING.xs, gap: SPACING.sm,
  },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  statText: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  statCount: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted },
  newBadge: {
    backgroundColor: COLORS.primaryMuted, paddingHorizontal: SPACING.sm,
    paddingVertical: 2, borderRadius: BORDER_RADIUS.sm,
  },
  newBadgeText: { fontSize: FONTS.sizes.xs, color: COLORS.primary, fontWeight: '500' },
  rateBadge: {
    backgroundColor: COLORS.primaryMuted, paddingHorizontal: SPACING.sm,
    paddingVertical: 2, borderRadius: BORDER_RADIUS.sm,
  },
  rateText: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.primary },
  message: {
    fontSize: FONTS.sizes.sm, color: COLORS.textSecondary,
    lineHeight: 18, fontStyle: 'italic',
  },
  bio: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, lineHeight: 18 },
  dogsRow: {
    flexDirection: 'row', alignItems: 'center', marginTop: SPACING.sm, gap: SPACING.xs,
  },
  dogsText: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted },
  messageButton: {
    position: 'absolute', bottom: SPACING.base, right: SPACING.base,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center',
    ...SHADOWS.md,
  },
  // Compact
  compactCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.sm, marginRight: SPACING.sm,
    borderWidth: 1, borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  compactAvatar: { position: 'relative', marginRight: SPACING.sm },
  compactImage: { width: 36, height: 36, borderRadius: 18 },
  compactInitials: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
  },
  compactInitialsText: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.white },
  compactAvailableDot: {
    position: 'absolute', bottom: -1, right: -1,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: COLORS.success, borderWidth: 2, borderColor: COLORS.white,
  },
  compactInfo: { maxWidth: 80 },
  compactName: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.textPrimary },
  compactRating: { flexDirection: 'row', alignItems: 'center', marginTop: 2, gap: 2 },
  compactRatingText: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary },
});

export default UserCard;
