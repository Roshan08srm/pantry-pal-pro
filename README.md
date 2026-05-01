# 🛒 Pantry Pal Pro
**The Intelligent Kitchen Assistant**

Pantry Pal Pro is a state-of-the-art mobile application designed to eliminate food waste and simplify grocery management. Built with a premium "Deep Void" aesthetic, it combines cloud synchronization, AI-powered recipes, and intelligent scanning to keep your kitchen running like a well-oiled machine.

---

## ✨ Key Features

### 🔐 Secure Authentication
![Login Screen](assests/screenshots/login.png) | ![Signup Screen](assests/screenshots/signup.png)
--- | ---
*Protect your data with encrypted accounts. Pantry Pal Pro uses Firebase Authentication to ensure your inventory is synced safely across all your devices.*

### 📊 Smart Inventory Dashboard
![Smart Inventory](assests/screenshots/inventory.png)
*A high-contrast, real-time dashboard providing instant visibility into your stock. Features color-coded urgency indicators for items that are **Expiring Soon** or **Expired**.*

### 🔍 AI Receipt Scanner
![Receipt Scanner](assests/screenshots/scanner.png)
*Add your groceries in seconds. Our intelligent scanner identifies items directly from your supermarket receipts, automatically extracting names and quantities.*

### 📜 Digital Receipt Archive
![Receipt History](assests/screenshots/receipt_history.png)
*Never lose a bill again. The app maintains a searchable history of all your scanned receipts, allowing you to review past purchases and track your grocery habits over time.*

### 🛒 Automated Shopping Cart
![Shopping Cart](assests/screenshots/cart.png)
*Your grocery list, modernized. The app tracks what you're running low on and automatically moves used or expired items to your cart, ready for your next trip.*

### 🍳 Intelligent Recipe Engine
![Smart Recipes](assests/screenshots/recipes.png)
*Discover what's for dinner based on what you have. The "Smart Recipes" engine suggests meals using your current stock, highlighting exactly how many ingredients you already have ready.*

### ⚙️ Personalized Experience
![Settings & Recovery](assests/screenshots/settings.png)
*Fully customizable with Light and Dark modes. Includes a "Recently Deleted" safety net to restore items accidentally removed from your inventory.*

---

## 🛠️ Tech Stack
- **Framework**: [Expo](https://expo.dev/) / [React Native](https://reactnative.dev/)
- **Database**: [Firebase Firestore](https://firebase.google.com/products/firestore) for real-time cloud sync
- **Authentication**: Firebase Auth (Email/Password)
- **Recipe Data**: [Spoonacular API](https://spoonacular.com/food-api)
- **Styling**: Custom "Deep Void" Design System (Vanilla CSS-in-JS)

## 🚀 Getting Started

1. **Clone the repo**
   ```bash
   git clone https://github.com/Roshan08srm/pantry-pal-pro.git
   ```
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Set up Environment Variables**
   Create a `.env` file and add your keys:
   ```env
   EXPO_PUBLIC_SPOONACULAR_API_KEY=your_key_here
   ```
4. **Run the app**
   ```bash
   npx expo start
   ```
