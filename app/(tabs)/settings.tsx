import { Ionicons } from '@expo/vector-icons';
import React, { useContext, useState } from 'react';
import {
  Alert, SafeAreaView, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View, Image, Modal
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { COLORS as FIXED_COLORS, RADIUS } from '../../utils/theme';
import { InventoryContext } from './_layout';

export default function SettingsScreen() {
  const { user, logout, updatePassword } = useAuth() as any;
  const context = useContext(InventoryContext);
  const { mode, theme, setMode } = useTheme();

  const [showDeletedSection, setShowDeletedSection] = useState(false);
  const [showBillsSection, setShowBillsSection] = useState(false);
  const [selectedBillUri, setSelectedBillUri] = useState<string | null>(null);
  const [showChangePass, setShowChangePass] = useState(false);
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmNewPass, setConfirmNewPass] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const emailInitial = user?.email?.[0]?.toUpperCase() ?? '?';

  const handleChangePassword = async () => {
    if (!currentPass || !newPass || !confirmNewPass) {
      Alert.alert('Missing Fields', 'Please fill in all password fields');
      return;
    }
    if (newPass !== confirmNewPass) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }
    if (newPass.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters');
      return;
    }
    try {
      if (updatePassword) {
        await updatePassword(currentPass, newPass);
        Alert.alert('Success', 'Password updated successfully');
        setCurrentPass(''); setNewPass(''); setConfirmNewPass('');
        setShowChangePass(false);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update password');
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => await logout() },
    ]);
  };

  const SectionHeader = ({ label }: { label: string }) => (
    <Text style={styles.sectionHeader}>{label}</Text>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg0 }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Settings</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: theme.bg1, borderColor: theme.border }]}>
          <View style={[styles.avatar, { backgroundColor: theme.accentGlow, borderColor: theme.accent }]}>
            <Text style={[styles.avatarText, { color: theme.accent }]}>{emailInitial}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.profileEmail, { color: theme.textPrimary }]} numberOfLines={1}>{user?.email ?? 'Unknown'}</Text>
            <Text style={[styles.profileRole, { color: theme.textMuted }]}>Pantry Pal Pro User</Text>
          </View>
        </View>

        {/* Account */}
        <SectionHeader label="ACCOUNT" />
        <View style={[styles.group, { backgroundColor: theme.bg1, borderColor: theme.border }]}>
          <TouchableOpacity style={styles.row} onPress={() => setShowChangePass(!showChangePass)}>
            <View style={[styles.rowIcon, { backgroundColor: theme.accentGlow }]}>
              <Ionicons name="key-outline" size={18} color={theme.accent} />
            </View>
            <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>Change Password</Text>
            <Ionicons name={showChangePass ? 'chevron-up' : 'chevron-forward'} size={18} color={theme.textMuted} />
          </TouchableOpacity>

          {showChangePass && (
            <View style={[styles.subPanel, { borderTopColor: theme.border }]}>
              {[
                { placeholder: 'Current password', value: currentPass, setter: setCurrentPass, show: showCurrent, toggle: () => setShowCurrent(!showCurrent) },
                { placeholder: 'New password', value: newPass, setter: setNewPass, show: showNew, toggle: () => setShowNew(!showNew) },
                { placeholder: 'Confirm new password', value: confirmNewPass, setter: setConfirmNewPass, show: showNew, toggle: () => setShowNew(!showNew) },
              ].map((field, i) => (
                <View key={i} style={[styles.passInputWrap, { backgroundColor: theme.bg2, borderColor: theme.border }]}>
                  <TextInput
                    style={[styles.passInput, { color: theme.textPrimary }]}
                    placeholder={field.placeholder}
                    placeholderTextColor={theme.textMuted}
                    value={field.value}
                    onChangeText={field.setter}
                    secureTextEntry={!field.show}
                  />
                  <TouchableOpacity onPress={field.toggle}>
                    <Ionicons name={field.show ? 'eye-outline' : 'eye-off-outline'} size={16} color={theme.textMuted} />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity style={[styles.savePassBtn, { backgroundColor: theme.accent }]} onPress={handleChangePassword}>
                <Text style={styles.savePassBtnText}>Update Password</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Visuals / Theme */}
        <SectionHeader label="VISUALS" />
        <View style={[styles.group, { backgroundColor: theme.bg1, borderColor: theme.border }]}>
          <View style={styles.themeRow}>
            <View style={[styles.rowIcon, { backgroundColor: theme.accentGlow }]}>
              <Ionicons name="color-palette-outline" size={18} color={theme.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>App Theme</Text>
              <Text style={[styles.rowValue, { color: theme.textMuted }]}>{mode === 'dark' ? 'Deep Void' : 'Brilliant Light'}</Text>
            </View>
          </View>
          <View style={[styles.themeButtonsRow, { borderTopColor: theme.border }]}>
            <TouchableOpacity 
              style={[styles.themeBtn, mode === 'light' && { backgroundColor: theme.accent }]} 
              onPress={() => setMode('light')}
            >
              <Ionicons name="sunny" size={16} color={mode === 'light' ? '#FFF' : theme.textMuted} />
              <Text style={[styles.themeBtnText, { color: mode === 'light' ? '#FFF' : theme.textPrimary }]}>Light</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.themeBtn, mode === 'dark' && { backgroundColor: theme.accent }]} 
              onPress={() => setMode('dark')}
            >
              <Ionicons name="moon" size={16} color={mode === 'dark' ? '#FFF' : theme.textMuted} />
              <Text style={[styles.themeBtnText, { color: mode === 'dark' ? '#FFF' : theme.textPrimary }]}>Dark</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Data */}
        <SectionHeader label="DATA" />
        <View style={[styles.group, { backgroundColor: theme.bg1, borderColor: theme.border }]}>
          <TouchableOpacity style={styles.row} onPress={() => setShowDeletedSection(!showDeletedSection)}>
            <View style={[styles.rowIcon, { backgroundColor: theme.urgentBg }]}>
              <Ionicons name="time-outline" size={18} color={theme.urgent} />
            </View>
            <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>Recently Deleted</Text>
            {context?.deletedInventory?.length ? (
              <View style={[styles.badge, { backgroundColor: theme.urgentBg }]}>
                <Text style={[styles.badgeText, { color: theme.urgent }]}>{context.deletedInventory.length}</Text>
              </View>
            ) : null}
            <Ionicons name={showDeletedSection ? 'chevron-up' : 'chevron-forward'} size={18} color={theme.textMuted} />
          </TouchableOpacity>

          {showDeletedSection && (
            <View style={[styles.subPanel, { borderTopColor: theme.border }]}>
              {!context?.deletedInventory?.length ? (
                <Text style={[styles.emptyText, { color: theme.textMuted }]}>No recently deleted items</Text>
              ) : context.deletedInventory.map(item => (
                <View key={item.id} style={[styles.deletedRow, { borderBottomColor: theme.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.deletedName, { color: theme.textPrimary }]}>{item.name}</Text>
                    <Text style={[styles.deletedMeta, { color: theme.textMuted }]}>{item.qty} · {item.exp}</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.pill, { borderColor: theme.safe, backgroundColor: theme.safeBg }]}
                    onPress={async () => await context.restoreInventoryItem(item.id)}
                  >
                    <Ionicons name="refresh" size={14} color={theme.safe} />
                    <Text style={[styles.pillText, { color: theme.safe }]}>Restore</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.pill, { borderColor: theme.urgent, backgroundColor: theme.urgentBg, marginLeft: 6 }]}
                    onPress={async () => await context.permanentDeleteInventoryItem(item.id)}
                  >
                    <Ionicons name="trash" size={14} color={theme.urgent} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Scanned Bills Row */}
          <TouchableOpacity style={[styles.row, { borderTopWidth: 1, borderTopColor: theme.border }]} onPress={() => setShowBillsSection(!showBillsSection)}>
            <View style={[styles.rowIcon, { backgroundColor: 'rgba(0,210,255,0.12)' }]}>
              <Ionicons name="receipt-outline" size={18} color="#00D2FF" />
            </View>
            <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>Receipts & Bills</Text>
            {context?.bills?.length ? (
              <Text style={[styles.rowValue, { color: theme.textMuted }]}>{context.bills.length}</Text>
            ) : null}
            <Ionicons name={showBillsSection ? 'chevron-up' : 'chevron-forward'} size={18} color={theme.textMuted} style={{ marginLeft: 8 }} />
          </TouchableOpacity>

          {showBillsSection && (
            <View style={[styles.subPanel, { borderTopColor: theme.border }]}>
              {!context?.bills?.length ? (
                <Text style={[styles.emptyText, { color: theme.textMuted }]}>No scanned bills yet</Text>
              ) : context.bills.map(bill => (
                <View key={bill.id} style={[styles.deletedRow, { borderBottomColor: theme.border }]}>
                  <TouchableOpacity onPress={() => setSelectedBillUri(bill.uri)}>
                    <Image source={{ uri: bill.uri }} style={[styles.billThumb, { backgroundColor: theme.bg2, borderColor: theme.border }]} />
                  </TouchableOpacity>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.deletedName, { color: theme.textPrimary }]}>{new Date(bill.date).toLocaleDateString()}</Text>
                    <Text style={[styles.deletedMeta, { color: theme.textMuted }]}>{bill.itemCount} items scanned</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.pill, { borderColor: theme.urgent, backgroundColor: theme.urgentBg }]}
                    onPress={async () => {
                      Alert.alert('Delete Bill', 'Are you sure you want to delete this bill record?', [
                        { text: 'Cancel' },
                        { text: 'Delete', style: 'destructive', onPress: () => context.deleteBill(bill.id) },
                      ]);
                    }}
                  >
                    <Ionicons name="trash" size={14} color={theme.urgent} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* About */}
        <SectionHeader label="ABOUT" />
        <View style={[styles.group, { backgroundColor: theme.bg1, borderColor: theme.border }]}>
          <View style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: theme.safeBg }]}>
              <Ionicons name="leaf-outline" size={18} color={theme.safe} />
            </View>
            <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>Version</Text>
            <Text style={[styles.rowValue, { color: theme.textMuted }]}>1.0.0</Text>
          </View>
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={[styles.logoutBtn, { backgroundColor: theme.urgentBg, borderColor: theme.urgent }]} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={theme.urgent} />
          <Text style={[styles.logoutText, { color: theme.urgent }]}>Sign Out</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Bill Fullscreen Modal */}
      <Modal visible={!!selectedBillUri} transparent={true} animationType="fade">
        <View style={styles.fullscreenModal}>
          <TouchableOpacity style={styles.fullscreenClose} onPress={() => setSelectedBillUri(null)}>
            <Ionicons name="close" size={28} color="#FFF" />
          </TouchableOpacity>
          {selectedBillUri && (
            <Image source={{ uri: selectedBillUri }} style={styles.fullscreenImage} resizeMode="contain" />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: FIXED_COLORS.bg0, paddingHorizontal: 20 }, // bg0 will be overridden below
  header: { paddingTop: 24, paddingBottom: 16 },
  title: { fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: RADIUS.lg,
    padding: 18, borderWidth: 1, marginBottom: 24,
  },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    borderWidth: 1.5, 
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 20, fontWeight: '800' },
  profileEmail: { fontSize: 16, fontWeight: '700' },
  profileRole: { fontSize: 12, marginTop: 2 },
  sectionHeader: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8, marginTop: 4 },
  group: { borderRadius: RADIUS.lg, borderWidth: 1, marginBottom: 16, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  rowIcon: { width: 36, height: 36, borderRadius: RADIUS.sm, justifyContent: 'center', alignItems: 'center' },
  rowLabel: { flex: 1, fontSize: 15, fontWeight: '600' },
  rowValue: { fontSize: 14 },
  badge: { borderRadius: RADIUS.pill, paddingHorizontal: 8, paddingVertical: 2, marginRight: 4 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  subPanel: { padding: 16, borderTopWidth: 1, gap: 10 },
  passInputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  passInput: { flex: 1, fontSize: 14 },
  savePassBtn: { borderRadius: RADIUS.md, paddingVertical: 12, alignItems: 'center', marginTop: 6 },
  savePassBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  emptyText: { textAlign: 'center', paddingVertical: 8 },
  deletedRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1 },
  deletedName: { fontSize: 14, fontWeight: '600' },
  deletedMeta: { fontSize: 12, marginTop: 2 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 10, borderRadius: RADIUS.pill, borderWidth: 1 },
  pillText: { fontSize: 12, fontWeight: '700' },
  billThumb: { width: 44, height: 44, borderRadius: RADIUS.sm, borderWidth: 1 },
  
  // Theme Toggle specific
  themeRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  themeButtonsRow: { flexDirection: 'row', padding: 12, gap: 10, borderTopWidth: 1, borderTopColor: 'rgba(128,128,128,0.1)' },
  themeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: RADIUS.md, backgroundColor: 'rgba(128,128,128,0.05)' },
  themeBtnText: { fontWeight: '700', fontSize: 14 },

  // Fullscreen Image Modal
  fullscreenModal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  fullscreenClose: { position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 8 },
  fullscreenImage: { width: '100%', height: '80%' },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: RADIUS.md, paddingVertical: 14,
    borderWidth: 1, marginTop: 8,
  },
  logoutText: { fontSize: 15, fontWeight: '700' },
});
