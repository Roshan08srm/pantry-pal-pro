import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useContext, useEffect, useState, useMemo } from 'react';
import {
  ActivityIndicator, FlatList, Image, Modal,
  SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { fetchRecipeDetails, fetchRecipesForInventory } from '../../utils/api';
import { getDaysUntilExpiry, isEdibleItem } from '../../utils/expiryUtils';
import { useTheme } from '../../contexts/ThemeContext';
import { RADIUS } from '../../utils/theme';
import { InventoryContext } from './_layout';

interface RankedRecipe {
  meal: any;
  matchCount: number;
  matchedItems: string[];
  minRequired: number;
}

export default function RecipesScreen() {
  const context = useContext(InventoryContext);
  const { theme } = useTheme();
  const [selected, setSelected] = useState<any>(null);
  const [recipes, setRecipes] = useState<RankedRecipe[]>([]);
  const [loadingMeals, setLoadingMeals] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

  const sortedInventory = useMemo(() => {
    if (!context?.inventory) return [];
    
    // Deduplicate by name and filter for raw ingredients
    const uniqueItems = new Map<string, any>();
    [...context.inventory]
      .filter(i => isEdibleItem(i.name))
      .forEach(i => {
        const normalized = i.name.trim().toUpperCase();
        if (!uniqueItems.has(normalized)) {
          uniqueItems.set(normalized, i);
        }
      });

    return Array.from(uniqueItems.values())
      .sort((a, b) => getDaysUntilExpiry(a.exp) - getDaysUntilExpiry(b.exp));
  }, [context?.inventory]);

  const loadRecipes = useCallback(async () => {
    if (!sortedInventory || sortedInventory.length === 0) {
      setRecipes([]);
      return;
    }
    setLoadingMeals(true);
    const names = selectedFilter 
      ? [selectedFilter] 
      : sortedInventory.map((i: any) => i.name);
      
    const ranked = await fetchRecipesForInventory(names, 16);
    setRecipes(ranked);
    setLoadingMeals(false);
  }, [sortedInventory, selectedFilter]);

  useEffect(() => { loadRecipes(); }, [loadRecipes]);

  const openRecipe = async (idMeal: string) => {
    setLoadingDetails(true);
    setSelected('loading');
    const details = await fetchRecipeDetails(idMeal);
    setLoadingDetails(false);
    setSelected(details || null);
  };

  const getIngredientsList = (meal: any): string[] => {
    const list: string[] = [];
    for (let i = 1; i <= 20; i++) {
      const ing = meal[`strIngredient${i}`];
      const meas = meal[`strMeasure${i}`];
      if (ing?.trim()) list.push(`${meas?.trim() || ''} ${ing}`.trim());
    }
    return list;
  };

  const matchBadgeColor = (count: number, min: number) => {
    if (count >= min * 2) return { bg: theme.safeBg,    text: theme.safe };    // 2x minimum — great coverage
    if (count >= min)     return { bg: theme.warningBg, text: theme.warning }; // just meets minimum
    return                       { bg: theme.accentGlow, text: theme.accent };  // fallback
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg0 }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Smart <Text style={{ color: theme.accent }}>Recipes</Text></Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {context?.inventory.length
              ? `Based on your ${context.inventory.length} pantry item${context.inventory.length !== 1 ? 's' : ''}`
              : 'Add items to get suggestions'}
          </Text>
        </View>
        <TouchableOpacity style={[styles.refreshBtn, { backgroundColor: theme.bg1, borderColor: theme.border }]} onPress={loadRecipes} disabled={loadingMeals}>
          {loadingMeals
            ? <ActivityIndicator color={theme.accent} size="small" />
            : <Ionicons name="refresh" size={20} color={theme.accent} />
          }
        </TouchableOpacity>
      </View>

      {/* Inventory pill pills */}
      {sortedInventory.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsRow}
        >
          {sortedInventory.slice(0, 10).map((item: any) => {
            const isActive = selectedFilter === item.name;
            const days = getDaysUntilExpiry(item.exp);
            let pillStyle: any = [styles.inventoryPill, { backgroundColor: theme.accentGlow, borderColor: theme.accent }];
            let textStyle: any = [styles.inventoryPillText, { color: theme.accent }];
            
            if (isActive) {
              pillStyle = [styles.inventoryPill, { backgroundColor: theme.accent, borderColor: theme.accent }];
              textStyle = [styles.inventoryPillText, { color: '#FFF' }];
            } else if (days <= 7) {
              pillStyle = [styles.inventoryPill, { borderColor: theme.urgent, backgroundColor: theme.urgentBg }];
              textStyle = [styles.inventoryPillText, { color: theme.urgent }];
            }

            return (
              <TouchableOpacity 
                key={item.id} 
                style={pillStyle}
                onPress={() => setSelectedFilter(isActive ? null : item.name)}
              >
                <Text style={textStyle} numberOfLines={1}>
                  {item.name.toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
          {sortedInventory.length > 10 && (
            <View style={[styles.inventoryPill, { backgroundColor: theme.bg3, borderColor: theme.bg3 }]}>
              <Text style={[styles.inventoryPillText, { color: theme.textMuted }]}>+{sortedInventory.length - 10} more</Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Content */}
      {loadingMeals ? (
        <View style={styles.centered}>
          <ActivityIndicator color={theme.accent} size="large" />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Finding recipes from your pantry...</Text>
        </View>
      ) : recipes.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: theme.accentGlow, borderColor: theme.accent }]}>
            <Ionicons name="restaurant-outline" size={48} color={theme.accent} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No recipes yet</Text>
          <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
            Scan a grocery bill to populate your pantry, then recipes will be suggested based on what you have
          </Text>
          <TouchableOpacity style={[styles.retryBtn, { backgroundColor: theme.accentGlow, borderColor: theme.accent }]} onPress={loadRecipes}>
            <Ionicons name="refresh" size={16} color={theme.accent} />
            <Text style={[styles.retryBtnText, { color: theme.accent }]}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={item => item.meal.idMeal}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item: { meal, matchCount, matchedItems, minRequired } }) => {
            const badge = matchBadgeColor(matchCount, minRequired);
            return (
              <TouchableOpacity
                style={[styles.card, { backgroundColor: theme.bg1, borderColor: theme.border }]}
                onPress={() => openRecipe(meal.idMeal)}
                activeOpacity={0.8}
              >
                <Image source={{ uri: meal.strMealThumb }} style={styles.cardThumb} />
                <View style={styles.cardBody}>
                  <Text style={[styles.cardTitle, { color: theme.textPrimary }]} numberOfLines={2}>{meal.strMeal}</Text>

                  {/* Matched items from pantry */}
                  {matchedItems.length > 0 && (
                    <View style={styles.matchRow}>
                      <Ionicons name="checkmark-circle" size={13} color={badge.text} />
                      <Text style={[styles.matchText, { color: badge.text }]} numberOfLines={1}>
                        {matchedItems.map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(' · ')}
                      </Text>
                    </View>
                  )}

                  <View style={styles.cardFooter}>
                    <View style={[styles.matchBadge, { backgroundColor: badge.bg }]}>
                      <Text style={[styles.matchBadgeText, { color: badge.text }]}>
                        {matchCount} pantry item{matchCount !== 1 ? 's' : ''} ready
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Detail Modal */}
      <Modal visible={!!selected} animationType="slide" transparent onRequestClose={() => setSelected(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: theme.bg1, borderColor: theme.border }]}>
            <View style={[styles.modalHandle, { backgroundColor: theme.border }]} />

            {selected === 'loading' || loadingDetails ? (
              <View style={styles.centered}>
                <ActivityIndicator color={theme.accent} size="large" />
                <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading recipe...</Text>
              </View>
            ) : selected && typeof selected === 'object' ? (
              <>
                <View style={styles.modalHeaderRow}>
                  <Image source={{ uri: selected.strMealThumb }} style={styles.modalThumb} />
                  <TouchableOpacity onPress={() => setSelected(null)} style={[styles.closeBtn, { backgroundColor: theme.bg2 }]}>
                    <Ionicons name="close" size={20} color={theme.textSecondary} />
                  </TouchableOpacity>
                </View>

                <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>{selected.strMeal}</Text>
                <Text style={[styles.modalCategory, { color: theme.textMuted }]}>{selected.strCategory} · {selected.strArea}</Text>

                <ScrollView showsVerticalScrollIndicator={false} style={{ flexGrow: 1, marginTop: 12 }}>
                  <Text style={[styles.sectionLabel, { color: theme.accent }]}>INGREDIENTS</Text>
                  <View style={styles.ingredientsGrid}>
                    {getIngredientsList(selected).map((ing, idx) => (
                      <View key={idx} style={[styles.ingredientChip, { backgroundColor: theme.bg2, borderColor: theme.border }]}>
                        <Text style={[styles.ingredientText, { color: theme.textSecondary }]}>{ing}</Text>
                      </View>
                    ))}
                  </View>

                  <Text style={[styles.sectionLabel, { color: theme.accent }]}>HOW TO PREPARE</Text>
                  {selected.strInstructions.split(/[.\r\n]+/).filter((s: string) => s.trim().length > 3).map((step: string, idx: number) => (
                    <View key={idx} style={styles.stepRow}>
                      <View style={[styles.stepNumber, { backgroundColor: theme.accentGlow, borderColor: theme.accent }]}>
                        <Text style={[styles.stepNumberText, { color: theme.accent }]}>{idx + 1}</Text>
                      </View>
                      <Text style={[styles.stepText, { color: theme.textPrimary }]}>{step.trim()}.</Text>
                    </View>
                  ))}
                  <View style={{ height: 30 }} />
                </ScrollView>

                <TouchableOpacity style={[styles.doneBtn, { backgroundColor: theme.accent }]} onPress={() => setSelected(null)}>
                  <Text style={styles.doneBtnText}>Done</Text>
                </TouchableOpacity>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'flex-end', paddingTop: 24, paddingBottom: 12 },
  title: { fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, marginTop: 4 },
  refreshBtn: {
    padding: 10, borderRadius: RADIUS.md,
    borderWidth: 1, marginLeft: 10,
  },
  pillsRow: { paddingBottom: 14, gap: 8 },
  inventoryPill: {
    borderRadius: RADIUS.pill,
    paddingHorizontal: 14, borderWidth: 1,
    height: 36, justifyContent: 'center', alignSelf: 'flex-start',
  },
  inventoryPillText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 14, paddingTop: 60 },
  loadingText: { fontSize: 14 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 14, paddingHorizontal: 20 },
  emptyIcon: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 1,
    justifyContent: 'center', alignItems: 'center',
  },
  emptyTitle: { fontSize: 20, fontWeight: '700' },
  emptySubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8,
    borderRadius: RADIUS.pill,
    paddingVertical: 10, paddingHorizontal: 20, borderWidth: 1,
  },
  retryBtnText: { fontSize: 14, fontWeight: '600' },
  card: {
    flexDirection: 'row',
    borderRadius: RADIUS.lg, marginBottom: 12,
    borderWidth: 1, overflow: 'hidden',
  },
  cardThumb: { width: 96, height: 96 },
  cardBody: { flex: 1, padding: 12, justifyContent: 'space-between' },
  cardTitle: { fontSize: 14, fontWeight: '700', lineHeight: 20, marginBottom: 4 },
  matchRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  matchText: { fontSize: 11, fontWeight: '600', flex: 1 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  matchBadge: { borderRadius: RADIUS.pill, paddingVertical: 3, paddingHorizontal: 8 },
  matchBadgeText: { fontSize: 11, fontWeight: '700' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  modalSheet: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, maxHeight: '90%', borderWidth: 1,
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  modalThumb: { width: 84, height: 84, borderRadius: RADIUS.md },
  closeBtn: { padding: 8, borderRadius: RADIUS.sm },
  modalTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.3, marginBottom: 4 },
  modalCategory: { fontSize: 13, marginBottom: 18 },
  sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.4, marginBottom: 10, marginTop: 16 },
  ingredientsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  ingredientChip: {
    borderRadius: RADIUS.pill,
    paddingVertical: 6, paddingHorizontal: 12, borderWidth: 1,
  },
  ingredientText: { fontSize: 12 },
  stepRow: { flexDirection: 'row', marginBottom: 16, gap: 12 },
  stepNumber: {
    width: 24, height: 24, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1,
  },
  stepNumberText: { fontSize: 12, fontWeight: '800' },
  stepText: { fontSize: 14, lineHeight: 22, flex: 1 },
  instructions: { fontSize: 14, lineHeight: 22 },
  doneBtn: { borderRadius: RADIUS.md, paddingVertical: 14, alignItems: 'center', marginTop: 12 },
  doneBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
});