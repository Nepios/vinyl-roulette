# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VinylRoulette is a React Native mobile app that allows users to import their vinyl record collection from Discogs and randomly select a record from their collection for listening inspiration. The app uses Discogs OAuth for authentication and SQLite for local data storage.

## Common Development Commands

- `npm start` - Start Metro bundler for React Native development
- `npm run android` - Build and run Android app 
- `npm run ios` - Build and run iOS app (requires CocoaPods setup)
- `npm run lint` - Run ESLint on the codebase
- `npm test` - Run Jest tests

### iOS Setup Requirements

For iOS development, run these commands after cloning or updating native dependencies:
```bash
bundle install
bundle exec pod install
```

## Architecture

### Core Structure

- **App.tsx** - Main app entry point with React Navigation setup
- **contexts/AuthContext.tsx** - Authentication state management using React Context
- **database/** - SQLite database layer with schema, services, and migrations
  - `database.ts` - Core database initialization and utilities
  - `schema.ts` - Database table definitions  
  - `collectionService.ts` - Record collection data access layer
  - `syncService.ts` - Handles syncing with Discogs API
- **services/discogsApi.ts** - Discogs API integration with OAuth authentication
- **services/auth/** - Authentication services and token management
- **screens/** - React Native screen components
- **hooks/** - Custom React hooks for auth and API interactions

### Key Dependencies

- **@lionralfs/discogs-client** - Discogs API client
- **react-native-sqlite-2** - SQLite database for local storage
- **oauth-1.0a** - OAuth 1.0a implementation for Discogs authentication
- **react-native-app-auth** - OAuth authentication flows
- **@react-navigation/native** - Navigation framework

### Authentication Flow

The app uses Discogs OAuth 1.0a for authentication:
1. User initiates login through DiscogsLoginScreen
2. OAuth flow handled by services/auth/ modules
3. Tokens stored securely using react-native-keychain
4. AuthContext provides authentication state across the app

### Database Layer

SQLite database stores user's record collection locally:
- **records** table - Stores individual record information
- **metadata** table - Stores sync and app metadata
- Collection sync service fetches paginated data from Discogs API
- Database includes retry logic and error handling for reliability

### Navigation Structure

- **Home** (LandingPage) - Main entry point
- **Login** (DiscogsLoginScreen) - OAuth authentication
- **Collection** (UserCollection) - Display user's vinyl collection

## Development Notes

- Environment variables required: `DISCOGS_CONSUMER_KEY`, `DISCOGS_CONSUMER_SECRET`
- The app includes extensive Node.js polyfills for crypto and networking in React Native
- Database operations use transactions for data integrity
- API calls include rate limiting and pagination handling
- All screens include proper loading states and error handling