# PawPals - Dog Sitting Platform 🐕

A full-stack mobile application that connects dog owners with dog sitters - like Tinder for dog care! Built with React Native (Expo), Node.js, GraphQL, MongoDB, and Socket.io for real-time chat.

## Features

### For Dog Owners
- 📍 Find nearby available dog sitters on an interactive map
- 📝 Create dog sitting requests with dates, location, and preferences
- 💬 Real-time chat with potential sitters
- ⭐ View sitter ratings and reviews
- 🐶 Manage your dog profiles

### For Dog Sitters
- 📍 View nearby dog sitting requests on the map
- ✅ Toggle availability status with custom messages
- 💰 Set your hourly rate
- 💬 Chat with dog owners in real-time
- ⭐ Build your reputation through reviews

### Core Features
- 🔐 Secure JWT authentication
- 🗺️ Interactive map with custom markers
- 💬 Real-time messaging with Socket.io
- 📍 Geospatial queries for nearby users
- 🔔 Push notifications (Expo Notifications)
- 📸 Profile picture uploads

## Tech Stack

### Backend
- **Runtime**: Node.js + Express.js
- **Language**: TypeScript
- **API**: GraphQL (Apollo Server 4)
- **Database**: MongoDB + Mongoose
- **Real-time**: Socket.io
- **Auth**: JWT (jsonwebtoken)
- **File Upload**: Multer

### Mobile App
- **Framework**: React Native (Expo)
- **Language**: TypeScript
- **State Management**: Apollo Client + React Context
- **Navigation**: React Navigation
- **Maps**: React Native Maps + Google Maps
- **Styling**: StyleSheet (custom theme)

## Project Structure

```
petSitter/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.ts      # MongoDB connection
│   │   │   └── apollo.ts        # Apollo Server setup
│   │   ├── models/
│   │   │   ├── User.ts          # User schema
│   │   │   ├── Request.ts       # Request schema
│   │   │   ├── Message.ts       # Message schema
│   │   │   └── Review.ts        # Review schema
│   │   ├── graphql/
│   │   │   ├── typeDefs/        # GraphQL type definitions
│   │   │   └── resolvers/       # GraphQL resolvers
│   │   ├── middleware/
│   │   │   ├── auth.ts          # Authentication middleware
│   │   │   └── upload.ts        # File upload middleware
│   │   ├── utils/
│   │   │   ├── jwt.ts           # JWT utilities
│   │   │   └── validation.ts    # Validation helpers
│   │   ├── socket/
│   │   │   └── chatHandler.ts   # Socket.io chat handler
│   │   ├── server.ts            # Main server file
│   │   └── seed.ts              # Database seed script
│   ├── package.json
│   └── tsconfig.json
│
├── mobile/
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   ├── screens/             # Screen components
│   │   ├── navigation/          # Navigation setup
│   │   ├── context/             # React Context providers
│   │   ├── graphql/             # GraphQL queries/mutations
│   │   ├── utils/               # Utility functions
│   │   ├── constants/           # Theme and constants
│   │   └── types/               # TypeScript types
│   ├── App.tsx                  # App entry point
│   ├── package.json
│   └── app.json                 # Expo configuration
│
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+ installed
- MongoDB running locally or MongoDB Atlas account
- Google Maps API key
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Emulator

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Update `.env` with your settings:
```env
MONGODB_URI=mongodb://localhost:27017/dog-sitting
JWT_SECRET=your-super-secret-jwt-key
PORT=4000
FRONTEND_URL=http://localhost:19006
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

5. Seed the database (optional but recommended):
```bash
npm run seed
```

6. Start the server:
```bash
npm run dev
```

The GraphQL server will be available at `http://localhost:4000/graphql`

### Mobile App Setup

1. Navigate to the mobile directory:
```bash
cd mobile
```

2. Install dependencies:
```bash
npm install
```

3. Update `app.json` with your Google Maps API keys:
```json
{
  "expo": {
    "ios": {
      "config": {
        "googleMapsApiKey": "YOUR_GOOGLE_MAPS_IOS_API_KEY"
      }
    },
    "android": {
      "config": {
        "googleMaps": {
          "apiKey": "YOUR_GOOGLE_MAPS_ANDROID_API_KEY"
        }
      }
    }
  }
}
```

4. Update API URL in `app.json` (if not using localhost):
```json
{
  "expo": {
    "extra": {
      "apiUrl": "http://YOUR_SERVER_IP:4000",
      "wsUrl": "ws://YOUR_SERVER_IP:4000"
    }
  }
}
```

5. Start the Expo development server:
```bash
npm start
```

