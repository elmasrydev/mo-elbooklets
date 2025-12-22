# ElBooklets Mobile App

A React Native Expo application for the ElBooklets Hub platform.

## Features

- **Authentication**: Register and login using mobile number and password
- **GraphQL Integration**: Connected to Laravel backend via Apollo Client
- **Tab Navigation**: Home, Booklets, Progress, and Profile screens
- **Responsive Design**: Clean, modern UI with proper loading states
- **Grade Selection**: Users can select their grade during registration

## Prerequisites

- Node.js (v18 or higher)
- Expo CLI
- iOS Simulator (for iOS development) or Android Emulator (for Android development)
- Running Laravel backend at `http://localhost:8000`

## Installation

1. Navigate to the mobile app directory:
```bash
cd mobile-elbooklets
```

2. Install dependencies:
```bash
npm install
```

## Running the App

### Development Server
```bash
npm start
```

### iOS Simulator
```bash
npm run ios
```

### Android Emulator
```bash
npm run android
```

### Web Browser
```bash
npm run web
```

## Configuration

### Backend URL
Update the API URL in `src/lib/apollo.ts`:

- **iOS Simulator**: `http://localhost:8000/graphql`
- **Android Emulator**: `http://10.0.2.2:8000/graphql`
- **Physical Device**: `http://YOUR_COMPUTER_IP:8000/graphql`

## Project Structure

```
src/
├── components/          # Reusable components
│   ├── AppNavigator.tsx # Main app navigation logic
│   └── TabNavigator.tsx # Bottom tab navigation
├── context/            # React Context providers
│   └── AuthContext.tsx # Authentication state management
├── lib/               # Utilities and configurations
│   ├── apollo.ts      # Apollo Client configuration
│   └── graphql.ts     # GraphQL queries and mutations
└── screens/           # Screen components
    ├── SplashScreen.tsx
    ├── LoginScreen.tsx
    ├── RegisterScreen.tsx
    ├── HomeScreen.tsx
    ├── BookletsScreen.tsx
    ├── ProgressScreen.tsx
    └── ProfileScreen.tsx
```

## Authentication Flow

1. **Splash Screen**: Checks if user is already logged in
2. **Login/Register**: User can switch between login and registration
3. **Main App**: Tab navigation with authenticated content

## GraphQL Integration

The app uses Apollo Client to communicate with the Laravel GraphQL backend:

- **Register Mutation**: Creates new user account
- **Login Mutation**: Authenticates user with mobile/password
- **Grades Query**: Fetches available grades for registration

## Dependencies

### Core
- React Native (Expo)
- React Navigation
- Apollo Client
- AsyncStorage

### UI Components
- React Native Picker
- React Native Safe Area Context
- React Native Screens
- React Native Gesture Handler

## Development Notes

- The app is configured for registered users only
- All screens have proper loading states and error handling
- Authentication tokens are stored securely using AsyncStorage
- The UI follows iOS/Android design guidelines

## Next Steps

- Add actual booklet content and functionality
- Implement progress tracking
- Add push notifications
- Implement offline support
- Add more user profile features
