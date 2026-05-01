import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, RADIUS } from '../utils/theme';

export default function SignupScreen() {
  const router = useRouter();
  const { signup } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSignup = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Missing Fields', 'Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await signup(email, password);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Signup Failed', error.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const inputField = (
    key: string, placeholder: string, icon: any,
    value: string, setter: (v: string) => void,
    options?: { secure?: boolean, keyboard?: any }
  ) => (
    <View style={[styles.inputWrap, focusedField === key && styles.inputWrapFocused]}>
      <Ionicons name={icon} size={18} color={focusedField === key ? COLORS.accent : COLORS.textMuted} style={styles.inputIcon} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        value={value}
        onChangeText={setter}
        onFocus={() => setFocusedField(key)}
        onBlur={() => setFocusedField(null)}
        autoCapitalize="none"
        keyboardType={options?.keyboard || 'default'}
        secureTextEntry={options?.secure && !showPass}
        editable={!loading}
      />
      {options?.secure && (
        <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
          <Ionicons name={showPass ? 'eye-outline' : 'eye-off-outline'} size={18} color={COLORS.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.orb1} />
        <View style={styles.orb2} />

        <TouchableOpacity style={styles.backRow} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={COLORS.accent} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.content}>
          <View style={styles.headingRow}>
            <Text style={styles.pageTitle}>Create Account</Text>
            <Text style={styles.pageSubtitle}>Join Pantry Pal Pro today</Text>
          </View>

          <View style={styles.card}>
            {inputField('email', 'Email address', 'mail-outline', email, setEmail, { keyboard: 'email-address' })}
            {inputField('pass', 'Password', 'lock-closed-outline', password, setPassword, { secure: true })}
            {inputField('cpass', 'Confirm password', 'shield-checkmark-outline', confirmPassword, setConfirmPassword, { secure: true })}

            <TouchableOpacity
              style={[styles.ctaBtn, loading && { opacity: 0.7 }]}
              onPress={handleSignup}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#FFF" />
                : <Text style={styles.ctaBtnText}>Create Account</Text>
              }
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.footerLink}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg0 },
  orb1: { position: 'absolute', top: -60, left: -80, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(108,99,255,0.10)' },
  orb2: { position: 'absolute', bottom: 80, right: -80, width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(0,210,255,0.06)' },
  backRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, gap: 4 },
  backText: { color: COLORS.accent, fontSize: 15, fontWeight: '600' },
  content: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
  headingRow: { marginBottom: 28 },
  pageTitle: { fontSize: 30, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.4 },
  pageSubtitle: { color: COLORS.textSecondary, fontSize: 14, marginTop: 6 },
  card: { backgroundColor: COLORS.bg1, borderRadius: RADIUS.lg, padding: 24, borderWidth: 1, borderColor: COLORS.border },
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
  ctaBtn: { backgroundColor: COLORS.accent, borderRadius: RADIUS.md, paddingVertical: 15, alignItems: 'center', marginTop: 8 },
  ctaBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 28 },
  footerText: { color: COLORS.textSecondary, fontSize: 14 },
  footerLink: { color: COLORS.accent, fontSize: 14, fontWeight: '600' },
});
