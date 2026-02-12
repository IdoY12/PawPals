import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  Keyboard,
  NativeSyntheticEvent,
  TextInputFocusEventData,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from '@apollo/client';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import { LOGIN, REGISTER } from '../graphql/mutations';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { isValidEmail, isValidPassword } from '../utils/helpers';
import { UserType } from '../types';

// ─── Isolated FormInput ─────────────────────────────────────
// Manages its own focus state so that focus/blur only re-renders
// THIS input wrapper – not the entire AuthScreen form.

interface FormInputProps extends TextInputProps {
  icon: keyof typeof Ionicons.glyphMap;
  inputRef?: React.RefObject<TextInput>;
  rightElement?: React.ReactNode;
}

const FormInput = React.memo<FormInputProps>(
  ({ icon, inputRef, rightElement, onFocus, onBlur, style, ...rest }) => {
    const [isFocused, setIsFocused] = useState(false);

    const handleFocus = useCallback(
      (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
        setIsFocused(true);
        onFocus?.(e);
      },
      [onFocus],
    );

    const handleBlur = useCallback(
      (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
        setIsFocused(false);
        onBlur?.(e);
      },
      [onBlur],
    );

    return (
      <View
        style={[
          styles.inputBox,
          isFocused && styles.inputBoxFocused,
        ]}
      >
        <Ionicons
          name={icon}
          size={18}
          color={isFocused ? COLORS.primary : COLORS.textMuted}
        />
        <TextInput
          ref={inputRef}
          style={[styles.textInput, style]}
          placeholderTextColor={COLORS.textMuted}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...rest}
        />
        {rightElement}
      </View>
    );
  },
);

// ─── AuthScreen ──────────────────────────────────────────────