6. Run on your device:
- Press `i` for iOS Simulator
- Press `a` for Android Emulator
- Scan QR code with Expo Go app on your phone

## Test Accounts

After running the seed script, you can use these demo accounts:

### Dog Owners
| Email | Password |
|-------|----------|
| owner1@example.com | password123 |
| owner2@example.com | password123 |
| owner3@example.com | password123 |
| owner4@example.com | password123 |
| owner5@example.com | password123 |

### Dog Sitters
| Email | Password |
|-------|----------|
| sitter1@example.com | password123 |
| sitter2@example.com | password123 |
| sitter3@example.com | password123 |
| sitter4@example.com | password123 |
| sitter5@example.com | password123 |

## API Documentation

### GraphQL Endpoint
`POST /graphql`

### Authentication
Include JWT token in Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Main Queries

```graphql
# Get current user
query Me {
  me { id name email userType }
}

# Get nearby available sitters
query NearbyAvailableSitters($radius: Float!, $longitude: Float!, $latitude: Float!) {
  nearbyAvailableSitters(radius: $radius, longitude: $longitude, latitude: $latitude) {
    id name rating distance isAvailable
  }
}

# Get nearby requests
query NearbyRequests($radius: Float!, $longitude: Float!, $latitude: Float!) {
  nearbyRequests(radius: $radius, longitude: $longitude, latitude: $latitude) {
    id message owner { name } startDate endDate distance
  }
}

# Get conversations
query GetConversations {
  getConversations {
    conversationId otherUser { id name } lastMessage { content } unreadCount
  }
}
```

### Main Mutations

```graphql
# Register
mutation Register($input: RegisterInput!) {
  register(input: $input) { token user { id name } }
}

# Login
mutation Login($email: String!, $password: String!) {
  login(email: $email, password: $password) { token user { id name } }
}

# Create request
mutation CreateRequest($input: CreateRequestInput!) {
  createRequest(input: $input) { id message }
}

# Send message
mutation SendMessage($receiverId: ID!, $content: String!) {
  sendMessage(receiverId: $receiverId, content: $content) { id content }
}

# Toggle availability
mutation ToggleAvailability($isAvailable: Boolean!, $message: String) {
  toggleAvailability(isAvailable: $isAvailable, message: $message) { isAvailable }
}
```

### WebSocket Events (Socket.io)

**Client Events:**
- `conversation:join` - Join a conversation room
- `conversation:leave` - Leave a conversation room
- `message:send` - Send a message
- `typing:start` - Start typing indicator
- `typing:stop` - Stop typing indicator
- `messages:read` - Mark messages as read
- `location:update` - Update user location
- `availability:toggle` - Toggle sitter availability

**Server Events:**
- `message:new` - New message in conversation
- `message:received` - Direct message to user
- `typing:started` - User started typing
- `typing:stopped` - User stopped typing
- `user:online` - User came online
- `user:offline` - User went offline

## Screenshots

*Add your app screenshots here*

| Map View | Chat | Profile |
|----------|------|---------|
| ![Map](screenshots/map.png) | ![Chat](screenshots/chat.png) | ![Profile](screenshots/profile.png) |

## Environment Variables

### Backend (.env)
| Variable | Description |
|----------|-------------|
| MONGODB_URI | MongoDB connection string |
| JWT_SECRET | Secret key for JWT tokens |
| PORT | Server port (default: 4000) |
| FRONTEND_URL | Frontend URL for CORS |
| GOOGLE_MAPS_API_KEY | Google Maps API key |

### Mobile (app.json)
| Variable | Description |
|----------|-------------|
| extra.apiUrl | Backend API URL |
| extra.wsUrl | WebSocket URL |
| ios.config.googleMapsApiKey | iOS Google Maps key |
| android.config.googleMaps.apiKey | Android Google Maps key |

## Deployment

### Backend (Railway/Heroku/DigitalOcean)

1. Set environment variables in your deployment platform
2. Deploy the backend directory
3. Update mobile app with production API URL

### Mobile (Expo EAS)

1. Install EAS CLI:
```bash
npm install -g eas-cli
```

2. Configure EAS:
```bash
eas build:configure
```

3. Build for iOS/Android:
```bash
eas build --platform ios
eas build --platform android
```

## Future Enhancements

- [ ] In-app payments with Stripe
- [ ] Calendar view for availability
- [ ] Photo gallery for sitters
- [ ] Video chat integration
- [ ] Background location tracking
- [ ] Multi-language support

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Acknowledgments

- Icons by [Ionicons](https://ionic.io/ionicons)
- Maps by [Google Maps Platform](https://developers.google.com/maps)
- Inspiration from pet care platforms like Rover, Wag, and PetBacker

---

Built with ❤️ for a college final project
