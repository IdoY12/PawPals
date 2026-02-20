import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from '@apollo/client';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import { CREATE_REQUEST, UPDATE_REQUEST, DELETE_REQUEST } from '../graphql/mutations';
import { GET_MY_REQUESTS } from '../graphql/queries';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { formatDate } from '../utils/helpers';
import { RootStackParamList } from '../types';

type RequestFormRouteProps = RouteProp<RootStackParamList, 'RequestForm'>;

const safeDate = (raw: string | number | undefined | null, fallback: Date): Date => {
  if (raw == null) return fallback;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? fallback : d;
};

const safeDateString = (d: Date): string => {
  try {
    return formatDate(d.toISOString());
  } catch {
    return 'Invalid date';
  }
};

export const RequestFormScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RequestFormRouteProps>();
  const { user } = useAuth();
  const { coordinates } = useLocation();

  const existingRequest = route.params?.request;
  const isEditing = !!existingRequest;

  const [message, setMessage] = useState(existingRequest?.message || '');
  const [specialInstructions, setSpecialInstructions] = useState(
    existingRequest?.specialInstructions || ''
  );
  const [preferredRate, setPreferredRate] = useState(
    existingRequest?.preferredRate?.toString() || ''
  );
  const [startDate, setStartDate] = useState(
    safeDate(existingRequest?.startDate, new Date())
  );
  const [endDate, setEndDate] = useState(
    safeDate(existingRequest?.endDate, new Date(Date.now() + 24 * 60 * 60 * 1000))
  );
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // Temporary dates for iOS modal (only applied on "Done")
  const [tempStartDate, setTempStartDate] = useState(startDate);
  const [tempEndDate, setTempEndDate] = useState(endDate);

  const [createRequest, { loading: creating }] = useMutation(CREATE_REQUEST, {
    refetchQueries: [{ query: GET_MY_REQUESTS }],
  });

  const [updateRequest, { loading: updating }] = useMutation(UPDATE_REQUEST, {
    refetchQueries: [{ query: GET_MY_REQUESTS }],
  });

  const [deleteRequest, { loading: deleting }] = useMutation(DELETE_REQUEST, {
    refetchQueries: [{ query: GET_MY_REQUESTS }],
  });

  const loading = creating || updating || deleting;

  // === DATE PICKER HANDLERS ===

  const openStartPicker = () => {
    setTempStartDate(startDate);
    setShowStartPicker(true);
  };

  const openEndPicker = () => {
    setTempEndDate(endDate);
    setShowEndPicker(true);
  };

  const handleStartDateChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      // Android: picker auto-dismisses, apply immediately
      setShowStartPicker(false);
      if (event.type === 'set' && date) {
        setStartDate(date);
        if (date > endDate) {
          setEndDate(new Date(date.getTime() + 24 * 60 * 60 * 1000));
        }
      }
    } else {
      // iOS: update temp date, user will confirm via Done button
      if (date) {
        setTempStartDate(date);
      }
    }
  };

  const handleEndDateChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowEndPicker(false);
      if (event.type === 'set' && date) {
        setEndDate(date);
      }
    } else {
      if (date) {
        setTempEndDate(date);
      }
    }
  };

  const confirmStartDate = () => {
    setStartDate(tempStartDate);
    if (tempStartDate > endDate) {
      setEndDate(new Date(tempStartDate.getTime() + 24 * 60 * 60 * 1000));
    }
    setShowStartPicker(false);
  };

  const confirmEndDate = () => {
    setEndDate(tempEndDate);
    setShowEndPicker(false);
  };

  const cancelPicker = (which: 'start' | 'end') => {
    if (which === 'start') {
      setShowStartPicker(false);
    } else {
      setShowEndPicker(false);
    }
  };

  // === FORM LOGIC ===

  const validateForm = () => {
    if (!message.trim()) {
      Alert.alert('Missing Information', 'Please describe what you need help with.');
      return false;
    }
    if (!isEditing && startDate < new Date(new Date().setHours(0, 0, 0, 0))) {
      Alert.alert('Invalid Date', 'Start date cannot be in the past.');
      return false;
    }
    if (endDate < startDate) {
      Alert.alert('Invalid Date', 'End date must be after start date.');
      return false;
    }
    if (!coordinates) {
      Alert.alert('Location Required', 'Please enable location services.');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      if (isEditing) {
        await updateRequest({
          variables: {
            id: existingRequest.id,
            input: {
              message: message.trim(),
              startDate: startDate.toISOString(),
              endDate: endDate.toISOString(),
              location: { coordinates },
              specialInstructions: specialInstructions.trim() || undefined,
              preferredRate: preferredRate ? parseFloat(preferredRate) : undefined,
            },
          },
        });
        Alert.alert('Updated', 'Your request has been updated.');
      } else {
        await createRequest({
          variables: {
            input: {
              message: message.trim(),
              startDate: startDate.toISOString(),
              endDate: endDate.toISOString(),
              location: { coordinates },
              specialInstructions: specialInstructions.trim() || undefined,
              preferredRate: preferredRate ? parseFloat(preferredRate) : undefined,
            },
          },
        });
        Alert.alert('Published', 'Your request is now visible to nearby sitters!');
      }
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Something went wrong.');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Request',
      'This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteRequest({ variables: { id: existingRequest!.id } });
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete.');
            }
          },
        },
      ]
    );
  };

  // === iOS DATE PICKER MODAL ===
  const renderIOSPickerModal = (
    visible: boolean,
    value: Date,
    onChange: (e: DateTimePickerEvent, d?: Date) => void,
    onDone: () => void,
    onCancel: () => void,
    minDate: Date | undefined,
    title: string
  ) => (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.modalDismiss} onPress={onCancel} activeOpacity={1} />
        <View style={styles.pickerModal}>
          <View style={styles.pickerHeader}>
            <TouchableOpacity onPress={onCancel}>
              <Text style={styles.pickerCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.pickerTitle}>{title}</Text>
            <TouchableOpacity onPress={onDone}>
              <Text style={styles.pickerDone}>Done</Text>
            </TouchableOpacity>
          </View>
          <DateTimePicker
            value={value}
            mode="date"
            display="spinner"
            onChange={onChange}
            minimumDate={minDate}
            style={styles.picker}
            textColor={COLORS.textPrimary}
            themeVariant="dark"
          />
        </View>
      </View>
    </Modal>
  );

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name="paw" size={28} color={COLORS.primary} />
          </View>
          <Text style={styles.title}>
            {isEditing ? 'Edit Your Request' : 'New Sitting Request'}
          </Text>
          <Text style={styles.subtitle}>
            Describe what you need and we'll match you with sitters nearby
          </Text>
        </View>

        {/* Message */}
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>What do you need?</Text>
            <Text style={styles.required}>Required</Text>
          </View>
          <View style={styles.textAreaContainer}>
            <TextInput
              style={styles.textArea}
              value={message}
              onChangeText={setMessage}
              placeholder="e.g., Need someone to watch my golden retriever Buddy this weekend. He's friendly and loves walks..."
              placeholderTextColor={COLORS.textMuted}
              multiline
              numberOfLines={4}
              maxLength={500}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{message.length}/500</Text>
          </View>
        </View>

        {/* Date Range */}
        <View style={styles.section}>
          <Text style={styles.label}>When do you need help?</Text>
          <View style={styles.dateRow}>
            <TouchableOpacity
              style={styles.dateCard}
              onPress={openStartPicker}
              activeOpacity={0.7}
            >
              <View style={styles.dateIconWrap}>
                <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.dateLabel}>From</Text>
                <Text style={styles.dateValue}>{safeDateString(startDate)}</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.dateArrow}>
              <Ionicons name="arrow-forward" size={16} color={COLORS.textMuted} />
            </View>

            <TouchableOpacity
              style={styles.dateCard}
              onPress={openEndPicker}
              activeOpacity={0.7}
            >
              <View style={styles.dateIconWrap}>
                <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.dateLabel}>Until</Text>
                <Text style={styles.dateValue}>{safeDateString(endDate)}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* iOS Date Picker Modals — only mount when open to avoid DateTimePicker validation on hidden mount */}
        {Platform.OS === 'ios' && showStartPicker && renderIOSPickerModal(
          showStartPicker,
          tempStartDate,
          handleStartDateChange,
          confirmStartDate,
          () => cancelPicker('start'),
          isEditing ? undefined : new Date(),
          'Start Date'
        )}
        {Platform.OS === 'ios' && showEndPicker && renderIOSPickerModal(
          showEndPicker,
          tempEndDate,
          handleEndDateChange,
          confirmEndDate,
          () => cancelPicker('end'),
          isEditing ? undefined : startDate,
          'End Date'
        )}

        {/* Android pickers (rendered inline, auto-dismiss) */}
        {Platform.OS === 'android' && showStartPicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display="default"
            onChange={handleStartDateChange}
            minimumDate={isEditing ? undefined : new Date()}
          />
        )}
        {Platform.OS === 'android' && showEndPicker && (
          <DateTimePicker
            value={endDate}
            mode="date"
            display="default"
            onChange={handleEndDateChange}
            minimumDate={isEditing ? undefined : startDate}
          />
        )}

        {/* Budget */}
        <View style={styles.section}>
          <Text style={styles.label}>Your budget</Text>
          <View style={styles.rateCard}>
            <View style={styles.rateIcon}>
              <Ionicons name="wallet-outline" size={20} color={COLORS.secondary} />
            </View>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={styles.rateInput}
              value={preferredRate}
              onChangeText={setPreferredRate}
              placeholder="0"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="numeric"
            />
            <View style={styles.rateSuffix}>
              <Text style={styles.rateSuffixText}>per hour</Text>
            </View>
          </View>
        </View>

        {/* Special Instructions */}
        <View style={styles.section}>
          <Text style={styles.label}>Special instructions</Text>
          <View style={styles.textAreaContainer}>
            <TextInput
              style={[styles.textArea, { minHeight: 80 }]}
              value={specialInstructions}
              onChangeText={setSpecialInstructions}
              placeholder="Allergies, feeding schedule, favorite toys, vet info..."
              placeholderTextColor={COLORS.textMuted}
              multiline
              numberOfLines={3}
              maxLength={1000}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Dogs */}
        {user?.dogs && user.dogs.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.label}>Dogs included</Text>
            <View style={styles.dogsRow}>
              {user.dogs.map((dog, index) => (
                <View key={index} style={styles.dogChip}>
                  <Ionicons name="paw" size={14} color={COLORS.owner} />
                  <Text style={styles.dogChipText}>{dog.name}</Text>
                  <Text style={styles.dogChipBreed}>{dog.breed}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Ionicons
                name={isEditing ? 'checkmark-circle' : 'paper-plane'}
                size={20}
                color={COLORS.white}
              />
              <Text style={styles.submitButtonText}>
                {isEditing ? 'Save Changes' : 'Publish Request'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Delete */}
        {isEditing && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            disabled={loading}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={18} color={COLORS.error} />
            <Text style={styles.deleteButtonText}>Delete Request</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: SPACING.xxxl }} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.lg,
  },
  // Header
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
    paddingTop: SPACING.md,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: SPACING.lg,
  },
  // Sections
  section: {
    marginBottom: SPACING.xl,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  label: {
    fontSize: FONTS.sizes.base,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  required: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.primary,
    fontWeight: '500',
    backgroundColor: COLORS.primaryMuted,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
  },
  // Text areas
  textAreaContainer: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  textArea: {
    minHeight: 110,
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    fontSize: FONTS.sizes.base,
    color: COLORS.textPrimary,
    lineHeight: 22,
  },
  charCount: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
    textAlign: 'right',
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING.sm,
  },
  // Date picker
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  dateIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateArrow: {
    paddingHorizontal: SPACING.sm,
  },
  dateLabel: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  dateValue: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  // iOS picker modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: COLORS.overlay,
  },
  modalDismiss: {
    flex: 1,
  },
  pickerModal: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: BORDER_RADIUS.xxl,
    borderTopRightRadius: BORDER_RADIUS.xxl,
    paddingBottom: SPACING.xxxl,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.base,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  pickerTitle: {
    fontSize: FONTS.sizes.base,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  pickerCancel: {
    fontSize: FONTS.sizes.base,
    color: COLORS.textSecondary,
  },
  pickerDone: {
    fontSize: FONTS.sizes.base,
    fontWeight: '600',
    color: COLORS.primary,
  },
  picker: {
    height: 200,
  },
  // Rate
  rateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  rateIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.secondaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currencySymbol: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  rateInput: {
    flex: 1,
    fontSize: FONTS.sizes.xl,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  rateSuffix: {
    backgroundColor: COLORS.gray100,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
  },
  rateSuffixText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  // Dogs
  dogsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  dogChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.ownerLight,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    gap: SPACING.xs,
  },
  dogChipText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.owner,
  },
  dogChipBreed: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
  },
  // Submit
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.base,
    borderRadius: BORDER_RADIUS.lg,
    marginTop: SPACING.md,
    gap: SPACING.sm,
    ...SHADOWS.lg,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.white,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  deleteButtonText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.error,
    fontWeight: '500',
  },
});

export default RequestFormScreen;
