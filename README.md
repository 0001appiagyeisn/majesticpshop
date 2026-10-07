# Majesty Peacock Pathfinder Club Shop 🦚

Official souvenir and regalia e-commerce web application for the **Majesty Peacock Pathfinder Club** (Seventh-day Adventist Church AY Ministries).

---

## 🌟 Key Features

- **Souvenirs Catalogue**: Interactive regalia store with Shirts, Hoodies, Neckerchiefs & Slides, Caps & Crests, Tags & Pins, and Accessories.
- **Club Units Filtering**: Instant filtering for specialized units (**Tiger**, **Capricorn**, **Chrysanthemum**) and **General** club regalia.
- **Multi-Photo Swiping & Auto-Slide**: 3.5s auto-sliding image carousel with touch-drag swiping for multi-view products (front/back photos).
- **Persistent Cart & Live Calculations**: Client-side cart persisted across sessions with size and color selection.
- **WhatsApp Order Integration**: Orders save automatically to Firebase Firestore as `Pending` and generate an itemized WhatsApp checkout message to the club coordinator.
- **Pakyi Church Auto-Fill Secret**: Entering `...` in the Full Name field automatically fills in `Pakyi No.2 SDA Church` and `Dominase District`.
- **Admin Dashboard**:
  - Secret navigation access (type `iamadminms` or `iamadminapp` into the search bar).
  - Real-time stock monitor, sales metrics, and order management.
  - PDF Invoice generator for confirmed orders.
  - **Gemini AI Product Recognition**: Multimodal AI automatically detects item type, price, companion back-photos, and unit mascot (Goat = Capricorn, Tiger = Tiger, Flower = Chrysanthemum, Peacock = General).
  - **Batch Upload Queue**: Process up to 15 images at a time with sequential AI scanning.

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/majesticpshop.git
cd majesticpshop
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env.local` and add your Firebase and Gemini credentials:
```bash
cp .env.example .env.local
```

Fill in:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
GEMINI_API_KEY=your_gemini_api_key
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🌐 Deploy to Vercel (Recommended for Public Testing)

1. Push this repository to GitHub.
2. Go to [Vercel](https://vercel.com/) and click **"Add New Project"**.
3. Import your `majesticpshop` repository.
4. Add the environment variables from your `.env.local` under **Environment Variables**:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `GEMINI_API_KEY`
5. Click **Deploy**. Vercel will give you a live HTTPS link (e.g. `majesticpshop.vercel.app`) that you can share with anyone to test!
