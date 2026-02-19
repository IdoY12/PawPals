import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation } from '@apollo/client';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { GET_MY_REQUESTS } from '../graphql/queries';
import { CANCEL_REQUEST } from '../graphql/mutations';
import { useAuth } from '../context/AuthContext';
import { RequestCard } from '../components/RequestCard';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { Request, RequestStatus, RootStackParamList } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const STATUS_FILTERS: { value: RequestStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export const RequestsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<RequestStatus | 'all'>('all');

  const { data, loading, refetch } = useQuery(GET_MY_REQUESTS, {
    variables: statusFilter !== 'all' ? { status: statusFilter } : {},
    fetchPolicy: 'cache-and-network',
  });

  const [cancelRequest, { loading: cancelling }] = useMutation(CANCEL_REQUEST, {
    refetchQueries: [{ query: GET_MY_REQUESTS }],
    awaitRefetchQueries: true,
  });

  const requests: Request[] = data?.myRequests || [];

  const handleRequestPress = (request: Request) => {
    navigation.navigate('RequestForm', { request });
  };

  const handleCreateRequest = () => {
    navigation.navigate('RequestForm', {});
  };

  const handleEditRequest = useCallback((request: Request) => {
    navigation.navigate('RequestForm', { request });
  }, [navigation]);

  const handleCancelRequest = useCallback((request: Request) => {
    Alert.alert(
      'Cancel Request',
      'Are you sure you want to cancel this request? This action cannot be undone.',
      [
        { text: 'No, Keep It', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelRequest({ variables: { id: request.id } });
              Alert.alert('Done', 'Your request has been cancelled.');
            } catch (error: any) {
              Alert.alert(
                'Error',
                error?.message || 'Failed to cancel the request. Please try again.',
              );
            }
          },
        },
      ],
    );
  }, [cancelRequest]);

  // Only dog owners can see this screen
  if (user?.userType !== 'owner') {
    return (
      <View style={styles.notOwnerContainer}>
        <Ionicons name="paw" size={64} color={COLORS.gray300} />
        <Text style={styles.notOwnerTitle}>For Dog Owners Only</Text>
        <Text style={styles.notOwnerText}>
          This section is for dog owners to manage their sitting requests.
        </Text>
      </View>
    );
  }

  const renderRequest = ({ item }: { item: Request }) => (
    <RequestCard
      request={item}
      onPress={handleRequestPress}
      onCancel={handleCancelRequest}
      onEdit={handleEditRequest}
      isOwner
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-text-outline" size={80} color={COLORS.gray300} />
      <Text style={styles.emptyTitle}>No Requests Yet</Text>
      <Text style={styles.emptyText}>
        Create a request to find dog sitters near you!
      </Text>
      <TouchableOpacity
        style={styles.createButton}
        onPress={handleCreateRequest}
      >
        <Ionicons name="add-circle" size={20} color={COLORS.white} />
        <Text style={styles.createButtonText}>Create Request</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Status Filters */}
      <View style={styles.filterContainer}>
        {STATUS_FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter.value}
            style={[
              styles.filterButton,
              statusFilter === filter.value && styles.filterButtonActive,
            ]}
            onPress={() => setStatusFilter(filter.value)}
          >
            <Text
              style={[
                styles.filterText,
                statusFilter === filter.value && styles.filterTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Requests List */}
      {loading && !data ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          renderItem={renderRequest}
          contentContainerStyle={
            requests.length === 0 ? styles.emptyList : styles.list
          }
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={refetch}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
        />
      )}

      {/* FAB */}
      {requests.length > 0 && (
        <TouchableOpacity style={styles.fab} onPress={handleCreateRequest}>
          <Ionicons name="add" size={28} color={COLORS.white} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  notOwnerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.background,
  },
  notOwnerTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  notOwnerText: {
    fontSize: FONTS.sizes.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    marginRight: SPACING.sm,
    backgroundColor: COLORS.gray100,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },
  filterText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  filterTextActive: {
    color: COLORS.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  list: {
    padding: SPACING.md,
  },
  emptyList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: FONTS.sizes.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.md,
  },
  createButtonText: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.white,
    marginLeft: SPACING.sm,
  },
  fab: {
    position: 'absolute',
    right: SPACING.lg,
    bottom: SPACING.lg,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.lg,
  },
});

export default RequestsScreen;
