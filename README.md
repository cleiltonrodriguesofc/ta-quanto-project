# TaQuanto? 🛒

A collaborative supermarket price-sharing app built with React Native and Expo. Help your community save money by sharing and discovering real-time supermarket prices.

## 📱 Features

### Core Functionality
- **🔍 Product Scanning**: Use your camera to scan products and get AI-powered product suggestions
- **💰 Price Registration**: Easily register prices with product details, supermarket info, and optional quantity
- **🌍 Community Prices**: Browse all shared prices with filtering and sorting capabilities
- **📍 GPS Location**: Optional location capture to help users find nearby deals
- **💾 Local Storage**: All data persists locally using AsyncStorage (no authentication required for MVP)

### User Interface
- **🎨 Modern Design**: Clean blue-themed interface with card-based layouts
- **📱 Tab Navigation**: Intuitive bottom tab navigation with 5 main sections
- **🔄 Real-time Updates**: Instant feedback and loading states for better UX
- **📊 Statistics**: Track your contributions and potential savings

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (for iOS development) or Android Studio (for Android development)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd taquanto-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Run on device/simulator**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app for physical device testing

## 📋 App Structure

### Navigation
The app uses tab-based navigation with the following screens:

- **🏠 Home**: Main dashboard with action buttons and statistics
- **👥 Community**: Browse all shared prices with search and filtering
- **➕ Add**: Choose between scanning or manual price entry
- **🗺️ Routes**: Placeholder for future route optimization features
- **👤 Profile**: User profile and app settings (coming soon)

### Key Screens

#### Home Screen
- Quick action buttons for common tasks
- Statistics showing total prices shared and potential savings
- Location-aware price counting

#### Scan Product
- Camera integration with permission handling
- AI-powered product recognition (mock implementation)
- Automatic location capture
- Product suggestion selection

#### Register Price
- Comprehensive form for price details
- Optional GPS location with address resolution
- Input validation and error handling
- Success confirmation with next action options

#### Community Prices
- Searchable and sortable price list
- Location display for geo-tagged prices
- Time-based sorting (recent/price)
- Pull-to-refresh functionality

## 🛠️ Technical Details

### Tech Stack
- **Framework**: React Native with Expo SDK 53
- **Navigation**: Expo Router with tab-based navigation
- **Storage**: AsyncStorage for local data persistence
- **Camera**: Expo Camera for product scanning
- **Location**: Expo Location for GPS functionality
- **Icons**: Lucide React Native for consistent iconography

### Key Dependencies
```json
{
  "expo": "^53.0.0",
  "expo-camera": "~16.1.5",
  "expo-location": "^18.1.6",
  "expo-router": "~5.0.2",
  "@react-native-async-storage/async-storage": "^2.2.0",
  "lucide-react-native": "^0.475.0"
}
```

### Data Structure
```typescript
interface PriceEntry {
  id: string;
  productName: string;
  price: number;
  supermarket: string;
  quantity?: string;
  timestamp: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}
```

## 🔧 Development

### Project Structure
```
app/
├── (tabs)/           # Tab-based screens
│   ├── index.tsx     # Home screen
│   ├── community.tsx # Community prices
│   ├── add.tsx       # Add price options
│   ├── routes.tsx    # Routes (placeholder)
│   └── profile.tsx   # Profile (placeholder)
├── scan.tsx          # Camera scanning screen
├── register.tsx      # Price registration form
└── _layout.tsx       # Root layout

types/
└── price.ts          # TypeScript interfaces

utils/
├── storage.ts        # AsyncStorage utilities
├── location.ts       # GPS and location services
├── mockVision.ts     # Mock AI product recognition
└── date.ts           # Date formatting utilities
```

### Key Features Implementation

#### Camera Integration
- Uses `expo-camera` for cross-platform camera access
- Handles permissions gracefully with user-friendly prompts
- Captures photos and processes them for product recognition

#### Location Services
- Requests location permissions appropriately
- Captures GPS coordinates with configurable accuracy
- Reverse geocodes coordinates to readable addresses
- Handles location errors gracefully

#### Data Persistence
- Uses AsyncStorage for offline-first approach
- Implements proper error handling and data validation
- Generates unique IDs for each price entry
- Supports data clearing for testing

## 🎯 MVP Scope

### Included Features
- ✅ Product scanning with camera
- ✅ Manual price registration
- ✅ Community price browsing
- ✅ Local data storage
- ✅ GPS location capture
- ✅ Search and filtering
- ✅ Modern UI with blue theme

### Future Features (Post-MVP)
- 🔄 User authentication and accounts
- ☁️ Cloud storage and real-time sync
- 🗺️ Route optimization for shopping
- 👥 Social features (likes, comments)
- 📊 Advanced analytics and insights
- 🔔 Price alerts and notifications
- 🏪 Store partnerships and integrations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Expo](https://expo.dev/) for cross-platform development
- Icons provided by [Lucide](https://lucide.dev/)
- Inspired by the need for transparent pricing in retail markets

## 📞 Support

For support, questions, or feature requests, please open an issue on GitHub.

---

**TaQuanto?** - Helping communities save money through collaborative price sharing! 💙