type AuthMode = 'login' | 'register';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const AuthScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  // Input refs for focus chaining (keyboard "next" button)
  const nameRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [userType, setUserType] = useState<UserType>('owner');
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const { coordinates } = useLocation();

  const [loginMutation, { loading: loginLoading }] = useMutation(LOGIN);
  const [registerMutation, { loading: registerLoading }] = useMutation(REGISTER);
  const loading = loginLoading || registerLoading;

  // ─── Handlers ────────────────────────────────────────────

  const handleLogin = async () => {
    Keyboard.dismiss();
    if (!isValidEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    if (!isValidPassword(password)) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }
    try {
      const { data } = await loginMutation({ variables: { email, password } });
      await login(data.login.token, data.login.user);
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Check your credentials and try again.');
    }
  };

  const handleRegister = async () => {
    Keyboard.dismiss();
    if (!name.trim()) {
      Alert.alert('Missing Name', 'Please enter your full name.');
      return;
    }
    if (!isValidEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    if (!isValidPassword(password)) {
      Alert.alert('Weak Password', 'At least 6 characters needed.');
      return;
    }
    if (!coordinates) {
      Alert.alert('Location Required', 'Enable location services to continue.');
      return;
    }
    try {
      const { data } = await registerMutation({
        variables: {
          input: {
            email,
            password,
            name,
            phone: phone || undefined,
            userType,
            location: { coordinates },
          },
        },
      });
      await login(data.register.token, data.register.user);
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message || 'Could not create account.');
    }
  };

  const handleSubmit = () => {
    mode === 'login' ? handleLogin() : handleRegister();
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    // Scroll to top when switching modes to avoid disorientation
    setTimeout(() => scrollRef.current?.scrollTo({ y: 0, animated: true }), 50);
  };

  // ─── Render ──────────────────────────────────────────────

  const isRegister = mode === 'register';

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 20) + 40 },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        bounces={true}
        overScrollMode="always"
      >
        {/* ── Brand Header ── */}
        <View style={[styles.brandSection, isRegister && styles.brandSectionCompact]}>
          <View style={styles.logoRing}>
            <View style={styles.logoBg}>
              <Ionicons name="paw" size={isRegister ? 28 : 34} color={COLORS.white} />
            </View>
          </View>
          <Text style={[styles.brandName, isRegister && styles.brandNameCompact]}>
            PawPals
          </Text>
          {!isRegister && (
            <Text style={styles.tagline}>
              Connect with trusted dog sitters{'\n'}in your neighborhood
            </Text>
          )}
        </View>

        {/* ── Mode Toggle ── */}
        <View style={styles.toggleWrapper}>
          <View style={styles.toggleTrack}>
            <TouchableOpacity
              style={[styles.toggleBtn, mode === 'login' && styles.toggleBtnActive]}
              onPress={() => switchMode('login')}
              activeOpacity={0.8}
            >
              <Text style={[styles.toggleLabel, mode === 'login' && styles.toggleLabelActive]}>
                Sign In
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, mode === 'register' && styles.toggleBtnActive]}
              onPress={() => switchMode('register')}
              activeOpacity={0.8}
            >
              <Text style={[styles.toggleLabel, mode === 'register' && styles.toggleLabelActive]}>
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Form Card ── */}
        <View style={styles.card}>
          {/* ── Register-only fields ── */}
          {isRegister && (
            <>
              {/* Role Picker */}
              <Text style={styles.sectionLabel}>I want to:</Text>
              <View style={styles.roleRow}>
                <TouchableOpacity
                  style={[
                    styles.roleCard,
                    userType === 'owner' && {
                      borderColor: COLORS.owner,
                      backgroundColor: COLORS.ownerLight,
                    },
                  ]}
                  onPress={() => setUserType('owner')}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.roleIconCircle,
                      {
                        backgroundColor:
                          userType === 'owner' ? COLORS.owner : COLORS.gray100,
                      },
                    ]}
                  >
                    <Ionicons
                      name="paw"
                      size={20}
                      color={userType === 'owner' ? COLORS.white : COLORS.owner}
                    />
                  </View>
                  <Text
                    style={[
                      styles.roleTitle,
                      userType === 'owner' && { color: COLORS.owner },
                    ]}
                  >
                    Find a Sitter
                  </Text>
                  <Text style={styles.roleSubtitle}>Dog Owner</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.roleCard,
                    userType === 'sitter' && {
                      borderColor: COLORS.sitter,
                      backgroundColor: COLORS.sitterLight,
                    },
                  ]}
                  onPress={() => setUserType('sitter')}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.roleIconCircle,
                      {
                        backgroundColor:
                          userType === 'sitter' ? COLORS.sitter : COLORS.gray100,
                      },
                    ]}
                  >
                    <Ionicons
                      name="heart"
                      size={20}
                      color={userType === 'sitter' ? COLORS.white : COLORS.sitter}
                    />
                  </View>
                  <Text
                    style={[
                      styles.roleTitle,
                      userType === 'sitter' && { color: COLORS.sitter },
                    ]}
                  >
                    Offer Sitting
                  </Text>
                  <Text style={styles.roleSubtitle}>Dog Sitter</Text>
                </TouchableOpacity>
              </View>

              {/* Divider */}
              <View style={styles.divider} />

              {/* Name */}
              <Text style={styles.fieldLabel}>Full Name</Text>
              <FormInput
                icon="person-outline"
                inputRef={nameRef}
                placeholder="John Doe"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => phoneRef.current?.focus()}
              />

              {/* Phone */}
              <Text style={styles.fieldLabel}>
                Phone <Text style={styles.optionalTag}>(optional)</Text>
              </Text>
              <FormInput
                icon="call-outline"
                inputRef={phoneRef}
                placeholder="+1 (555) 000-0000"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => emailRef.current?.focus()}
              />
            </>
          )}

          {/* ── Shared fields ── */}
          {isRegister && <View style={styles.divider} />}

          {/* Email */}
          <Text style={[styles.fieldLabel, !isRegister && { marginTop: 0 }]}>
            Email
          </Text>
          <FormInput
            icon="mail-outline"
            inputRef={emailRef}
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => passwordRef.current?.focus()}
          />

          {/* Password */}
          <Text style={styles.fieldLabel}>Password</Text>
          <FormInput
            icon="lock-closed-outline"
            inputRef={passwordRef}
            placeholder="Min 6 characters"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
            rightElement={
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={COLORS.textMuted}
                />
              </TouchableOpacity>
            }
          />

          {/* ── Submit Button ── */}
          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Text style={styles.primaryBtnText}>
                  {isRegister ? 'Create Account' : 'Sign In'}
                </Text>
                <View style={styles.btnArrow}>
                  <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
                </View>
              </>
            )}
          </TouchableOpacity>

          {/* Switch prompt */}
          <View style={styles.switchRow}>
            <Text style={styles.switchText}>
              {isRegister ? 'Already have an account?' : "Don't have an account?"}
            </Text>
            <TouchableOpacity onPress={() => switchMode(isRegister ? 'login' : 'register')}>
              <Text style={styles.switchLink}>
                {isRegister ? 'Sign In' : 'Sign Up'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Demo Quick-Fill ── */}
        {mode === 'login' && (
          <View style={styles.demoArea}>
            <View style={styles.demoLine}>
              <View style={styles.demoLineSeg} />
              <Text style={styles.demoLineText}>quick demo</Text>
              <View style={styles.demoLineSeg} />
            </View>
            <View style={styles.demoChipRow}>
              <TouchableOpacity
                style={styles.demoChip}
                onPress={() => {
                  setEmail('owner1@example.com');
                  setPassword('password123');
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.demoChipDot, { backgroundColor: COLORS.owner }]} />
                <Text style={styles.demoChipLabel}>Dog Owner</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.demoChip}
                onPress={() => {
                  setEmail('sitter1@example.com');
                  setPassword('password123');
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.demoChipDot, { backgroundColor: COLORS.sitter }]} />
                <Text style={styles.demoChipLabel}>Dog Sitter</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────

const INPUT_HEIGHT = Platform.OS === 'ios' ? 50 : 48;

const styles = StyleSheet.create({
  // Layout - no KeyboardAvoidingView, pure ScrollView for reliable scrolling
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    // NOTE: no flexGrow here — this is the fix for the stuck scroll
  },

  // ── Brand ──
  brandSection: {
    alignItems: 'center',
    marginTop: SPACING.xxxl,
    marginBottom: SPACING.xl,
  },
  brandSectionCompact: {
    marginTop: SPACING.xxl,
    marginBottom: SPACING.lg,
  },
  logoRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: COLORS.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  logoBg: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandName: {
    fontSize: FONTS.sizes.hero,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: -1,
  },
  brandNameCompact: {
    fontSize: FONTS.sizes.xxxl,
  },
  tagline: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: SPACING.xs,
  },

  // ── Mode Toggle ──
  toggleWrapper: {
    marginBottom: SPACING.lg,
  },
  toggleTrack: {
    flexDirection: 'row',
    backgroundColor: COLORS.gray100,
    borderRadius: BORDER_RADIUS.lg,
    padding: 4,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: COLORS.white,
    ...SHADOWS.md,
  },
  toggleLabel: {
    fontSize: FONTS.sizes.base,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  toggleLabelActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },

  // ── Card ──
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.lg,
  },

  // ── Section / Divider ──
  sectionLabel: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: SPACING.lg,
  },

  // ── Role Cards ──
  roleRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  roleCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.base,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  roleIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  roleTitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  roleSubtitle: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },

  // ── Fields ──
  fieldLabel: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    marginTop: SPACING.base,
  },
  optionalTag: {
    fontWeight: '400',
    color: COLORS.textMuted,
    fontSize: FONTS.sizes.xs,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: INPUT_HEIGHT,
    backgroundColor: COLORS.gray50,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  inputBoxFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
    // NOTE: No shadow/elevation here — changing elevation on focus causes
    // native view recreation which strips the child TextInput of focus.
  },
  textInput: {
    flex: 1,
    fontSize: FONTS.sizes.base,
    color: COLORS.textPrimary,
    paddingVertical: 0, // prevent extra padding on Android
  },

  // ── Primary Button ──
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    height: 54,
    borderRadius: BORDER_RADIUS.lg,
    marginTop: SPACING.xl,
    gap: SPACING.sm,
    ...SHADOWS.lg,
  },
  primaryBtnDisabled: {
    opacity: 0.55,
  },
  primaryBtnText: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.white,
  },
  btnArrow: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Switch Prompt ──
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.lg,
    gap: SPACING.xs,
  },
  switchText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
  },
  switchLink: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '700',
    color: COLORS.primary,
  },

  // ── Demo ──
  demoArea: {
    marginTop: SPACING.xxl,
  },
  demoLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  demoLineSeg: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.gray200,
  },
  demoLineText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginHorizontal: SPACING.md,
  },
  demoChipRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  demoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.base,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
    ...SHADOWS.sm,
  },
  demoChipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  demoChipLabel: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
});

export default AuthScreen;
