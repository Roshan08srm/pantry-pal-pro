import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React, { createContext, useEffect, useState } from 'react';
import { View, ActivityIndicator, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { db } from '../../utils/firebase';
import { 
  collection, query, where, onSnapshot, setDoc, doc, updateDoc, deleteDoc, writeBatch 
} from 'firebase/firestore';
import { registerForPushNotificationsAsync, scheduleDailyExpiryNotifications } from '../../utils/notifications';
import { COLORS } from '../../utils/theme';

export interface InventoryItem {
  id: string; name: string; qty: string; exp: string; status: 'warning' | 'normal'; is_deleted?: number;
}

export interface BillItem {
  id: string; uri: string; date: string; itemCount: number;
}

export const InventoryContext = createContext<{
  inventory: InventoryItem[];
  shoppingList: InventoryItem[];
  deletedInventory: InventoryItem[];
  bills: BillItem[];
  addItemToInventory: (item: InventoryItem) => Promise<void>;
  softDeleteInventoryItem: (id: string) => Promise<void>;
  restoreInventoryItem: (id: string) => Promise<void>;
  permanentDeleteInventoryItem: (id: string) => Promise<void>;
  clearInventory: () => Promise<void>;
  addShoppingItem: (item: InventoryItem) => Promise<void>;
  removeShoppingItem: (id: string) => Promise<void>;
  clearShoppingList: () => Promise<void>;
  refreshData: () => Promise<void>; // Kept for compatibility, but we use realtime listeners
  saveBill: (uri: string, itemCount: number) => Promise<void>;
  deleteBill: (id: string) => Promise<void>;
} | null>(null);

export default function TabLayout() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [shoppingList, setShoppingList] = useState<InventoryItem[]>([]);
  const [deletedInventory, setDeletedInventory] = useState<InventoryItem[]>([]);
  const [bills, setBills] = useState<BillItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    registerForPushNotificationsAsync();
  }, []);

  useEffect(() => {
    if (inventory && inventory.length > 0) {
      scheduleDailyExpiryNotifications(inventory);
    }
  }, [inventory]);

  // Firebase Realtime Listeners
  useEffect(() => {
    if (!user) {
      setInventory([]);
      setDeletedInventory([]);
      setShoppingList([]);
      setBills([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const qInventory = query(collection(db, 'inventory'), where('userId', '==', user.id), where('is_deleted', '==', 0));
    const unsubInventory = onSnapshot(qInventory, (snapshot) => {
      const items: any[] = [];
      snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
      setInventory(items.sort((a, b) => b.createdAt - a.createdAt)); // Fallback sorting if we add createdAt
    });

    const qDeleted = query(collection(db, 'inventory'), where('userId', '==', user.id), where('is_deleted', '==', 1));
    const unsubDeleted = onSnapshot(qDeleted, (snapshot) => {
      const items: any[] = [];
      snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
      setDeletedInventory(items);
    });

    const qShopping = query(collection(db, 'shopping_list'), where('userId', '==', user.id));
    const unsubShopping = onSnapshot(qShopping, (snapshot) => {
      const items: any[] = [];
      snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
      setShoppingList(items);
    });

    const qBills = query(collection(db, 'scan_history'), where('userId', '==', user.id));
    const unsubBills = onSnapshot(qBills, (snapshot) => {
      const items: any[] = [];
      snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
      setBills(items);
      setIsLoading(false);
    });

    return () => {
      unsubInventory();
      unsubDeleted();
      unsubShopping();
      unsubBills();
    };
  }, [user]);

  const refreshData = async () => {
    // No-op since we use real-time listeners
  };

  const addItemToInventory = async (item: InventoryItem) => {
    if (!user) return;
    const docRef = doc(db, 'inventory', item.id);
    await setDoc(docRef, { ...item, userId: user.id, is_deleted: 0, createdAt: Date.now() });
  };

  const softDeleteInventoryItem = async (id: string) => {
    if (!user) return;
    const docRef = doc(db, 'inventory', id);
    await updateDoc(docRef, { is_deleted: 1 });
  };

  const restoreInventoryItem = async (id: string) => {
    if (!user) return;
    const docRef = doc(db, 'inventory', id);
    await updateDoc(docRef, { is_deleted: 0 });
  };

  const permanentDeleteInventoryItem = async (id: string) => {
    if (!user) return;
    const docRef = doc(db, 'inventory', id);
    await deleteDoc(docRef);
  };

  const clearInventory = async () => {
    if (!user) return;
    const batch = writeBatch(db);
    inventory.forEach(item => {
      const docRef = doc(db, 'inventory', item.id);
      batch.update(docRef, { is_deleted: 1 });
    });
    await batch.commit();
  };

  const addShoppingItem = async (item: InventoryItem) => {
    if (!user) return;
    const docRef = doc(db, 'shopping_list', item.id);
    await setDoc(docRef, { ...item, userId: user.id, createdAt: Date.now() });
  };

  const removeShoppingItem = async (id: string) => {
    if (!user) return;
    const docRef = doc(db, 'shopping_list', id);
    await deleteDoc(docRef);
  };

  const clearShoppingList = async () => {
    if (!user) return;
    const batch = writeBatch(db);
    shoppingList.forEach(item => {
      const docRef = doc(db, 'shopping_list', item.id);
      batch.delete(docRef);
    });
    await batch.commit();
  };

  const saveBill = async (uri: string, itemCount: number) => {
    if (!user) return;
    const id = Math.random().toString();
    const date = new Date().toISOString();
    const docRef = doc(db, 'scan_history', id);
    await setDoc(docRef, { id, userId: user.id, uri, date, itemCount, createdAt: Date.now() });
  };

  const deleteBill = async (id: string) => {
    if (!user) return;
    const docRef = doc(db, 'scan_history', id);
    await deleteDoc(docRef);
  };

  if (isLoading) return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg0, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator color={COLORS.accent} size="large" />
    </View>
  );

  const tabBarIconSize = 22;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: COLORS.bg0 }}>
      <InventoryContext.Provider value={{
        inventory, shoppingList, deletedInventory, bills,
        addItemToInventory, softDeleteInventoryItem, restoreInventoryItem,
        permanentDeleteInventoryItem, clearInventory,
        addShoppingItem, removeShoppingItem, clearShoppingList, refreshData,
        saveBill, deleteBill
      }}>
        <Tabs screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: theme.bg1,
            borderTopWidth: 1,
            borderTopColor: theme.border,
            height: Platform.OS === 'ios' ? 85 : 68,
            paddingBottom: Platform.OS === 'ios' ? 24 : 10,
            paddingTop: 8,
          },
          tabBarActiveTintColor: theme.accent,
          tabBarInactiveTintColor: theme.textMuted,
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 2 },
        }}>
          <Tabs.Screen name="index" options={{
            title: 'Stock',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'grid' : 'grid-outline'} size={tabBarIconSize} color={color} />
            )
          }} />
          <Tabs.Screen name="scanner" options={{
            title: 'Scan',
            tabBarIcon: ({ color, focused }) => (
              <View style={focused ? {
                backgroundColor: theme.accent, width: 52, height: 52, borderRadius: 26,
                justifyContent: 'center', alignItems: 'center', marginBottom: 10,
              } : {}}>
                <Ionicons name="scan-outline" size={focused ? 26 : tabBarIconSize} color={focused ? '#FFF' : color} />
              </View>
            ),
          }} />
          <Tabs.Screen name="shopping" options={{
            title: 'Cart',
            tabBarIcon: ({ color, focused }) => (
              <View>
                <Ionicons name={focused ? 'cart' : 'cart-outline'} size={tabBarIconSize} color={color} />
                {shoppingList.length > 0 && (
                  <View style={{ position: 'absolute', top: -4, right: -8, backgroundColor: theme.urgent, width: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}>
                    <View style={{ backgroundColor: theme.urgent, borderRadius: 8 }}>
                    </View>
                  </View>
                )}
              </View>
            )
          }} />
          <Tabs.Screen name="recipes" options={{
            title: 'Recipes',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'restaurant' : 'restaurant-outline'} size={tabBarIconSize} color={color} />
            )
          }} />
          <Tabs.Screen name="settings" options={{
            title: 'Settings',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'settings' : 'settings-outline'} size={tabBarIconSize} color={color} />
            )
          }} />
        </Tabs>
      </InventoryContext.Provider>
    </GestureHandlerRootView>
  );
}