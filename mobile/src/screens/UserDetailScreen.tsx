import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@apollo/client';
import { GET_USER_REVIEWS } from '../graphql/queries';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { formatRating, formatDistance, getInitials, formatRelativeTime } from '../utils/helpers';
import { RootStackParamList, User, Review } from '../types';

type UserDetailRouteProps = RouteProp<RootStackParamList, 'UserDetail'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const UserDetailScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<UserDetailRouteProps>();
  const { user } = route.params;

  const { data: reviewsData } = useQuery(GET_USER_REVIEWS, {
    variables: { userId: user.id, limit: 10 },
  });

  const isSitter = user.userType === 'sitter';
  const typeColor = isSitter ? COLORS.sitter : COLORS.owner;
  const typeBg = isSitter ? COLORS.sitterLight : COLORS.ownerLight;
  const reviews: Review[] = reviewsData?.getUserReviews || [];

  const handleMessagePress = () => {
    navigation.navigate('Chat', {
      userId: user.id,
      userName: user.name,
    });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* ── Hero Header ── */}
      <View style={styles.hero}>
        <View style={styles.avatarWrap}>
          {user.profilePicture ? (
            <Image source={{ uri: user.profilePicture }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: typeColor }]}>
              <Text style={styles.avatarInitials}>{getInitials(user.name)}</Text>
            </View>
          )}
          {isSitter && user.isAvailable && (
            <View style={styles.onlineBadge}>
              <Ionicons name="checkmark" size={14} color={COLORS.white} />
            </View>
          )}
        </View>

        <Text style={styles.heroName}>{user.name}</Text>

        <View style={[styles.rolePill, { backgroundColor: typeBg }]}>
          <Text style={[styles.rolePillText, { color: typeColor }]}>
            {isSitter ? 'Dog Sitter' : 'Dog Owner'}
          </Text>
        </View>

        {/* Stats - FIX: use != null instead of && to avoid rendering bare 0 */}
        <View style={styles.statsRow}>
          {user.rating != null && user.rating > 0 ? (
            <View style={styles.statChip}>
              <Ionicons name="star" size={16} color={COLORS.star} />
              <Text style={styles.statValue}>{formatRating(user.rating)}</Text>
              <Text style={styles.statLabel}>
                ({user.reviewCount != null ? user.reviewCount : 0})
              </Text>
            </View>
          ) : (
            <View style={styles.statChip}>
              <Ionicons name="star-outline" size={16} color={COLORS.textMuted} />
              <Text style={styles.statLabel}>New</Text>
            </View>
          )}

          {user.distance != null && (
            <View style={styles.statChip}>
              <Ionicons name="navigate-outline" size={16} color={COLORS.primary} />
              <Text style={styles.statValue}>{formatDistance(user.distance)}</Text>
            </View>
          )}

          {isSitter && user.hourlyRate != null && (
            <View style={styles.statChip}>
              <Ionicons name="wallet-outline" size={16} color={COLORS.secondary} />
              <Text style={styles.statValue}>
                {'$'}{user.hourlyRate}
              </Text>
              <Text style={styles.statLabel}>/hr</Text>
            </View>
          )}
        </View>
      </View>

      {/* ── Availability Banner (Sitters) ── */}
      {isSitter && user.isAvailable && user.availabilityMessage ? (
        <View style={styles.availBanner}>
          <View style={styles.availDot} />
          <Text style={styles.availText}>{user.availabilityMessage}</Text>
        </View>
      ) : null}

      {/* ── Bio (Sitters) ── */}
      {isSitter && user.bio ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.card}>
            <Text style={styles.bioText}>{user.bio}</Text>
          </View>
        </View>
      ) : null}

      {/* ── Dogs (Owners) ── */}
      {!isSitter && user.dogs && user.dogs.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dogs</Text>
          <View style={styles.card}>
            {user.dogs.map((dog, index) => (
              <View
                key={index}
                style={[
                  styles.dogRow,
                  index < (user.dogs?.length ?? 0) - 1 && styles.dogRowBorder,
                ]}
              >
                <View style={styles.dogIconWrap}>
                  <Ionicons name="paw" size={20} color={COLORS.owner} />
                </View>
                <View style={styles.dogInfo}>
                  <Text style={styles.dogName}>{dog.name}</Text>
                  <Text style={styles.dogMeta}>
                    {dog.breed} {dog.age != null ? `· ${dog.age} yr` : ''}
                  </Text>
                  {dog.description ? (
                    <Text style={styles.dogDesc}>{dog.description}</Text>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {/* ── Contact ── */}
      {user.phone ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact</Text>
          <View style={styles.card}>
            <View style={styles.contactRow}>
              <View style={styles.contactIcon}>
                <Ionicons name="call-outline" size={18} color={COLORS.primary} />
              </View>
              <Text style={styles.contactText}>{user.phone}</Text>
            </View>
          </View>
        </View>
      ) : null}

      {/* ── Reviews ── */}
      {reviews.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reviews</Text>
          {reviews.map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View style={styles.reviewerRow}>
                  {review.reviewer.profilePicture ? (
                    <Image
                      source={{ uri: review.reviewer.profilePicture }}
                      style={styles.reviewerAvatar}
                    />
                  ) : (
                    <View style={styles.reviewerAvatarFallback}>
                      <Text style={styles.reviewerInitials}>
                        {getInitials(review.reviewer.name)}
                      </Text>
                    </View>
                  )}
                  <View>
                    <Text style={styles.reviewerName}>{review.reviewer.name}</Text>
                    <Text style={styles.reviewDate}>
                      {formatRelativeTime(review.createdAt)}
                    </Text>
                  </View>
                </View>
                <View style={styles.starsRow}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Ionicons
                      key={i}
                      name={i < review.rating ? 'star' : 'star-outline'}
                      size={13}
                      color={COLORS.star}
                    />
                  ))}
                </View>
              </View>
              {review.comment ? (
                <Text style={styles.reviewBody}>{review.comment}</Text>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}

      {/* ── CTA Button ── */}
      <View style={styles.ctaSection}>
        <TouchableOpacity
          style={styles.messageBtn}
          onPress={handleMessagePress}
          activeOpacity={0.8}
        >
          <Ionicons name="chatbubble-outline" size={20} color={COLORS.white} />
          <Text style={styles.messageBtnText}>Send Message</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: SPACING.xxxl }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  // Hero
  hero: {
    alignItems: 'center',
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xl,
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: BORDER_RADIUS.xxl,
    borderBottomRightRadius: BORDER_RADIUS.xxl,
    ...SHADOWS.lg,
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: SPACING.md,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  avatarPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.white,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  heroName: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  rolePill: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    marginBottom: SPACING.lg,
  },
  rolePillText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray50,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    gap: SPACING.xs,
  },
  statValue: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
  },
  // Availability
  availBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: SPACING.base,
    padding: SPACING.md,
    backgroundColor: COLORS.successLight,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.sm,
  },
  availDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
  },
  availText: {
    flex: 1,
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  // Sections
  section: {
    padding: SPACING.base,
    paddingBottom: 0,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.base,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  bioText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  // Dogs
  dogRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: SPACING.md,
  },
  dogRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  dogIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.ownerLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  dogInfo: {
    flex: 1,
  },
  dogName: {
    fontSize: FONTS.sizes.base,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  dogMeta: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  dogDesc: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    fontStyle: 'italic',
  },
  // Contact
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  contactIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactText: {
    fontSize: FONTS.sizes.base,
    color: COLORS.textPrimary,
  },
  // Reviews
  reviewCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.base,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  reviewerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: SPACING.sm,
  },
  reviewerAvatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.gray200,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  reviewerInitials: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  reviewerName: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  reviewDate: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 1,
  },
  reviewBody: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  // CTA
  ctaSection: {
    padding: SPACING.base,
  },
  messageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    height: 54,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.sm,
    ...SHADOWS.lg,
  },
  messageBtnText: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.white,
  },
});

export default UserDetailScreen;
