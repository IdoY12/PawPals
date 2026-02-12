import React from 'react';
import { ActivityIndicator, View, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useQuery } from '@apollo/client';
import { GET_UNREAD_COUNT } from '../graphql/queries';
import {
  AuthScreen,
  MapScreen,
  ProfileScreen,
  ChatListScreen,
  ChatScreen,
  RequestFormScreen,
  UserDetailScreen,
  RequestsScreen,
} from '../screens';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { RootStackParamList, MainTabParamList } from '../types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const MainTabs: React.FC = () => {
  const { user } = useAuth();
  const { data } = useQuery(GET_UNREAD_COUNT, { pollInterval: 30000 });

  const unreadCount = data?.getUnreadCount || 0;
  const isOwner = user?.userType === 'owner';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;
          switch (route.name) {
            case 'Map':
              iconName = focused ? 'compass' : 'compass-outline';
              break;
            case 'ChatList':
              iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
              break;
            case 'Requests':
              iconName = focused ? 'document-text' : 'document-text-outline';
              break;
            case 'MyProfile':
              iconName = focused ? 'person-circle' : 'person-circle-outline';
              break;
            default:
              iconName = 'help';
          }
          return <Ionicons name={iconName} size={focused ? 26 : 24} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray400,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingTop: SPACING.sm,
          ...SHADOWS.lg,
        },
        tabBarLabelStyle: {
          fontSize: FONTS.sizes.xs,
          fontWeight: '600',
          marginTop: 2,
        },
        headerStyle: {
          backgroundColor: COLORS.white,
        },
        headerTitleStyle: {
          fontSize: FONTS.sizes.lg,
          fontWeight: '700',
          color: COLORS.textPrimary,
        },
        headerShadowVisible: false,
      })}
    >
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{
          title: 'Explore',
          headerTitle: isOwner ? 'Find Sitters' : 'Find Requests',
        }}
      />
      <Tab.Screen
        name="ChatList"
        component={ChatListScreen}
        options={{
          title: 'Messages',
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: COLORS.primary,
            fontSize: 10,
            fontWeight: '700',
            minWidth: 18,
            height: 18,
            lineHeight: 18,
          },
        }}
      />
      {isOwner && (
        <Tab.Screen
          name="Requests"
          component={RequestsScreen}
          options={{ title: 'My Requests' }}
        />
      )}
      <Tab.Screen
        name="MyProfile"
        component={ProfileScreen}
        options={{ title: 'Profile', headerTitle: 'My Profile' }}
      />
    </Tab.Navigator>
  );
};

export const AppNavigator: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingLogo}>
          <Ionicons name="paw" size={40} color={COLORS.primary} />
        </View>
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: SPACING.lg }} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: COLORS.white },
          headerTintColor: COLORS.primary,
          headerTitleStyle: { fontWeight: '700', fontSize: FONTS.sizes.lg },
          headerShadowVisible: false,
          headerBackTitleVisible: false,
          contentStyle: { backgroundColor: COLORS.background },
        }}
      >
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthScreen} options={{ headerShown: false }} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
            <Stack.Screen
              name="Chat"
              component={ChatScreen}
              options={({ route }) => ({
                title: route.params?.userName || 'Chat',
              })}
            />
            <Stack.Screen
              name="UserDetail"
              component={UserDetailScreen}
              options={({ route }) => ({
                title: route.params?.user?.name || 'Profile',
              })}
            />
            <Stack.Screen
              name="RequestForm"
              component={RequestFormScreen}
              options={({ route }) => ({
                title: route.params?.request ? 'Edit Request' : 'New Request',
                presentation: 'modal',
              })}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingLogo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AppNavigator;
