import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
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

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const { setNewPassword } = useAuth();
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setPasswordValue] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!resetCode || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await setNewPassword(email || '', resetCode, newPassword);
      Alert.alert('Success', 'Your password has been reset successfully!');
      router.replace('/login');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.header} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={24} color="#00D2FF" />
        <Text style={styles.headerText}>Back</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>
          Enter the reset code sent to your email and create a new password.
        </Text>

        <View style={styles.form}>
          <Text style={styles.label}>Reset Code</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter 6-digit code"
            placeholderTextColor="#8E8E93"
            value={resetCode}
            onChangeText={setResetCode}
            editable={!loading}
            maxLength={6}
            autoCapitalize="characters"
          />

          <Text style={styles.label}>New Password</Text>
          <TextInput
            style={styles.input}
            placeholder="New password"
            placeholderTextColor="#8E8E93"
            value={newPassword}
            onChangeText={setPasswordValue}
            secureTextEntry
            editable={!loading}
          />

          <Text style={styles.label}>Confirm Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Confirm password"
            placeholderTextColor="#8E8E93"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            editable={!loading}
          />

          <TouchableOpacity
            style={[styles.resetBtn, loading && styles.resetBtnDisabled]}
            onPress={handleResetPassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.resetBtnText}>RESET PASSWORD</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.hint}>
          <Ionicons name="information-circle" size={18} color="#00D2FF" />
          <Text style={styles.hintText}>
            Check your email for the 6-digit reset code
          </Text>
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
    marginBottom: 8,
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
  label: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
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
  },
  resetBtn: {
    backgroundColor: '#00D2FF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 32,
  },
  resetBtnDisabled: {
    opacity: 0.6,
  },
  resetBtnText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  hint: {
    flexDirection: 'row',
    backgroundColor: '#1C1C1E',
    borderLeftWidth: 3,
    borderLeftColor: '#00D2FF',
    padding: 14,
    borderRadius: 8,
    gap: 10,
    alignItems: 'flex-start',
  },
  hintText: {
    color: '#8E8E93',
    fontSize: 13,
    flex: 1,
  },
});
