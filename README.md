# Expense Tracker Mobile App

A premium expense tracking mobile application built with React, TypeScript, and Capacitor.

## 🚀 Features

- **Cross-Platform**: Runs on iOS, Android, and Web
- **Native Mobile Experience**: Haptic feedback, status bar control, splash screen
- **Modern UI**: Beautiful design with safe area support for notched devices
- **Offline Capable**: PWA support for offline functionality
- **Real-time Sync**: Supabase backend integration

## 📱 Mobile Development

### Prerequisites

- Node.js 16+ 
- npm or yarn
- For Android: Android Studio with Android SDK
- For iOS: Xcode (macOS only)

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

### Development Scripts

#### Web Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

#### Mobile Development
```bash
npm run mobile:build    # Build web app and sync with mobile platforms
npm run mobile:sync     # Sync web assets to mobile platforms
npm run mobile:copy     # Copy web assets only

# Android
npm run mobile:android     # Open Android project in Android Studio
npm run mobile:run:android # Build and run on Android device/emulator

# iOS (macOS only)
npm run mobile:ios         # Open iOS project in Xcode
npm run mobile:run:ios     # Build and run on iOS device/simulator
```

### Mobile Platform Setup

#### Android Setup
1. Install Android Studio
2. Set up Android SDK (API level 22+)
3. Create virtual device or connect physical device
4. Run: `npm run mobile:android`

#### iOS Setup (macOS only)
1. Install Xcode
2. Install CocoaPods: `sudo gem install cocoapods`
3. Connect iOS device or use simulator
4. Run: `npm run mobile:ios`

### Mobile Features

#### Capacitor Plugins Used
- **Status Bar**: Control status bar appearance
- **Splash Screen**: Native splash screen with auto-hide
- **Haptics**: Tactile feedback for interactions
- **Keyboard**: Handle virtual keyboard behavior

#### Mobile Optimizations
- Safe area support for notched devices
- Haptic feedback on navigation and interactions
- Optimized touch targets (44px minimum)
- Prevented zoom on input focus
- Smooth scrolling with momentum
- Keyboard-aware layouts

### Building for Production

#### Android APK/AAB
1. Run: `npm run mobile:build`
2. Open Android Studio: `npm run mobile:android`
3. Build → Generate Signed Bundle/APK
4. Follow Android Studio's signing process

#### iOS App Store
1. Run: `npm run mobile:build`
2. Open Xcode: `npm run mobile:ios`
3. Archive → Distribute App
4. Follow Xcode's App Store submission process

### Configuration

#### Capacitor Configuration
Edit `capacitor.config.ts` to customize:
- App ID and name
- Splash screen settings
- Status bar appearance
- Plugin configurations

#### Mobile-Specific Styling
- Safe area classes: `safe-area-top`, `safe-area-bottom`, etc.
- No-select class: `no-select` for better mobile UX
- Keyboard handling: `keyboard-open` body class

### Troubleshooting

#### Common Issues
1. **Build fails**: Ensure all dependencies are installed
2. **Android Studio won't open**: Check Android SDK path
3. **iOS build fails**: Verify Xcode and CocoaPods installation
4. **Plugins not working**: Run `npm run mobile:sync`

#### Debug Mode
- Web: Use browser dev tools
- Android: Use Chrome DevTools (chrome://inspect)
- iOS: Use Safari Web Inspector

### Project Structure
```
├── src/
│   ├── components/     # React components
│   ├── hooks/         # Custom hooks (including mobile hooks)
│   ├── pages/         # Page components
│   └── ...
├── android/           # Android native project
├── ios/              # iOS native project
├── public/           # Static assets
└── capacitor.config.ts # Capacitor configuration
```

## 🔧 Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Mobile**: Capacitor 6
- **Backend**: Supabase
- **State Management**: TanStack Query
- **UI Components**: Radix UI + shadcn/ui
- **Build Tool**: Vite

## 🚢 CI/CD & Deployment

This project includes automated CI/CD pipeline using GitHub Actions that:
- Builds the React application
- Creates Docker images
- Deploys to Kubernetes cluster

### Quick Setup
1. Configure GitHub repository secrets (see [CI-CD-SETUP.md](./CI-CD-SETUP.md))
2. Push to main/master branch to trigger deployment
3. Monitor deployment via GitHub Actions

### Manual Deployment
```bash
# Deploy specific image tag
./deploy.sh v1.2.3

# Check application health
./health-check.sh
```

For detailed setup instructions, see [CI-CD-SETUP.md](./CI-CD-SETUP.md).

## 📄 License

This project is licensed under the MIT License.
