import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Request } from '../types';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { formatDateRange, formatDistance, getInitials } from '../utils/helpers';

interface RequestCardProps {
  request: Request;
  onPress: (request: Request) => void;
  onMessagePress?: (request: Request) => void;
  onCancel?: (request: Request) => void;
  onEdit?: (request: Request) => void;
  isOwner?: boolean;
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  active: { bg: COLORS.successLight, text: COLORS.success, label: 'Active' },
  completed: { bg: COLORS.gray100, text: COLORS.gray600, label: 'Completed' },
  cancelled: { bg: COLORS.errorLight, text: COLORS.error, label: 'Cancelled' },
};

export const RequestCard: React.FC<RequestCardProps> = ({
  request,
  onPress,
  onMessagePress,
  onCancel,
  onEdit,
  isOwner = false,
}) => {
  const status = STATUS_CONFIG[request.status] || STATUS_CONFIG.active;

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(request)} activeOpacity={0.7}>
      {/* Header */}
      <View style={styles.header}>
        {!isOwner && (
          <View style={styles.avatarWrap}>
            {request.owner.profilePicture ? (
              <Image source={{ uri: request.owner.profilePicture }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>{getInitials(request.owner.name)}</Text>
              </View>
            )}
          </View>
        )}
        <View style={styles.headerInfo}>
          {!isOwner && <Text style={styles.ownerName}>{request.owner.name}</Text>}
          <View style={styles.dateChip}>
            <Ionicons name="calendar-outline" size={13} color={COLORS.primary} />
            <Text style={styles.dateText}>
              {formatDateRange(request.startDate, request.endDate)}
            </Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
          <Text style={[styles.statusText, { color: status.text }]}>{status.label}</Text>
        </View>
      </View>

      {/* Message */}
      <Text style={styles.message} numberOfLines={3}>{request.message}</Text>

      {/* Meta row */}
      <View style={styles.metaRow}>
        {request.distance != null && (
          <View style={styles.metaChip}>
            <Ionicons name="navigate-outline" size={12} color={COLORS.primary} />
            <Text style={styles.metaChipTextHighlight}>{formatDistance(request.distance)}</Text>
          </View>
        )}
        {request.preferredRate != null && (
          <View style={styles.metaChip}>
            <Ionicons name="wallet-outline" size={12} color={COLORS.secondary} />
            <Text style={styles.metaChipText}>${request.preferredRate}/hr</Text>
          </View>
        )}
        {request.location.address && (
          <View style={[styles.metaChip, { flex: 1 }]}>
            <Ionicons name="location-outline" size={12} color={COLORS.textMuted} />
            <Text style={styles.metaChipText} numberOfLines={1}>{request.location.address}</Text>
          </View>
        )}
      </View>

      {/* Instructions */}
      {request.specialInstructions && (
        <View style={styles.instructionsBanner}>
          <Ionicons name="information-circle-outline" size={14} color={COLORS.info} />
          <Text style={styles.instructionsText} numberOfLines={2}>{request.specialInstructions}</Text>
        </View>
      )}

      {/* Actions */}
      {onMessagePress && !isOwner && request.status === 'active' && (
        <TouchableOpacity style={styles.contactButton} onPress={() => onMessagePress(request)} activeOpacity={0.7}>
          <Ionicons name="chatbubble-outline" size={16} color={COLORS.white} />
          <Text style={styles.contactButtonText}>Message Owner</Text>
        </TouchableOpacity>
      )}

      {isOwner && request.status === 'active' && (
        <View style={styles.ownerActions}>
          {onEdit && (
            <TouchableOpacity
              style={styles.actionChip}
              onPress={() => onEdit(request)}
              activeOpacity={0.7}
            >
              <Ionicons name="create-outline" size={15} color={COLORS.primary} />
              <Text style={styles.actionChipText}>Edit</Text>
            </TouchableOpacity>
          )}
          {onCancel && (
            <TouchableOpacity
              style={[styles.actionChip, styles.actionChipDanger]}
              onPress={() => onCancel(request)}
              activeOpacity={0.7}
            >
              <Ionicons name="close-outline" size={15} color={COLORS.error} />
              <Text style={[styles.actionChipText, { color: COLORS.error }]}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  avatarWrap: { marginRight: SPACING.md },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarPlaceholder: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.owner,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarInitials: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.white },
  headerInfo: { flex: 1 },
  ownerName: {
    fontSize: FONTS.sizes.base, fontWeight: '700',
    color: COLORS.textPrimary, marginBottom: 4,
  },
  dateChip: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  dateText: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  statusBadge: {
    paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  statusText: { fontSize: FONTS.sizes.xs, fontWeight: '600' },
  message: {
    fontSize: FONTS.sizes.md, color: COLORS.textPrimary,
    lineHeight: 22, marginBottom: SPACING.md,
  },
  metaRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  metaChip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.gray50, paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm, borderRadius: BORDER_RADIUS.sm,
    gap: SPACING.xs,
  },
  metaChipText: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary },
  metaChipTextHighlight: { fontSize: FONTS.sizes.xs, fontWeight: '600', color: COLORS.primary },
  instructionsBanner: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: COLORS.infoLight, padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md, marginBottom: SPACING.md, gap: SPACING.xs,
  },
  instructionsText: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, flex: 1, lineHeight: 18 },
  contactButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.primary, paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md, gap: SPACING.sm,
  },
  contactButtonText: { fontSize: FONTS.sizes.md, fontWeight: '600', color: COLORS.white },
  ownerActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: SPACING.sm, marginTop: SPACING.xs },
  actionChip: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
    paddingVertical: SPACING.xs, paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.border,
  },
  actionChipDanger: { borderColor: COLORS.errorLight },
  actionChipText: { fontSize: FONTS.sizes.sm, fontWeight: '500', color: COLORS.primary },
});

export default RequestCard;
