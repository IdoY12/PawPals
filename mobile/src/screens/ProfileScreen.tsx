import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from '@apollo/client';
import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';
import { useAuth } from '../context/AuthContext';
import { GET_ME, GET_USER_REVIEWS } from '../graphql/queries';
import { UPDATE_PROFILE, TOGGLE_AVAILABILITY } from '../graphql/mutations';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { formatRating, getInitials } from '../utils/helpers';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:4000';

export const ProfileScreen: React.FC = () => {
  const { user, logout, updateUser, token } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [hourlyRate, setHourlyRate] = useState(user?.hourlyRate?.toString() || '');
  const [availabilityMessage, setAvailabilityMessage] = useState(user?.availabilityMessage || '');
  const [isAvailable, setIsAvailable] = useState(user?.isAvailable || false);
  const [uploading, setUploading] = useState(false);

  const { data: reviewsData } = useQuery(GET_USER_REVIEWS, {
    variables: { userId: user?.id, limit: 5 },
    skip: !user?.id,
  });

  const [updateProfile, { loading: updating }] = useMutation(UPDATE_PROFILE, {
    refetchQueries: [{ query: GET_ME }],
  });
  const [toggleAvailability, { loading: toggling }] = useMutation(TOGGLE_AVAILABILITY);

  const isSitter = user?.userType === 'sitter';
  const typeColor = isSitter ? COLORS.sitter : COLORS.owner;
  const typeBg = isSitter ? COLORS.sitterLight : COLORS.ownerLight;

  const handleSaveProfile = async () => {
    try {
      const { data } = await updateProfile({
        variables: {
          input: {
            name,
            phone: phone || undefined,
            bio: bio || undefined,
            hourlyRate: hourlyRate ? parseFloat(hourlyRate) : undefined,
            availabilityMessage: availabilityMessage || undefined,
          },
        },
      });
      updateUser(data.updateProfile);
      setIsEditing(false);
      Alert.alert('Saved', 'Your profile has been updated.');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile.');
    }
  };

  const handleToggleAvailability = async (value: boolean) => {
    setIsAvailable(value);
    try {
      const { data } = await toggleAvailability({
        variables: { isAvailable: value, message: availabilityMessage || undefined },
      });
      updateUser(data.toggleAvailability);
    } catch (error: any) {
      setIsAvailable(!value);
      Alert.alert('Error', error.message || 'Failed to update availability.');
    }
  };

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string) => {
    setUploading(true);
    try {
      const formData = new FormData();
      const filename = uri.split('/').pop() || 'profile.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      formData.append('profilePicture', { uri, name: filename, type } as any);

      const response = await fetch(`${API_URL}/upload/profile`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await response.json();
      if (data.url) {
        await updateProfile({ variables: { input: { profilePicture: data.url } } });
        Alert.alert('Done', 'Profile picture updated.');
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to upload image.');
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const reviews = reviewsData?.getUserReviews || [];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Header */}
      <View style={styles.heroHeader}>
        <TouchableOpacity style={styles.avatarWrap} onPress={handlePickImage} disabled={uploading}>
          {uploading ? (
            <View style={styles.avatarLoading}><ActivityIndicator color={COLORS.white} /></View>
          ) : user?.profilePicture ? (
            <Image source={{ uri: user.profilePicture }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: typeColor }]}>
              <Text style={styles.avatarInitials}>{getInitials(user?.name || '')}</Text>
            </View>
          )}
          <View style={styles.cameraBadge}>
            <Ionicons name="camera" size={14} color={COLORS.white} />
          </View>
        </TouchableOpacity>

        <Text style={styles.heroName}>{user?.name}</Text>
        <View style={[styles.rolePill, { backgroundColor: typeBg }]}>
          <Text style={[styles.rolePillText, { color: typeColor }]}>
            {isSitter ? 'Dog Sitter' : 'Dog Owner'}
          </Text>
        </View>

        {user?.rating ? (
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={16} color={COLORS.star} />
            <Text style={styles.ratingValue}>{formatRating(user.rating)}</Text>
            <Text style={styles.ratingCount}>({user.reviewCount} reviews)</Text>
          </View>
        ) : (
          <Text style={styles.newLabel}>New Member</Text>
        )}
      </View>

      {/* Availability Card (Sitters) */}
      {isSitter && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>Availability</Text>
              <Text style={styles.cardSubtitle}>
                {isAvailable ? 'You\'re visible to owners' : 'You\'re hidden from search'}
              </Text>
            </View>
            <Switch
              value={isAvailable}
              onValueChange={handleToggleAvailability}
              trackColor={{ false: COLORS.gray200, true: COLORS.primaryLight }}
              thumbColor={isAvailable ? COLORS.primary : COLORS.gray400}
              ios_backgroundColor={COLORS.gray200}
              disabled={toggling}
            />
          </View>
          {isAvailable && (
            <TextInput
              style={styles.availInput}
              placeholder="Add a status message (e.g., 'Available weekends!')"
              placeholderTextColor={COLORS.textMuted}
              value={availabilityMessage}
              onChangeText={setAvailabilityMessage}
              multiline
            />
          )}
        </View>
      )}

      {/* Profile Info Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Profile Information</Text>
          <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
            <Text style={styles.editLink}>{isEditing ? 'Cancel' : 'Edit'}</Text>
          </TouchableOpacity>
        </View>

        <InfoRow icon="person-outline" label="Name">
          {isEditing ? (
            <TextInput style={styles.editInput} value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor={COLORS.textMuted} />
          ) : (
            <Text style={styles.infoValue}>{user?.name}</Text>
          )}
        </InfoRow>

        <InfoRow icon="mail-outline" label="Email">
          <Text style={styles.infoValue}>{user?.email}</Text>
        </InfoRow>

        <InfoRow icon="call-outline" label="Phone">
          {isEditing ? (
            <TextInput style={styles.editInput} value={phone} onChangeText={setPhone} placeholder="Phone" keyboardType="phone-pad" placeholderTextColor={COLORS.textMuted} />
          ) : (
            <Text style={[styles.infoValue, !user?.phone && styles.placeholder]}>{user?.phone || 'Not set'}</Text>
          )}
        </InfoRow>

        {isSitter && (
          <InfoRow icon="document-text-outline" label="Bio">
            {isEditing ? (
              <TextInput style={[styles.editInput, { minHeight: 60 }]} value={bio} onChangeText={setBio} placeholder="Tell dog owners about yourself..." multiline placeholderTextColor={COLORS.textMuted} />
            ) : (
              <Text style={[styles.infoValue, !user?.bio && styles.placeholder]}>{user?.bio || 'Not set'}</Text>
            )}
          </InfoRow>
        )}

        {isSitter && (
          <InfoRow icon="wallet-outline" label="Rate">
            {isEditing ? (
              <View style={styles.rateEditRow}>
                <Text style={styles.currency}>$</Text>
                <TextInput style={styles.rateEditInput} value={hourlyRate} onChangeText={setHourlyRate} placeholder="0" keyboardType="numeric" placeholderTextColor={COLORS.textMuted} />
                <Text style={styles.rateUnit}>/hr</Text>
              </View>
            ) : (
              <Text style={[styles.infoValue, !user?.hourlyRate && styles.placeholder]}>
                {user?.hourlyRate ? `$${user.hourlyRate}/hour` : 'Not set'}
              </Text>
            )}
          </InfoRow>
        )}

        {isEditing && (
          <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile} disabled={updating} activeOpacity={0.7}>
            {updating ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
          </TouchableOpacity>
        )}
      </View>

      {/* Dogs Card (Owners) */}
      {!isSitter && user?.dogs && user.dogs.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>My Dogs</Text>
          {user.dogs.map((dog, idx) => (
            <View key={idx} style={styles.dogRow}>
              <View style={styles.dogIconWrap}>
                <Ionicons name="paw" size={18} color={COLORS.owner} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.dogName}>{dog.name}</Text>
                <Text style={styles.dogMeta}>{dog.breed} · {dog.age} yr</Text>
                {dog.description ? <Text style={styles.dogDesc}>{dog.description}</Text> : null}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Reviews Card */}
      {reviews.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recent Reviews</Text>
          {reviews.map((review: any) => (
            <View key={review.id} style={styles.reviewRow}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewerName}>{review.reviewer.name}</Text>
                <View style={styles.starsRow}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Ionicons key={i} name={i < review.rating ? 'star' : 'star-outline'} size={13} color={COLORS.star} />
                  ))}
                </View>
              </View>
              <Text style={styles.reviewBody}>{review.comment}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Sign Out */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
        <Ionicons name="log-out-outline" size={18} color={COLORS.error} />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>

      <View style={{ height: SPACING.xxxl }} />
    </ScrollView>
  );
};

