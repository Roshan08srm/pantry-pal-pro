import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [resetCode, setResetCode] = useState('');

  const handleSendReset = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      // Generate reset code
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      setResetCode(code);
      
      await resetPassword(email);
      setSent(true);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.successBox}>
            <Ionicons name="checkmark-circle" size={80} color="#34C759" />
            <Text style={styles.successTitle}>Reset Code Sent</Text>
            <Text style={styles.successText}>
              A password reset code has been sent to:
            </Text>
            <Text style={styles.emailText}>{email}</Text>
            
            <Text style={styles.codeLabel}>Your Reset Code:</Text>
            <View style={styles.codeBox}>
              <Text style={styles.codeText}>{resetCode}</Text>
            </View>
            
            <Text style={styles.successSubtext}>
              Use this code to reset your password. Code is valid for 24 hours.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.continueBtn}
            onPress={() => router.push({ pathname: '/reset-password', params: { email } })}
          >
            <Text style={styles.continueBtnText}>RESET PASSWORD</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Text style={styles.backBtnText}>BACK TO LOGIN</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.header} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={24} color="#00D2FF" />
        <Text style={styles.headerText}>Back</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>Forgot Password</Text>
        <Text style={styles.subtitle}>
          Enter your email address and we'll send you a link to reset your password.
        </Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email Address"
            placeholderTextColor="#8E8E93"
            value={email}
            onChangeText={setEmail}
            editable={!loading}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleSendReset}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.submitBtnText}>SEND RESET LINK</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  headerText: {
    color: '#00D2FF',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
    marginBottom: 32,
  },
  form: {
    marginBottom: 40,
  },
  input: {
    backgroundColor: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#3A3A3C',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#FFF',
    fontSize: 16,
    marginBottom: 20,
  },
  submitBtn: {
    backgroundColor: '#00D2FF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  successBox: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 20,
    marginBottom: 12,
  },
  successText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 8,
  },
  successSubtext: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 12,
  },
  emailText: {
    fontSize: 16,
    color: '#00D2FF',
    fontWeight: '600',
    marginVertical: 12,
  },
  codeLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 24,
    marginBottom: 12,
    fontWeight: '600',
  },
  codeBox: {
    backgroundColor: '#1C1C1E',
    borderWidth: 2,
    borderColor: '#00D2FF',
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 24,
    marginBottom: 20,
    alignItems: 'center',
  },
  codeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00D2FF',
    letterSpacing: 4,
  },
  backBtn: {
    backgroundColor: '#00D2FF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 20,
  },
  backBtnText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  continueBtn: {
    backgroundColor: '#00D2FF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  continueBtnText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
