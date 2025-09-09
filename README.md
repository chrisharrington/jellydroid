# Jellydroid

<div align="center">
  <img src="./assets/images/icon.png" alt="Jellydroid Logo" width="120" height="120" />
  
  **A React Native client for Jellyfin media server**
  
  [![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
  [![Expo](https://img.shields.io/badge/Expo-~53.0-blue.svg)](https://expo.dev/)
  [![React Native](https://img.shields.io/badge/React%20Native-Cross%20Platform-brightgreen.svg)](https://reactnative.dev/)
</div>

## 📱 About

Jellydroid is a modern, cross-platform mobile application built with React Native and Expo that provides a seamless interface for your Jellyfin media server. Stream your movies, TV shows, and media content directly to your mobile device with an intuitive, native experience.

## ✨ Features

### 🎬 Media Browsing & Streaming

-   **Comprehensive Library Access**: Browse your entire Jellyfin media collection including movies, TV shows, and other media types
-   **High-Quality Streaming**: Stream media content directly from your Jellyfin server with adaptive quality
-   **Media Details**: View detailed information about movies and shows including metadata, cast, ratings, and descriptions
-   **Poster & Artwork Display**: Rich visual interface with movie posters, show artwork, and thumbnails

### 🎮 Advanced Playback Controls

-   **Remote Control Interface**: Full-featured remote control for ongoing playback sessions
-   **Seek Bar Control**: Precise seeking with visual progress indicators
-   **Play/Pause/Stop**: Complete playback control with intuitive button interface
-   **Forward/Backward Seeking**: Quick 10-second skip controls for efficient navigation
-   **Subtitle Management**: Select and switch between available subtitle tracks
-   **Playback State Sync**: Real-time synchronization with server playback state

### 🔐 Authentication & Security

-   **Secure Login**: Robust authentication system using Jellyfin's built-in security
-   **Session Management**: Persistent login sessions with automatic token refresh
-   **Server Configuration**: Easy setup and connection to your Jellyfin server
-   **User Profile Support**: Multi-user support with individual profiles and preferences

### 📱 Mobile-Optimized Experience

-   **Cross-Platform**: Works seamlessly on both iOS and Android devices
-   **Native Performance**: Built with React Native for optimal mobile performance
-   **Responsive Design**: Adaptive UI that works across different screen sizes
-   **Drawer Navigation**: Intuitive navigation with slide-out menu for easy access
-   **Toast Notifications**: User-friendly feedback system for actions and errors

### 🎯 Smart Features

-   **Watch Status Tracking**: Mark items as watched/unwatched with progress tracking
-   **Playback Resume**: Continue watching from where you left off
-   **Media Organization**: Browse content by categories, genres, and collections
-   **Search Functionality**: Find your favorite content quickly and efficiently

## 🚀 Getting Started

### Prerequisites

Before running Jellydroid, make sure you have the following installed:

-   **Node.js** (v18 or higher)
-   **Bun** (recommended package manager)
-   **Expo CLI**
-   **A running Jellyfin server**
-   For development: **Android Studio** (Android) or **Xcode** (iOS)

### Installation

1. **Clone the repository**

    ```bash
    git clone https://github.com/chrisharrington/jellydroid.git
    cd jellydroid
    ```

2. **Install dependencies**

    ```bash
    bun install
    ```

3. **Set up environment variables**

    ```bash
    cp .env.example .env
    # Edit .env file with your configuration
    ```

4. **Start the development server**
    ```bash
    bun run start
    ```

### 📱 Running on Device

#### For Development Build

```bash
# Android development build
bun run build:dev

# Run on Android device/emulator
bun run android

# Run on iOS device/simulator (macOS only)
bun run ios
```

#### For Production

```bash
# Build for production using EAS
eas build --platform android
eas build --platform ios
```

### 🔧 Configuration

1. **Jellyfin Server Setup**

    - Ensure your Jellyfin server is running and accessible
    - Note your server's IP address and port (e.g., `http://192.168.1.100:8096`)
    - Create a user account on your Jellyfin server

2. **App Configuration**
    - On first launch, enter your Jellyfin server details
    - Log in with your Jellyfin credentials
    - The app will automatically configure the connection

## 🧪 Testing

Jellydroid includes comprehensive test coverage using Jest and React Native Testing Library.

```bash
# Run all tests
bun run test

# Run tests in watch mode
bun run test --watch

# Run tests with coverage
bun run test --coverage

# Type checking
bun run type-check
```

### Test Structure

-   **Unit Tests**: Component and hook testing with behavioral focus
-   **Integration Tests**: API integration and context provider testing
-   **UI Tests**: User interaction and workflow testing
-   **Acceptance Tests**: End-to-end user scenarios

## 🏗️ Architecture

### Technical Stack

-   **Framework**: React Native with Expo
-   **Navigation**: Expo Router with drawer navigation
-   **State Management**: Zustand for global state, React Context for API
-   **API Integration**: Official Jellyfin SDK (@jellyfin/sdk)
-   **Styling**: React Native StyleSheet with custom theme system
-   **Testing**: Jest + React Native Testing Library
-   **Type Safety**: TypeScript throughout

### Project Structure

```
jellydroid/
├── app/                    # Expo Router pages and layouts
├── components/            # Reusable UI components
│   ├── button/           # Button components with tests
│   ├── drawer/           # Navigation drawer components
│   ├── ui/               # Common UI elements
│   └── toast/            # Notification system
├── contexts/             # React Context providers
│   └── jellyfin/         # Jellyfin API context
├── hooks/                # Custom React hooks
├── screens/              # Screen components
│   ├── home/             # Media library home
│   ├── movieDetails/     # Movie detail view
│   ├── remote/           # Playback remote control
│   └── video/            # Video player interface
├── stores/               # Zustand state stores
├── models/               # TypeScript type definitions
└── assets/               # Images, fonts, and static assets
```

### Key Components

-   **JellyfinProvider**: Centralized API access and authentication management
-   **Navigation System**: Drawer-based navigation with deep linking support
-   **Media Components**: Poster displays, media cards, and detail views
-   **Playback Controls**: Remote interface with real-time synchronization
-   **Authentication Flow**: Secure login and session persistence

## 🛠️ Development

### Code Quality

-   **ESLint**: Configured for TypeScript and React Native
-   **Prettier**: Consistent code formatting
-   **TypeScript**: Strict typing for better development experience
-   **Testing Standards**: Behavior-driven testing approach

### Development Guidelines

-   Follow the established component structure (index.tsx, hook.ts, style.ts, test.tsx)
-   Write comprehensive tests for all components and hooks
-   Use proper TypeScript typing throughout
-   Follow the comment standards outlined in the project

### Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

-   **Jellyfin Project**: For providing the excellent media server platform
-   **Expo Team**: For the amazing React Native development platform
-   **React Native Community**: For the robust ecosystem and components

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/chrisharrington/jellydroid/issues) page
2. Review the Jellyfin server logs for connectivity issues
3. Ensure your Jellyfin server is updated and accessible
4. For development issues, check the Expo development tools

---

<div align="center">
  <p>Built with ❤️ by <a href="https://github.com/chrisharrington">Chris Harrington</a></p>
  <p>Powered by <a href="https://jellyfin.org/">Jellyfin</a> • <a href="https://reactnative.dev/">React Native</a> • <a href="https://expo.dev/">Expo</a></p>
</div>
