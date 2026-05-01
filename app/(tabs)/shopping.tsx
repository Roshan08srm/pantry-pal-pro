import { Ionicons } from '@expo/vector-icons';
import React, { useContext, useMemo, useState } from 'react';
import {
  Alert, FlatList, Modal, SafeAreaView,
  ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { InventoryContext } from './_layout';
import { useTheme } from '../../contexts/ThemeContext';
import { RADIUS } from '../../utils/theme';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS_SHORT = ['SUN','MON','TUE','WED','THU','FRI','SAT'];

export default function ShoppingScreen() {
  const context = useContext(InventoryContext);
  const { theme } = useTheme();
  const [quantities, setQuantities] = useState<{[key: string]: number}>({});
  const [datePickerModal, setDatePickerModal] = useState(false);
  const [selectedItemForDate, setSelectedItemForDate] = useState<any>(null);
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());

  const getDaysInMonth = (m: number, y: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDay = (m: number, y: number) => new Date(y, m, 1).getDay();
  const formatDate = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;

  if (!context) return null;

  // Sync new shopping items to quantity map
  context.shoppingList.forEach(item => {
    if (!quantities[item.id]) quantities[item.id] = 1;
  });

  const totalItems = context.shoppingList.reduce((s, i) => s + (quantities[i.id] || 1), 0);

  const getIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('milk') || n.includes('cheese') || n.includes('yogurt')) return '🥛';
    if (n.includes('bread') || n.includes('wheat') || n.includes('flour')) return '🍞';
    if (n.includes('egg') || n.includes('chicken') || n.includes('meat')) return '🥚';
    if (n.includes('vegetable') || n.includes('tomato') || n.includes('onion')) return '🥬';
    if (n.includes('apple') || n.includes('fruit') || n.includes('mango')) return '🍎';
    if (n.includes('sugar') || n.includes('salt') || n.includes('honey')) return '🧂';
    return '🛒';
  };

  const replenish = async (item: any, withDate?: string) => {
    const qty = quantities[item.id] || 1;
    await context.addItemToInventory({
      ...item,
      id: Date.now().toString(),
      status: 'normal',
      qty: `${qty} ${item.qty.split(' ').slice(1).join(' ') || 'unit'}`,
      exp: withDate || item.exp,
    });
    await context.removeShoppingItem(item.id);
    setQuantities(prev => { const n = { ...prev }; delete n[item.id]; return n; });
  };

  const removeItem = async (item: any) => {
    await context.removeShoppingItem(item.id);
    setQuantities(prev => { const n = { ...prev }; delete n[item.id]; return n; });
  };

  const clearAll = () => {
    Alert.alert('Clear Cart', 'Remove all items from the shopping list?', [
      { text: 'Cancel' },
      { text: 'Clear', style: 'destructive', onPress: async () => { await context.clearShoppingList(); setQuantities({}); } },
    ]);
  };

  const buyAll = async () => {
    if (context.shoppingList.length === 0) return;
    const count = context.shoppingList.length;
    for (const item of context.shoppingList) await replenish(item);
    Alert.alert('✅ Done!', `${count} item(s) moved back to your pantry`);
  };

  const emptyState = (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIcon, { backgroundColor: theme.accentGlow, borderColor: theme.accent }]}>
        <Ionicons name="cart-outline" size={52} color={theme.accent} />
      </View>
      <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>Cart is empty</Text>
      <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>Swipe left on any pantry item to add it to your shopping list</Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg0 }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Shopping <Text style={{ color: theme.accent }}>Cart</Text></Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{context.shoppingList.length === 0 ? 'Nothing to buy' : `${totalItems} item${totalItems !== 1 ? 's' : ''} to restock`}</Text>
        </View>
        {context.shoppingList.length > 0 && (
          <TouchableOpacity style={[styles.clearBtn, { backgroundColor: theme.urgentBg, borderColor: theme.urgent }]} onPress={clearAll}>
            <Ionicons name="trash-outline" size={16} color={theme.urgent} />
            <Text style={[styles.clearBtnText, { color: theme.urgent }]}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {context.shoppingList.length === 0 ? emptyState : (
        <>
          <FlatList
            data={context.shoppingList}
            keyExtractor={i => i.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
            renderItem={({ item }) => {
              const qty = quantities[item.id] || 1;
              return (
                <Swipeable
                  renderRightActions={() => (
                    <TouchableOpacity style={styles.swipeDel} onPress={() => removeItem(item)}>
                      <Ionicons name="trash-outline" size={22} color="#FFF" />
                      <Text style={styles.swipeLabel}>Remove</Text>
                    </TouchableOpacity>
                  )}
                >
                  <View style={[styles.card, { backgroundColor: theme.bg1, borderColor: theme.border }]}>
                    {/* Emoji icon */}
                    <View style={[styles.emojiBox, { backgroundColor: theme.bg2, borderColor: theme.border }]}>
                      <Text style={{ fontSize: 26 }}>{getIcon(item.name)}</Text>
                    </View>

                    {/* Item info */}
                    <View style={{ flex: 1, marginLeft: 14 }}>
                      <Text style={[styles.itemName, { color: theme.textPrimary }]} numberOfLines={1}>{item.name}</Text>
                      <Text style={[styles.itemUnit, { color: theme.textMuted }]}>{item.qty}</Text>
                    </View>

                    {/* Quantity stepper */}
                    <View style={[styles.stepper, { backgroundColor: theme.bg2, borderColor: theme.border }]}>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => setQuantities(prev => ({ ...prev, [item.id]: Math.max(1, (prev[item.id] || 1) - 1) }))}
                      >
                        <Ionicons name="remove" size={16} color={theme.textSecondary} />
                      </TouchableOpacity>
                      <Text style={[styles.stepNum, { color: theme.textPrimary }]}>{qty}</Text>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => setQuantities(prev => ({ ...prev, [item.id]: (prev[item.id] || 1) + 1 }))}
                      >
                        <Ionicons name="add" size={16} color={theme.accent} />
                      </TouchableOpacity>
                    </View>

                    {/* Buy button */}
                    <TouchableOpacity
                      style={[styles.buyBtn, { backgroundColor: theme.accent }]}
                      onPress={() => {
                        setSelectedItemForDate(item);
                        setCalendarMonth(new Date().getMonth());
                        setCalendarYear(new Date().getFullYear());
                        setDatePickerModal(true);
                      }}
                    >
                      <Ionicons name="checkmark" size={18} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                </Swipeable>
              );
            }}
          />

          {/* Bottom Action Bar */}
          <View style={styles.actionBar}>
            <TouchableOpacity style={[styles.buyAllBtn, { backgroundColor: theme.accent }]} onPress={buyAll}>
              <Ionicons name="bag-check-outline" size={18} color="#FFF" />
              <Text style={styles.buyAllText}>Buy All · {totalItems} items</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Date Picker Modal */}
      <Modal visible={datePickerModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: theme.bg1, borderColor: theme.border }]}>
            <View style={[styles.modalHandle, { backgroundColor: theme.border }]} />
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Set Expiry Date</Text>
              <TouchableOpacity onPress={() => setDatePickerModal(false)} style={[styles.closeBtn, { backgroundColor: theme.bg2 }]}>
                <Ionicons name="close" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedItemForDate && (
              <>
                {/* Month navigator */}
                <View style={styles.monthNav}>
                  <TouchableOpacity onPress={() => {
                    if (calendarMonth === 0) { setCalendarMonth(11); setCalendarYear(y => y - 1); }
                    else setCalendarMonth(m => m - 1);
                  }} style={[styles.monthArrow, { backgroundColor: theme.bg2 }]}>
                    <Ionicons name="chevron-back" size={20} color={theme.accent} />
                  </TouchableOpacity>
                  <Text style={[styles.monthLabel, { color: theme.textPrimary }]}>{MONTHS[calendarMonth]} {calendarYear}</Text>
                  <TouchableOpacity onPress={() => {
                    if (calendarMonth === 11) { setCalendarMonth(0); setCalendarYear(y => y + 1); }
                    else setCalendarMonth(m => m + 1);
                  }} style={[styles.monthArrow, { backgroundColor: theme.bg2 }]}>
                    <Ionicons name="chevron-forward" size={20} color={theme.accent} />
                  </TouchableOpacity>
                </View>

                {/* Weekday labels */}
                <View style={styles.weekRow}>
                  {DAYS_SHORT.map(d => <Text key={d} style={[styles.weekDay, { color: theme.textMuted }]}>{d}</Text>)}
                </View>

                {/* Calendar grid */}
                <View style={styles.calGrid}>
                  {Array.from({ length: getFirstDay(calendarMonth, calendarYear) }).map((_, i) => <View key={`e${i}`} style={styles.dayCell} />)}
                  {Array.from({ length: getDaysInMonth(calendarMonth, calendarYear) }).map((_, i) => {
                    const day = i + 1;
                    const date = new Date(calendarYear, calendarMonth, day);
                    const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));
                    const formatted = formatDate(date);
                    return (
                      <TouchableOpacity
                        key={day}
                        style={[styles.dayCell, { backgroundColor: theme.bg2, borderColor: theme.border }, isPast && styles.dayCellPast]}
                        disabled={isPast}
                        onPress={async () => {
                          await replenish(selectedItemForDate, formatted);
                          setDatePickerModal(false);
                        }}
                      >
                        <Text style={[styles.dayText, { color: theme.textPrimary }, isPast && { color: theme.textMuted }]}>{day}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <TouchableOpacity
                  style={[styles.skipDateBtn, { backgroundColor: theme.bg2, borderColor: theme.border }]}
                  onPress={async () => { await replenish(selectedItemForDate); setDatePickerModal(false); }}
                >
                  <Text style={[styles.skipDateText, { color: theme.textSecondary }]}>Add with default expiry</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 24, paddingBottom: 16 },
  title: { fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, marginTop: 4 },
  clearBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: RADIUS.pill, paddingVertical: 8, paddingHorizontal: 14, borderWidth: 1 },
  clearBtnText: { fontSize: 13, fontWeight: '600' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 14, paddingHorizontal: 30 },
  emptyIcon: { width: 100, height: 100, borderRadius: 50, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  emptyTitle: { fontSize: 22, fontWeight: '700' },
  emptySubtitle: { fontSize: 14, textAlign: 'center' },
  card: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: RADIUS.lg,
    padding: 14, marginBottom: 10, borderWidth: 1,
  },
  emojiBox: { width: 50, height: 50, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  itemName: { fontSize: 15, fontWeight: '700' },
  itemUnit: { fontSize: 12, marginTop: 2 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 10, borderRadius: RADIUS.pill, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1 },
  stepBtn: { padding: 2 },
  stepNum: { fontSize: 15, fontWeight: '700', minWidth: 20, textAlign: 'center' },
  buyBtn: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  swipeDel: { backgroundColor: '#FF4757', justifyContent: 'center', alignItems: 'center', width: 80, borderRadius: RADIUS.lg, marginBottom: 10, gap: 4 },
  swipeLabel: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  actionBar: { position: 'absolute', bottom: 16, left: 20, right: 20 },
  buyAllBtn: { borderRadius: RADIUS.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  buyAllText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, borderWidth: 1 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700' },
  closeBtn: { padding: 8, borderRadius: RADIUS.sm },
  monthNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  monthArrow: { padding: 8, borderRadius: RADIUS.sm },
  monthLabel: { fontSize: 17, fontWeight: '700' },
  weekRow: { flexDirection: 'row', marginBottom: 8 },
  weekDay: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 20 },
  dayCell: { width: '13%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', borderRadius: RADIUS.sm, borderWidth: 1 },
  dayCellPast: { opacity: 0.25 },
  dayText: { fontSize: 14, fontWeight: '600' },
  skipDateBtn: { borderRadius: RADIUS.md, paddingVertical: 13, alignItems: 'center', borderWidth: 1 },
  skipDateText: { fontSize: 14, fontWeight: '600' },
});