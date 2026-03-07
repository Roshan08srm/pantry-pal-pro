import React from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView } from 'react-native';

// 1. MOCK DATA (Simulating your 1,284 SKUs)
const inventoryData = [
  { id: '1', name: 'Organic Milk', quantity: 50, expiry: '2026-03-10', price: 65 },
  { id: '2', name: 'Whole Wheat Bread', quantity: 20, expiry: '2026-03-09', price: 40 },
  { id: '3', name: 'Basmati Rice (5kg)', quantity: 150, expiry: '2026-12-01', price: 450 },
  { id: '4', name: 'Eggs (1 Dozen)', quantity: 30, expiry: '2026-03-11', price: 80 },
  { id: '5', name: 'Tomato Ketchup', quantity: 85, expiry: '2026-08-15', price: 120 },
];

// 2. LOGIC: Calculate Expiry Status Badge
const getExpiryStatus = (expiryDate) => {
  const today = new Date('2026-03-08'); // Mocking today's date based on Sprint 1
  const expDate = new Date(expiryDate);
  const diffTime = Math.abs(expDate - today);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

  if (diffDays <= 3) {
    return { label: 'CRITICAL', color: '#FF3B30', bgColor: '#FFE5E5' }; // Red
  } else if (diffDays <= 7) {
    return { label: 'EXPIRING SOON', color: '#FF9500', bgColor: '#FFF2E5' }; // Yellow
  } else {
    return { label: 'SAFE', color: '#34C759', bgColor: '#E5F9E7' }; // Green
  }
};

export default function InventoryMatrix() {

  // 3. UI: How a single row looks
  const renderItem = ({ item }) => {
    const status = getExpiryStatus(item.expiry);

    return (
      <View style={styles.row}>
        <View style={styles.infoCol}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemDetails}>Qty: {item.quantity} | ₹{item.price}</Text>
        </View>
        
        <View style={styles.statusCol}>
          <View style={[styles.badge, { backgroundColor: status.bgColor }]}>
            <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
          </View>
          <Text style={styles.expiryText}>Exp: {item.expiry}</Text>
        </View>
      </View>
    );
  };

  // 4. MAIN RENDER: The FlatList
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bulk Inventory Matrix</Text>
        <Text style={styles.headerSubtitle}>Active SKUs: {inventoryData.length} / 1284</Text>
      </View>

      <FlatList
        data={inventoryData}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

// 5. STYLES (Your CSS equivalent)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  listContainer: {
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoCol: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 14,
    color: '#666666',
  },
  statusCol: {
    alignItems: 'flex-end',
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginBottom: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  expiryText: {
    fontSize: 12,
    color: '#8E8E93',
  },
});