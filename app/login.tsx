import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, RADIUS } from '../utils/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing Fields', 'Please enter both email and password');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.orb1} />
        <View style={styles.orb2} />

        <View style={styles.content}>
          <View style={styles.brandSection}>
            <View style={styles.logoRing}>
              <Ionicons name="leaf" size={36} color={COLORS.accent} />
            </View>
            <Text style={styles.brandName}>Pantry Pal</Text>
            <Text style={styles.brandTag}>PRO</Text>
            <Text style={styles.tagline}>Your smart kitchen companion</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Welcome back</Text>
            <Text style={styles.cardSubtitle}>Sign in to your account</Text>

            <View style={[styles.inputWrap, focusedField === 'email' && styles.inputWrapFocused]}>
              <Ionicons name="mail-outline" size={18} color={focusedField === 'email' ? COLORS.accent : COLORS.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email address"
                placeholderTextColor={COLORS.textMuted}
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!loading}
              />
            </View>

            <View style={[styles.inputWrap, focusedField === 'pass' && styles.inputWrapFocused]}>
              <Ionicons name="lock-closed-outline" size={18} color={focusedField === 'pass' ? COLORS.accent : COLORS.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={COLORS.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
                onFocus={() => setFocusedField('pass')}
                onBlur={() => setFocusedField(null)}
                editable={!loading}
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                <Ionicons name={showPass ? 'eye-outline' : 'eye-off-outline'} size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => router.push('/forgot-password')} style={styles.forgotRow}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.ctaBtn, loading && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#FFF" />
                : <Text style={styles.ctaBtnText}>Sign In</Text>
              }
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/signup')}>
              <Text style={styles.footerLink}>Create one</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg0 },
  orb1: {
    position: 'absolute', top: -80, right: -80,
    width: 250, height: 250, borderRadius: 125,
    backgroundColor: 'rgba(108,99,255,0.12)',
  },
  orb2: {
    position: 'absolute', bottom: 100, left: -100,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(0,210,255,0.07)',
  },
  content: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
  brandSection: { alignItems: 'center', marginBottom: 36 },
  logoRing: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.accentGlow,
    borderWidth: 1.5, borderColor: COLORS.accent,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
  },
  brandName: { fontSize: 34, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.5 },
  brandTag: { fontSize: 11, fontWeight: '800', color: COLORS.accent, letterSpacing: 3, marginTop: 2, marginBottom: 8 },
  tagline: { color: COLORS.textSecondary, fontSize: 14 },
  card: {
    backgroundColor: COLORS.bg1, borderRadius: RADIUS.lg, padding: 24,
    borderWidth: 1, borderColor: COLORS.border,
  },
  cardTitle: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  cardSubtitle: { color: COLORS.textSecondary, fontSize: 14, marginBottom: 24 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.bg2, borderRadius: RADIUS.md,
    borderWidth: 1.5, borderColor: COLORS.border,
    marginBottom: 12, paddingHorizontal: 14,
  },
  inputWrapFocused: { borderColor: COLORS.accent, backgroundColor: COLORS.bg3 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: COLORS.textPrimary, fontSize: 15, paddingVertical: 14 },
  eyeBtn: { padding: 4 },
  forgotRow: { alignItems: 'flex-end', marginBottom: 20 },
  forgotText: { color: COLORS.accent, fontSize: 13, fontWeight: '600' },
  ctaBtn: { backgroundColor: COLORS.accent, borderRadius: RADIUS.md, paddingVertical: 15, alignItems: 'center' },
  ctaBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 28 },
  footerText: { color: COLORS.textSecondary, fontSize: 14 },
  footerLink: { color: COLORS.accent, fontSize: 14, fontWeight: '600' },
});