// Small helper component for info rows
const InfoRow: React.FC<{ icon: keyof typeof Ionicons.glyphMap; label: string; children: React.ReactNode }> = ({
  icon, label, children,
}) => (
  <View style={infoStyles.row}>
    <View style={infoStyles.iconWrap}>
      <Ionicons name={icon} size={18} color={COLORS.textMuted} />
    </View>
    <View style={infoStyles.content}>
      <Text style={infoStyles.label}>{label}</Text>
      {children}
    </View>
  </View>
);

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.gray50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  content: { flex: 1 },
  label: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginBottom: 2 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  // Hero
  heroHeader: {
    alignItems: 'center', paddingTop: SPACING.xl, paddingBottom: SPACING.xl,
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: BORDER_RADIUS.xxl, borderBottomRightRadius: BORDER_RADIUS.xxl,
    ...SHADOWS.lg,
  },
  avatarWrap: { position: 'relative', marginBottom: SPACING.md },
  avatar: { width: 96, height: 96, borderRadius: 48 },
  avatarPlaceholder: {
    width: 96, height: 96, borderRadius: 48,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarInitials: { fontSize: 28, fontWeight: '700', color: COLORS.white },
  avatarLoading: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: COLORS.gray300, justifyContent: 'center', alignItems: 'center',
  },
  cameraBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: COLORS.white,
  },
  heroName: { fontSize: FONTS.sizes.xxl, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.xs },
  rolePill: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: BORDER_RADIUS.full, marginBottom: SPACING.sm },
  rolePillText: { fontSize: FONTS.sizes.sm, fontWeight: '600' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  ratingValue: { fontSize: FONTS.sizes.base, fontWeight: '700', color: COLORS.textPrimary },
  ratingCount: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted },
  newLabel: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, fontStyle: 'italic' },
  // Card
  card: {
    backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.xl,
    margin: SPACING.base, marginBottom: 0, padding: SPACING.base,
    borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOWS.sm,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  cardTitle: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.textPrimary },
  cardSubtitle: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, marginTop: 2 },
  editLink: { fontSize: FONTS.sizes.md, fontWeight: '600', color: COLORS.primary },
  availInput: {
    marginTop: SPACING.md, padding: SPACING.md,
    backgroundColor: COLORS.gray50, borderRadius: BORDER_RADIUS.md,
    fontSize: FONTS.sizes.md, color: COLORS.textPrimary, borderWidth: 1, borderColor: COLORS.border,
  },
  // Info
  infoValue: { fontSize: FONTS.sizes.md, color: COLORS.textPrimary },
  placeholder: { color: COLORS.textMuted, fontStyle: 'italic' },
  editInput: {
    fontSize: FONTS.sizes.md, color: COLORS.textPrimary,
    paddingVertical: Platform.OS === 'ios' ? SPACING.xs : 0,
    borderBottomWidth: 1, borderBottomColor: COLORS.primary,
  },
  rateEditRow: { flexDirection: 'row', alignItems: 'center' },
  currency: { fontSize: FONTS.sizes.lg, fontWeight: '600', color: COLORS.textPrimary },
  rateEditInput: {
    fontSize: FONTS.sizes.lg, fontWeight: '600', color: COLORS.textPrimary,
    borderBottomWidth: 1, borderBottomColor: COLORS.primary, minWidth: 50, textAlign: 'center',
    paddingVertical: Platform.OS === 'ios' ? SPACING.xs : 0,
  },
  rateUnit: { fontSize: FONTS.sizes.md, color: COLORS.textMuted, marginLeft: SPACING.xs },
  saveBtn: {
    backgroundColor: COLORS.primary, paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg, alignItems: 'center', marginTop: SPACING.md,
  },
  saveBtnText: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.white },
  // Dogs
  dogRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight,
  },
  dogIconWrap: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.ownerLight, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md,
  },
  dogName: { fontSize: FONTS.sizes.base, fontWeight: '600', color: COLORS.textPrimary },
  dogMeta: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, marginTop: 2 },
  dogDesc: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginTop: SPACING.xs, fontStyle: 'italic' },
  // Reviews
  reviewRow: { paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xs },
  reviewerName: { fontSize: FONTS.sizes.md, fontWeight: '600', color: COLORS.textPrimary },
  starsRow: { flexDirection: 'row', gap: 1 },
  reviewBody: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, lineHeight: 20 },
  // Logout
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    margin: SPACING.base, padding: SPACING.md,
    backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.errorLight, gap: SPACING.sm,
  },
  logoutText: { fontSize: FONTS.sizes.md, fontWeight: '600', color: COLORS.error },
});

export default ProfileScreen;
