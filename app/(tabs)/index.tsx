import { Ionicons } from '@expo/vector-icons';
import React, { useContext, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getDaysUntilExpiry } from '../../utils/expiryUtils';
import { RADIUS } from '../../utils/theme';
import InventoryMatrix from '../components/InventoryMatrix';
import { InventoryContext } from './_layout';


export default function HomeScreen() {
  const context = useContext(InventoryContext);
  const { logout, user } = useAuth();
  const { theme } = useTheme();
  const [showDeletedModal, setShowDeletedModal] = useState(false);

  const stats = {
    total: context?.inventory.length ?? 0,
    expiringSoon: context?.inventory.filter(i => {
      const days = getDaysUntilExpiry(i.exp);
      return days > 0 && days <= 7;
    }).length ?? 0,
    expired: context?.inventory.filter(i => {
      return getDaysUntilExpiry(i.exp) <= 0;
    }).length ?? 0,
  };


  const confirmClear = () => {
    Alert.alert('Clear All', 'Move all items to Recently Deleted?', [
      { text: 'Cancel' },
      { text: 'Clear', style: 'destructive', onPress: async () => await context?.clearInventory() }
    ]);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to sign out?', [
      { text: 'Cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => await logout() }
    ]);
  };

  const emailInitial = user?.email?.[0]?.toUpperCase() ?? '?';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg0 }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: theme.textMuted }]}>Good day 👋</Text>
          <Text style={[styles.title, { color: theme.textPrimary }]}>My <Text style={{ color: theme.accent }}>Pantry</Text></Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setShowDeletedModal(true)} style={[styles.iconBtn, { backgroundColor: theme.bg1, borderColor: theme.border }]}>
            <Ionicons name="time-outline" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={confirmClear} style={[styles.iconBtn, { backgroundColor: theme.bg1, borderColor: theme.border }]}>
            <Ionicons name="trash-outline" size={20} color={theme.urgent} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={[styles.avatarBtn, { backgroundColor: theme.accentGlow, borderColor: theme.accent }]}>
            <Text style={[styles.avatarText, { color: theme.accent }]}>{emailInitial}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: theme.bg1, borderColor: theme.safe }]}>
          <Text style={[styles.statNum, { color: theme.safe }]}>{stats.total}</Text>
          <Text style={[styles.statLabel, { color: theme.textMuted }]}>TOTAL</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.bg1, borderColor: theme.warning }]}>
          <Text style={[styles.statNum, { color: theme.warning }]}>{stats.expiringSoon}</Text>
          <Text style={[styles.statLabel, { color: theme.textMuted }]}>EXPIRING</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.bg1, borderColor: theme.urgent }]}>
          <Text style={[styles.statNum, { color: theme.urgent }]}>{stats.expired}</Text>
          <Text style={[styles.statLabel, { color: theme.textMuted }]}>EXPIRED</Text>
        </View>
      </View>

      <InventoryMatrix />

      {/* Recently Deleted Modal */}
      {showDeletedModal && (
        <View style={styles.modalOuter}>
          <View style={[styles.modalSheet, { backgroundColor: theme.bg1, borderColor: theme.border }]}>
            <View style={[styles.modalHandle, { backgroundColor: theme.border }]} />
            <View style={styles.modalHead}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Recently <Text style={{ color: theme.urgent }}>Deleted</Text></Text>
              <TouchableOpacity onPress={() => setShowDeletedModal(false)} style={[styles.closeBtn, { backgroundColor: theme.bg2 }]}>
                <Ionicons name="close" size={22} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            {!context?.deletedInventory || context.deletedInventory.length === 0 ? (
              <View style={styles.emptyDeleted}>
                <Ionicons name="trash-outline" size={48} color={theme.textMuted} />
                <Text style={[styles.emptyDeletedText, { color: theme.textMuted }]}>Nothing in the bin</Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {context.deletedInventory.map(item => (
                  <View key={item.id} style={[styles.deletedRow, { backgroundColor: theme.bg2, borderColor: theme.border }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.deletedName, { color: theme.textPrimary }]}>{item.name}</Text>
                      <Text style={[styles.deletedMeta, { color: theme.textMuted }]}>{item.qty} · Exp: {item.exp}</Text>
                    </View>
                    <View style={styles.deletedActions}>
                      <TouchableOpacity
                        style={[styles.actionPill, { backgroundColor: theme.safeBg, borderColor: theme.safe }]}
                        onPress={async () => await context.restoreInventoryItem(item.id)}
                      >
                        <Ionicons name="refresh" size={16} color={theme.safe} />
                        <Text style={[styles.actionPillText, { color: theme.safe }]}>Restore</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionPill, { backgroundColor: theme.urgentBg, borderColor: theme.urgent }]}
                        onPress={async () => await context.permanentDeleteInventoryItem(item.id)}
                      >
                        <Ionicons name="trash" size={16} color={theme.urgent} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 24, paddingBottom: 16 },
  greeting: { fontSize: 13, letterSpacing: 0.3, marginBottom: 2 },
  title: { fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: { padding: 10, borderRadius: RADIUS.md, borderWidth: 1 },
  avatarBtn: {
    width: 38, height: 38, borderRadius: 19,
    borderWidth: 1.5,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 15, fontWeight: '800' },

  // Stats
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1, borderRadius: RADIUS.md,
    borderWidth: 1, padding: 14, alignItems: 'center',
  },
  statNum: { fontSize: 26, fontWeight: '800' },
  statLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1.2, marginTop: 2 },

  // Modal
  modalOuter: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end', zIndex: 100 },
  modalSheet: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, maxHeight: '75%', minHeight: '40%',
    borderWidth: 1,
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: '800' },
  closeBtn: { padding: 8, borderRadius: RADIUS.sm },
  emptyDeleted: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, paddingVertical: 40 },
  emptyDeletedText: { fontSize: 15 },
  deletedRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: RADIUS.md,
    padding: 14, marginBottom: 10, borderWidth: 1,
  },
  deletedName: { fontSize: 15, fontWeight: '600' },
  deletedMeta: { fontSize: 12, marginTop: 2 },
  deletedActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  actionPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 6, paddingHorizontal: 10,
    borderRadius: RADIUS.pill, borderWidth: 1,
  },
  actionPillText: { fontSize: 12, fontWeight: '700' },
});