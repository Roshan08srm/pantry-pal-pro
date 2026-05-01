import { Ionicons } from '@expo/vector-icons';
import React, { useContext, useState } from 'react';
import {
  ActivityIndicator, FlatList, SafeAreaView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { InventoryContext } from '../(tabs)/_layout';
import { useTheme } from '../../contexts/ThemeContext';
import { getDaysUntilExpiry } from '../../utils/expiryUtils';
import { RADIUS } from '../../utils/theme';

export default function InventoryMatrix() {
  const context = useContext(InventoryContext);
  const { theme } = useTheme();
  const [search, setSearch] = useState('');

  if (!context || !context.inventory) return <ActivityIndicator color={theme.accent} style={{ marginTop: 60 }} />;

  const { inventory, softDeleteInventoryItem, addShoppingItem } = context;
  
  // Search filter and sort by risk (lowest days remaining first, expired at the absolute top)
  const filtered = inventory
    .filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => getDaysUntilExpiry(a.exp) - getDaysUntilExpiry(b.exp));


  const getExpiryStatus = (expDate: string) => {
    const days = getDaysUntilExpiry(expDate);
    if (days <= 0) return { label: 'EXPIRED', stripColor: theme.expired, tagBg: theme.expiredBg, days };
    if (days <= 3) return { label: 'URGENT', stripColor: theme.urgent, tagBg: theme.urgentBg, days };
    if (days <= 7) return { label: 'SOON', stripColor: theme.warning, tagBg: theme.warningBg, days };
    return { label: 'GOOD', stripColor: theme.safe, tagBg: theme.safeBg, days };
  };

  const emptyState = (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIcon, { backgroundColor: theme.accentGlow, borderColor: theme.accent }]}>
        <Ionicons name="basket-outline" size={52} color={theme.accent} />
      </View>
      <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>Your pantry is empty</Text>
      <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>Scan a grocery bill to add items automatically</Text>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      {/* Search bar */}
      <View style={[styles.searchWrap, { backgroundColor: theme.bg1, borderColor: theme.border }]}>
        <Ionicons name="search-outline" size={16} color={theme.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          style={[styles.searchInput, { color: theme.textPrimary }]}
          placeholder="Search items..."
          placeholderTextColor={theme.textMuted}
          onChangeText={setSearch}
          value={search}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color={theme.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {filtered.length === 0
        ? (search.length > 0
          ? <View style={styles.emptyState}><Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>No items match "{search}"</Text></View>
          : emptyState)
        : (
          <FlatList
            data={filtered}
            keyExtractor={i => i.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
            renderItem={({ item }) => {
              const status = getExpiryStatus(item.exp);
              return (
                <Swipeable
                  renderRightActions={() => (
                    <View style={styles.swipeRight}>
                      <Ionicons name="trash-outline" size={22} color="#FFF" />
                      <Text style={styles.swipeLabel}>Move to Bin</Text>
                    </View>
                  )}
                  renderLeftActions={() => (
                    <View style={styles.swipeLeft}>
                      <Ionicons name="cart-outline" size={22} color="#FFF" />
                      <Text style={styles.swipeLabel}>Add to Cart</Text>
                    </View>
                  )}
                  onSwipeableOpen={async (dir) => {
                    if (dir === 'right') await softDeleteInventoryItem(item.id);
                    if (dir === 'left') {
                      await addShoppingItem(item);
                      await softDeleteInventoryItem(item.id);
                    }
                  }}
                >
                  <View style={[styles.card, { backgroundColor: theme.bg1, borderColor: theme.border }]}>
                    {/* Color strip */}
                    <View style={[styles.strip, { backgroundColor: status.stripColor }]} />

                    <View style={{ flex: 1, paddingLeft: 14 }}>
                      <Text style={[styles.itemName, { color: theme.textPrimary }]} numberOfLines={1}>{item.name}</Text>
                      <Text style={[styles.itemQty, { color: theme.textSecondary }]}>{item.qty}</Text>
                    </View>

                    <View style={[styles.expiryTag, { backgroundColor: status.tagBg }]}>
                      <Text style={[styles.expiryLabel, { color: status.stripColor }]}>{status.label}</Text>
                      <Text style={[styles.expiryDays, { color: status.stripColor }]}>
                        {status.days <= 0 ? 'EXPIRED' : `${status.days}d`}
                      </Text>
                      <Text style={[styles.expiryDate, { color: theme.textMuted }]}>{item.exp}</Text>
                    </View>
                  </View>
                </Swipeable>
              );
            }}
          />
        )
      }
    </View>
  );
}

const styles = StyleSheet.create({
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 11, marginBottom: 16,
  },
  searchInput: { flex: 1, fontSize: 15 },
  card: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: RADIUS.lg,
    marginBottom: 10, overflow: 'hidden',
    borderWidth: 1,
    minHeight: 74,
  },
  strip: { width: 4, alignSelf: 'stretch' },
  itemName: { fontSize: 16, fontWeight: '700', marginBottom: 3 },
  itemQty: { fontSize: 13 },
  expiryTag: {
    paddingVertical: 10, paddingHorizontal: 14,
    borderTopRightRadius: RADIUS.lg, borderBottomRightRadius: RADIUS.lg,
    alignItems: 'flex-end', minWidth: 88,
  },
  expiryLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1.2 },
  expiryDays: { fontSize: 22, fontWeight: '800', lineHeight: 26 },
  expiryDate: { fontSize: 10, marginTop: 1 },
  swipeRight: {
    backgroundColor: '#FF4757', justifyContent: 'center', alignItems: 'center',
    width: 82, borderRadius: RADIUS.lg, marginBottom: 10, rowGap: 4,
  },
  swipeLeft: {
    backgroundColor: '#2ED573', justifyContent: 'center', alignItems: 'center',
    width: 82, borderRadius: RADIUS.lg, marginBottom: 10, rowGap: 4,
  },
  swipeLabel: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 60, gap: 12 },
  emptyIcon: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 1,
    justifyContent: 'center', alignItems: 'center',
  },
  emptyTitle: { fontSize: 20, fontWeight: '700' },
  emptySubtitle: { fontSize: 14, textAlign: 'center', paddingHorizontal: 30 },
});