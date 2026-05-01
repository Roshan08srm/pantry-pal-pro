import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useContext, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { isEdibleItem } from '../../utils/expiryUtils';
import { useTheme } from '../../contexts/ThemeContext';
import { RADIUS } from '../../utils/theme';
import { InventoryContext } from './_layout';

const GOOGLE_API_KEY = 'AIzaSyB9Vc5VYphNuV51lmYbkNmg3Otcvp5yZFo';

// Words that appear in your bill that we MUST block
const BLOCK_LIST = [
  'particular', 'rate', 'qty', 'amt', 'total', 'bill', 'shop', 'address', 
  'c-name', 'note', 'tax', 'cash', 'gst', 'bengaluru', 'road', 'tower', 'ph:', 'no'
];

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const context = useContext(InventoryContext);
  const { theme } = useTheme();
  const router = useRouter();
  const cameraRef = useRef<any>(null);
  const [scanMode, setScanMode] = useState<'receipt' | 'grocery'>('receipt');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentImageUri, setCurrentImageUri] = useState<string | null>(null);
  const [scannedItems, setScannedItems] = useState<{name: string, days: number, customDate: string}[]>([]);
  const [skippedItems, setSkippedItems] = useState<string[]>([]);
  const [datePickerModal, setDatePickerModal] = useState(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());

  // Get days in month
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Get first day of month (0-6, 0=Sunday)
  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  // Format date for display (DD MMM YYYY)
  const formatDate = (date: Date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  // Smart shelf life presets: 7d=Dairy, 14d=Veggies/Fruits, 90d=Grains/Pantry
  const PRESETS = [
    { days: 7,  color: theme.urgent,  bg: theme.urgentBg },
    { days: 14, color: theme.warning, bg: theme.warningBg },
    { days: 90, color: theme.safe,    bg: theme.safeBg },
  ];

  // Auto-detect the most likely preset for an item (used to pre-select)
  const getRecommendedPreset = (itemName: string): number => {
    const n = itemName.toLowerCase();
    if (n.includes('milk') || n.includes('yogurt') || n.includes('paneer') ||
        n.includes('curd') || n.includes('butter') || n.includes('cream') ||
        n.includes('cheese') || n.includes('bread') || n.includes('chicken') ||
        n.includes('meat') || n.includes('fish') || n.includes('egg')) return 7;
    if (n.includes('apple') || n.includes('tomato') || n.includes('onion') ||
        n.includes('vegetable') || n.includes('carrot') || n.includes('broccoli') ||
        n.includes('spinach') || n.includes('pepper') || n.includes('fruit') ||
        n.includes('lemon') || n.includes('mango') || n.includes('banana')) return 14;
    return 90; // rice, sugar, flour, lentils, pasta, etc.
  };

  const applyPreset = (itemIdx: number, days: number) => {
    const u = [...scannedItems];
    const d = new Date();
    d.setDate(d.getDate() + days);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    u[itemIdx].customDate = `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    u[itemIdx].days = Math.ceil((d.getTime() - new Date().setHours(0,0,0,0)) / 86400000);
    setScannedItems(u);
  };

  if (!permission?.granted) return (
    <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
      <TouchableOpacity onPress={requestPermission} style={{ padding: 20, backgroundColor: 'rgba(0, 210, 255, 0.1)', borderRadius: 12 }}>
        <Text style={{ color: '#00D2FF', fontSize: 18, fontWeight: '700' }}>Enable Camera</Text>
      </TouchableOpacity>
    </View>
  );

  const getExp = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  const capturePhoto = async () => {
    if (!cameraRef.current) return;
    setIsProcessing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.5 });
      await processImage(photo.uri, photo.base64);
    } catch (e) { Alert.alert("Error", "Check Connection"); }
    setIsProcessing(false);
  };

  const pickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        setIsProcessing(true);
        const imageUri = result.assets[0].uri;
        const base64 = await FileSystem.readAsStringAsync(imageUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        await processImage(imageUri, base64);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image from gallery");
    }
  };

  const processImage = async (uri: string, base64: string) => {
    try {
      setCurrentImageUri(uri);
      
      const features = scanMode === 'receipt' 
        ? [{ type: 'TEXT_DETECTION' }]
        : [{ type: 'LABEL_DETECTION', maxResults: 15 }, { type: 'OBJECT_LOCALIZATION', maxResults: 15 }];

      const res = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_API_KEY}`, {
        method: 'POST',
        body: JSON.stringify({ requests: [{ image: { content: base64 }, features }] })
      });
      const data = await res.json();
      
      if (scanMode === 'receipt') {
        const text = data.responses[0]?.textAnnotations?.[0]?.description;
        if (text) {
          extractItems(text);
        } else {
          Alert.alert("No Text Found", "Could not read bill text. Please try again.");
        }
      } else {
        extractObjects(data.responses[0]);
      }
    } catch (e) { 
      Alert.alert("Error", "Check Connection"); 
    }
    setIsProcessing(false);
  };

  const extractObjects = (visionResponse: any) => {
    const labels = visionResponse?.labelAnnotations || [];
    const objects = visionResponse?.localizedObjectAnnotations || [];
    
    // Combine names from labels and objects
    const detectedNames = [
      ...labels.map((l: any) => l.description),
      ...objects.map((o: any) => o.name)
    ];

    if (detectedNames.length === 0) {
      Alert.alert('No Items Detected', 'Could not identify any items. Please try a different angle or closer shot.');
      return;
    }

    const validItems: string[] = [];
    const nonEdibleItems: string[] = [];

    // Our strict food keywords from extractItems
    const FOOD_KEYWORDS = [
      'milk', 'bread', 'butter', 'cheese', 'yogurt', 'curd', 'paneer', 'cream', 'ghee',
      'egg', 'eggs', 'chicken', 'beef', 'lamb', 'pork', 'fish', 'prawn', 'mutton', 'meat',
      'rice', 'wheat', 'flour', 'pasta', 'noodle', 'cereal', 'oat', 'barley', 'grain',
      'apple', 'banana', 'mango', 'orange', 'grapes', 'strawberry', 'lemon', 'lime',
      'watermelon', 'papaya', 'guava', 'pineapple', 'cherry', 'peach', 'pear', 'plum',
      'tomato', 'potato', 'onion', 'carrot', 'spinach', 'cabbage', 'broccoli', 'cauliflower',
      'peas', 'bean', 'lentil', 'chickpea', 'corn', 'cucumber', 'capsicum', 'garlic', 'ginger',
      'salt', 'sugar', 'honey', 'jam', 'sauce', 'ketchup', 'mustard', 'vinegar', 'oil', 'ghee',
      'juice', 'water', 'soda', 'coffee', 'tea', 'cocoa', 'chocolate', 'biscuit', 'cookie',
      'chip', 'cracker', 'snack', 'wafer', 'candy', 'sweets', 'cake', 'pudding',
      'soup', 'pickle', 'mayonnaise', 'dressing', 'syrup', 'caramel', 'marmalade',
      'almond', 'walnut', 'cashew', 'peanut', 'nut', 'seed', 'dried fruit',
      'whole wheat', 'organic', 'fresh', 'food', 'vegetable', 'fruit', 'drink', 'beverage', 'bottle', 'can', 'jar', 'packaged goods', 'produce'
    ];

    for (const name of detectedNames) {
      const lowerName = name.toLowerCase();
      
      // Skip very generic labels that don't add value
      if (['food', 'ingredient', 'recipe', 'cuisine', 'dish', 'plant', 'natural foods', 'local food', 'superfood', 'junk food', 'fast food', 'comfort food', 'staple food', 'produce', 'vegetable', 'fruit'].includes(lowerName)) {
        continue;
      }

      const isFood = FOOD_KEYWORDS.some(kw => lowerName.includes(kw));

      if (isFood) {
        if (!validItems.some(v => v.toLowerCase() === lowerName)) {
          // Capitalize first letter
          const formatted = name.charAt(0).toUpperCase() + name.slice(1);
          validItems.push(formatted);
        }
      } else {
        if (!nonEdibleItems.some(v => v.toLowerCase() === lowerName)) {
          nonEdibleItems.push(name);
        }
      }
    }

    if (validItems.length === 0) {
      Alert.alert('No Groceries Found', `Detected non-food items like "${detectedNames[0] || 'Unknown'}". Ensure the items are well-lit.`);
      return;
    }

    // Limit to top 8 items so UI isn't overwhelmed
    const finalItems = validItems.slice(0, 8);
    
    setScannedItems(finalItems.map(name => ({ name, days: 14, customDate: getExp(14) })));
    setSkippedItems([]); // Skip skipped banner for objects to reduce noise
  };

  const extractItems = (text: string) => {
    const lowerText = text.toLowerCase();
    
    // Step 1: Validate it's a bill
    const billKeywords = ['total', 'subtotal', 'tax', 'gst', 'bill', 'receipt', 'invoice', 'cash', 'mart', 'store', 'amount'];
    if (!billKeywords.some(kw => lowerText.includes(kw))) {
      Alert.alert('Not a Bill', 'This image does not appear to be a receipt. Please scan a valid grocery bill.');
      return;
    }

    // Step 2: Block lines that look like store headers / addresses / metadata
    const HEADER_BLOCK = [
      'store', 'street', ' st ', 'main', 'ave', 'blvd', 'road', 'lane', 'city', 'state', 'zip',
      'phone', 'tel:', 'www.', 'http', '.com', 'receipt', 'thank you', 'cashier', 'manager',
      'transaction', 'approved', 'invoice', 'subtotal', 'discount', 'visa', 'mastercard',
      'sample', 'walkthrough', 'scanner', 'module', 'bundled', 'node_modules', 'antigravity',
      'supermarket', 'supervalu', 'valu-mart', 'pantry', 'grocery lane', 'date:', 'time:',
      'am', ' pm', 'today', 'yesterday'
    ];

    // Step 3: STRICT positive food allowlist — item must contain one of these to qualify
    const FOOD_KEYWORDS = [
      'milk', 'bread', 'butter', 'cheese', 'yogurt', 'curd', 'paneer', 'cream', 'ghee',
      'egg', 'eggs', 'chicken', 'beef', 'lamb', 'pork', 'fish', 'prawn', 'mutton', 'meat',
      'rice', 'wheat', 'flour', 'pasta', 'noodle', 'cereal', 'oat', 'barley', 'grain',
      'apple', 'banana', 'mango', 'orange', 'grapes', 'strawberry', 'lemon', 'lime',
      'watermelon', 'papaya', 'guava', 'pineapple', 'cherry', 'peach', 'pear', 'plum',
      'tomato', 'potato', 'onion', 'carrot', 'spinach', 'cabbage', 'broccoli', 'cauliflower',
      'peas', 'bean', 'lentil', 'chickpea', 'corn', 'cucumber', 'capsicum', 'garlic', 'ginger',
      'salt', 'sugar', 'honey', 'jam', 'sauce', 'ketchup', 'mustard', 'vinegar', 'oil', 'ghee',
      'juice', 'water', 'soda', 'coffee', 'tea', 'cocoa', 'chocolate', 'biscuit', 'cookie',
      'chip', 'cracker', 'snack', 'wafer', 'candy', 'sweets', 'cake', 'pudding',
      'soup', 'pickle', 'mayonnaise', 'dressing', 'syrup', 'caramel', 'marmalade',
      'almond', 'walnut', 'cashew', 'peanut', 'nut', 'seed', 'dried fruit',
      'whole wheat', 'organic', 'fresh'
    ];

    const rawLines = text.split('\n').map(l => l.trim()).filter(l => l.length > 2);
    const validItems: string[] = [];
    const nonEdibleItems: string[] = [];
    const priceRegex = /\$?\d+\.\d{2}/;

    for (const line of rawLines) {
      const lowerLine = line.toLowerCase();

      // Skip very short lines
      if (line.length < 4) continue;

      // Skip lines that look like headers, addresses, numbers-only, or metadata
      if (HEADER_BLOCK.some(h => lowerLine.includes(h))) continue;
      if (/^\d+(\.\d+)?$/.test(line.replace(/[,$]/g, ''))) continue; // pure number
      if (/^(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/.test(line)) continue; // date
      if (/^\d{1,2}:\d{2}/.test(line)) continue; // time

      // Clean the item name
      let itemName = line
        .replace(priceRegex, '')
        .replace(/\d+\s*(gal|lb|oz|pk|kg|g|l|ml|unit|pcs|pc|x)/gi, '')
        .replace(/^[\d\s#.]+/, '') // strip leading serial/hash numbers
        .replace(/[^a-zA-Z\s'-]/g, '') // keep only letters, spaces, hyphen, apostrophe
        .replace(/\s{2,}/g, ' ')
        .trim();

      // Must be meaningful length after cleaning
      if (itemName.length < 3) continue;

      // Word count sanity: reject if more than 6 words (likely a sentence/address)
      if (itemName.split(' ').length > 6) continue;

      const lowerItem = itemName.toLowerCase();

      // STRICT: must match a known food keyword
      const isFood = FOOD_KEYWORDS.some(kw => lowerItem.includes(kw));

      if (isFood) {
        if (!validItems.some(v => v.toLowerCase() === lowerItem)) {
          validItems.push(itemName.toUpperCase());
        }
      } else {
        // Only add to non-edible if it passes a basic "looks like a product" check
        if (/[a-zA-Z]{3,}/.test(itemName) && !nonEdibleItems.includes(itemName.toUpperCase())) {
          nonEdibleItems.push(itemName.toUpperCase());
        }
      }
    }

    if (validItems.length === 0 && nonEdibleItems.length === 0) {
      Alert.alert('No Items Detected', 'No recognizable items were found. Ensure the bill is clear and well-lit.');
      return;
    }

    if (validItems.length === 0) {
      Alert.alert('No Groceries Found', `Found ${nonEdibleItems.length} non-food items but no groceries. Try a different bill.`);
      return;
    }

    setScannedItems(validItems.slice(0, 12).map(name => ({ name, days: 14, customDate: getExp(14) })));
    setSkippedItems(nonEdibleItems.slice(0, 20));
  };

  if (scannedItems.length > 0) return (
    <SafeAreaView style={[styles.confirmView, { backgroundColor: theme.bg0 }]}>
      <Text style={[styles.title, { color: theme.textPrimary }]}>Confirm <Text style={{ color: theme.accent }}>Stock</Text></Text>

      {skippedItems.length > 0 && (
        <View style={[styles.skippedBanner, { backgroundColor: theme.warningBg, borderLeftColor: theme.warning }]}>
          <Ionicons name="information-circle" size={18} color={theme.warning} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[styles.skippedTitle, { color: theme.warning }]}>{skippedItems.length} non-food item(s) excluded</Text>
            <Text style={[styles.skippedSubText, { color: theme.textMuted }]}>{skippedItems.join(', ')}</Text>
          </View>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
        {scannedItems.map((item, i) => {
          const recommended = getRecommendedPreset(item.name);
          return (
            <View key={i} style={[styles.card, { backgroundColor: theme.bg1, borderColor: theme.border }]}>
              <View style={[styles.cardStrip, { backgroundColor: theme.accent }]} />
              <View style={{ flex: 1, paddingLeft: 12, paddingRight: 10, paddingVertical: 12 }}>
                <TextInput
                  style={[styles.input, { color: theme.textPrimary }]}
                  value={item.name}
                  onChangeText={t => { const u = [...scannedItems]; u[i].name = t; setScannedItems(u); }}
                />

                {/* Quick preset chips */}
                <View style={styles.presetRow}>
                  {PRESETS.map(p => {
                    const isActive = item.days === p.days;
                    return (
                      <TouchableOpacity
                        key={p.days}
                        style={[
                          styles.presetChip,
                          { borderColor: p.color, backgroundColor: isActive ? p.color : p.bg },
                          recommended === p.days && !isActive && styles.presetChipRecommended,
                        ]}
                        onPress={() => applyPreset(i, p.days)}
                      >
                        <Text style={[styles.presetDays, { color: isActive ? '#FFF' : p.color }]}>{p.days}d</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Calendar picker row */}
                <TouchableOpacity
                  style={[styles.dateButton, { backgroundColor: theme.bg2 }]}
                  onPress={() => { setSelectedItemIndex(i); setDatePickerModal(true); }}
                >
                  <Ionicons name="calendar-outline" size={14} color={theme.accent} />
                  <Text style={[styles.dateLabel, { color: theme.textMuted }]}>Custom date: </Text>
                  <Text style={[styles.dateValue, { color: theme.accent }]}>{item.customDate}</Text>
                  <Ionicons name="chevron-forward" size={14} color={theme.textMuted} style={{ marginLeft: 'auto' }} />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <Modal visible={datePickerModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.bg1, borderColor: theme.border }]}>
            <View style={[styles.modalHandle, { backgroundColor: theme.border }]} />
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Set Shelf Life</Text>
              <TouchableOpacity onPress={() => setDatePickerModal(false)} style={[styles.closeModalX, { backgroundColor: theme.bg2 }]}>
                <Ionicons name="close" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedItemIndex !== null && (
              <>
                <View style={styles.calendarHeader}>
                  <TouchableOpacity style={[styles.monthArrow, { backgroundColor: theme.bg2 }]} onPress={() => {
                    if (calendarMonth === 0) { setCalendarMonth(11); setCalendarYear(calendarYear - 1); }
                    else setCalendarMonth(calendarMonth - 1);
                  }}>
                    <Ionicons name="chevron-back" size={20} color={theme.accent} />
                  </TouchableOpacity>
                  <Text style={[styles.calendarTitle, { color: theme.textPrimary }]}>
                    {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][calendarMonth]} {calendarYear}
                  </Text>
                  <TouchableOpacity style={[styles.monthArrow, { backgroundColor: theme.bg2 }]} onPress={() => {
                    if (calendarMonth === 11) { setCalendarMonth(0); setCalendarYear(calendarYear + 1); }
                    else setCalendarMonth(calendarMonth + 1);
                  }}>
                    <Ionicons name="chevron-forward" size={20} color={theme.accent} />
                  </TouchableOpacity>
                </View>

                <View style={styles.weekdaysRow}>
                  {['SUN','MON','TUE','WED','THU','FRI','SAT'].map(day => (
                    <Text key={day} style={[styles.weekday, { color: theme.textMuted }]}>{day}</Text>
                  ))}
                </View>

                <View style={styles.calendarGrid}>
                  {Array.from({ length: getFirstDayOfMonth(calendarMonth, calendarYear) }).map((_, i) => (
                    <View key={`empty-${i}`} style={styles.dayCell} />
                  ))}
                  {Array.from({ length: getDaysInMonth(calendarMonth, calendarYear) }).map((_, i) => {
                    const day = i + 1;
                    const date = new Date(calendarYear, calendarMonth, day);
                    const formattedDate = formatDate(date);
                    const isSelected = scannedItems[selectedItemIndex]?.customDate === formattedDate;
                    return (
                      <TouchableOpacity
                        key={day}
                        onPress={() => {
                          const u = [...scannedItems];
                          u[selectedItemIndex].customDate = formattedDate;
                          const today = new Date(); today.setHours(0, 0, 0, 0);
                          u[selectedItemIndex].days = Math.ceil((date.getTime() - today.getTime()) / 86400000);
                          setScannedItems(u);
                          setDatePickerModal(false);
                        }}
                        style={[styles.dayCell, { backgroundColor: theme.bg2, borderColor: theme.border }, isSelected && { backgroundColor: theme.accent, borderColor: theme.accent }]}
                      >
                        <Text style={[styles.dayText, { color: theme.textPrimary }, isSelected && { color: '#FFF', fontWeight: '800' }]}>{day}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <TouchableOpacity style={[styles.closeModalBtn, { backgroundColor: theme.accent }]} onPress={() => setDatePickerModal(false)}>
                  <Text style={styles.closeModalText}>Done</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.retakeBtn, { backgroundColor: theme.bg1, borderColor: theme.border }]}
          onPress={() => { setScannedItems([]); setSkippedItems([]); }}
        >
          <Ionicons name="camera-outline" size={18} color={theme.accent} />
          <Text style={[styles.retakeBtnText, { color: theme.accent }]}>Retake</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.accent }]} onPress={async () => {
          let savedUri = currentImageUri;
          
          if (currentImageUri) {
            try {
              const filename = currentImageUri.split('/').pop() || `bill_${Date.now()}.jpg`;
              const newPath = FileSystem.documentDirectory + filename;
              await FileSystem.copyAsync({ from: currentImageUri, to: newPath });
              savedUri = newPath;
            } catch (e) { console.error('Failed to copy image', e); }
          }
          
          for (const s of scannedItems) {
            await context?.addItemToInventory({
              id: Math.random().toString(),
              name: s.name,
              qty: '1 unit',
              exp: s.customDate,
              status: s.days <= 7 ? 'warning' : 'normal'
            });
          }
          
          if (savedUri) {
            await context?.saveBill(savedUri, scannedItems.length);
          }
          
          setScannedItems([]);
          setSkippedItems([]);
          setCurrentImageUri(null);
          router.push('/');
        }}>
          <Ionicons name="checkmark" size={18} color="#FFF" />
          <Text style={styles.saveBtnText}>Add {scannedItems.length} Item{scannedItems.length !== 1 ? 's' : ''}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  return (
    <View style={styles.container}>
      <CameraView style={StyleSheet.absoluteFill} ref={cameraRef} />
      <View style={styles.overlay}>
        {/* Toggle UI */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity 
            style={[styles.toggleBtn, scanMode === 'receipt' && { backgroundColor: theme.accent }]} 
            onPress={() => setScanMode('receipt')}
          >
            <Ionicons name="receipt-outline" size={16} color={scanMode === 'receipt' ? '#FFF' : '#AAA'} />
            <Text style={[styles.toggleText, scanMode === 'receipt' && styles.toggleTextActive]}>Receipt</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.toggleBtn, scanMode === 'grocery' && { backgroundColor: theme.accent }]} 
            onPress={() => setScanMode('grocery')}
          >
            <Ionicons name="nutrition-outline" size={16} color={scanMode === 'grocery' ? '#FFF' : '#AAA'} />
            <Text style={[styles.toggleText, scanMode === 'grocery' && styles.toggleTextActive]}>Groceries</Text>
          </TouchableOpacity>
        </View>

        {scanMode === 'receipt' ? (
          <View style={styles.scanBox}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
        ) : (
          <View style={styles.groceryBox}>
            <View style={[styles.gCorner, styles.gCornerTL, { borderColor: theme.accent }]} />
            <View style={[styles.gCorner, styles.gCornerTR, { borderColor: theme.accent }]} />
            <View style={[styles.gCorner, styles.gCornerBL, { borderColor: theme.accent }]} />
            <View style={[styles.gCorner, styles.gCornerBR, { borderColor: theme.accent }]} />
          </View>
        )}
        <Text style={styles.scanHint}>
          {scanMode === 'receipt' ? 'Align receipt within the frame' : 'Place groceries clearly in the frame'}
        </Text>

        <TouchableOpacity style={styles.capture} onPress={capturePhoto}>
          {isProcessing ? <ActivityIndicator color={theme.accent} size="large" /> : <View style={[styles.innerCap, { backgroundColor: theme.accent }]} />}
        </TouchableOpacity>

        <View style={styles.cameraActions}>
          <TouchableOpacity style={styles.actionBtn} onPress={pickFromGallery} disabled={isProcessing}>
            <Ionicons name="image" size={22} color="white" />
            <Text style={styles.actionBtnText}>Gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.back()} disabled={isProcessing}>
            <Ionicons name="close" size={22} color="white" />
            <Text style={styles.actionBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Camera view
  container: { flex: 1, backgroundColor: '#000' },
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.45)' },
  scanBox: { width: 290, height: 380, marginBottom: 40, position: 'relative', justifyContent: 'center', alignItems: 'center' },
  corner: { position: 'absolute', width: 28, height: 28, borderWidth: 3 },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 6 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 6 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 6 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 6 },
  toggleContainer: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 24, padding: 4, position: 'absolute', top: 80 },
  toggleBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 },
  toggleText: { color: '#AAA', fontSize: 13, fontWeight: '600' },
  toggleTextActive: { color: '#FFF' },
  groceryBox: { width: 300, height: 300, marginBottom: 40, position: 'relative', justifyContent: 'center', alignItems: 'center' },
  gCorner: { position: 'absolute', width: 40, height: 40, borderWidth: 3 },
  gCornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 16 },
  gCornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 16 },
  gCornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 16 },
  gCornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 16 },
  scanHint: { color: 'rgba(255,255,255,0.65)', fontSize: 13, marginBottom: 40, letterSpacing: 0.3 },
  capture: { width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: '#FFF', justifyContent: 'center', alignItems: 'center', marginBottom: 40 },
  innerCap: { width: 54, height: 54, borderRadius: 27 },
  cameraActions: { flexDirection: 'row', gap: 60 },
  actionBtn: { alignItems: 'center', gap: 6 },
  actionBtnText: { color: '#FFF', fontSize: 12, fontWeight: '600' },

  // Confirm screen
  confirmView: { flex: 1, paddingHorizontal: 20 },
  title: { fontSize: 28, fontWeight: '800', marginTop: 44, marginBottom: 16, letterSpacing: -0.4 },
  skippedBanner: { padding: 14, borderRadius: RADIUS.md, marginBottom: 16, flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderLeftWidth: 3 },
  skippedTitle: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  skippedSubText: { fontSize: 12, lineHeight: 16 },
  card: { flexDirection: 'row', alignItems: 'stretch', borderRadius: RADIUS.lg, marginBottom: 10, overflow: 'hidden', borderWidth: 1 },
  cardStrip: { width: 4, alignSelf: 'stretch' },
  input: { fontSize: 15, fontWeight: '700', paddingVertical: 4 },
  dateRow: { flexDirection: 'row', marginTop: 8 },
  dateButton: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: RADIUS.sm, paddingVertical: 8, paddingHorizontal: 10, marginTop: 8 },
  dateLabel: { fontSize: 12 },
  dateValue: { fontSize: 13, fontWeight: '700' },

  // Preset shelf life chips
  presetRow: { flexDirection: 'row', gap: 8, marginTop: 8, marginBottom: 2 },
  presetChip: { flex: 1, borderWidth: 1.5, borderRadius: RADIUS.md, paddingVertical: 8, alignItems: 'center', gap: 2 },
  presetChipRecommended: { borderWidth: 2 },
  presetLabel: { fontSize: 11, fontWeight: '600' },
  presetDays: { fontSize: 18, fontWeight: '800', lineHeight: 22 },

  buttonRow: { flexDirection: 'row', gap: 10, marginTop: 12, marginBottom: 20, alignItems: 'center' },
  retakeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 18, paddingVertical: 13, borderRadius: RADIUS.md, borderWidth: 1 },
  retakeBtnText: { fontWeight: '600', fontSize: 14 },
  saveBtn: { flex: 1, borderRadius: RADIUS.md, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 13, gap: 8 },
  saveBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  btn: { alignSelf: 'center' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '80%', borderWidth: 1 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700' },
  closeModalX: { padding: 8, borderRadius: RADIUS.sm },
  monthArrow: { padding: 8, borderRadius: RADIUS.sm },
  calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  calendarTitle: { fontSize: 17, fontWeight: '700' },
  weekdaysRow: { flexDirection: 'row', marginBottom: 8 },
  weekday: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '700' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 20 },
  dayCell: { width: '13%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', borderRadius: RADIUS.sm, borderWidth: 1 },
  daySelected: { },
  dayText: { fontWeight: '600', fontSize: 13 },
  dayTextSelected: { color: '#FFF', fontWeight: '800' },
  closeModalBtn: { padding: 14, borderRadius: RADIUS.md, alignItems: 'center' },
  closeModalText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  chips: { flexDirection: 'row', gap: 8 },
  chip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: RADIUS.sm },
  activeChip: { },
});