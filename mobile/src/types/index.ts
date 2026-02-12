// User types
export type UserType = 'owner' | 'sitter';

export interface Location {
  type: string;
  coordinates: [number, number]; // [longitude, latitude]
  address?: string;
}

export interface Dog {
  name: string;
  breed: string;
  age: number;
  photo?: string;
  description?: string;
}

export interface User {
  id: string;
  email: string;
  userType: UserType;
  name: string;
  phone?: string;
  profilePicture?: string;
  location: Location;
  // Dog Owner fields
  dogs?: Dog[];
  // Dog Sitter fields
  isAvailable?: boolean;
  availabilityMessage?: string;
  hourlyRate?: number;
  bio?: string;
  // Rating
  rating?: number;
  reviewCount?: number;
  // Computed
  distance?: number;
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// Request types
export type RequestStatus = 'active' | 'completed' | 'cancelled';

export interface Request {
  id: string;
  owner: User;
  ownerId: string;
  message: string;
  startDate: string;
  endDate: string;
  location: Location;
  status: RequestStatus;
  specialInstructions?: string;
  preferredRate?: number;
  distance?: number;
  createdAt: string;
  updatedAt: string;
}

// Message types
export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  sender?: User;
  receiver?: User;
  conversationId: string;
  content: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  conversationId: string;
  otherUser: User;
  lastMessage: Message;
  unreadCount: number;
}

// Review types
export interface Review {
  id: string;
  reviewer: User;
  reviewee: User;
  reviewerId: string;
  revieweeId: string;
  requestId?: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

// Auth types
export interface AuthPayload {
  token: string;
  user: User;
}

// Input types
export interface LocationInput {
  coordinates: [number, number];
  address?: string;
}

export interface DogInput {
  name: string;
  breed: string;
  age: number;
  photo?: string;
  description?: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  userType: UserType;
  name: string;
  phone?: string;
  location: LocationInput;
  dogs?: DogInput[];
  hourlyRate?: number;
  bio?: string;
}

export interface ProfileUpdateInput {
  name?: string;
  phone?: string;
  profilePicture?: string;
  location?: LocationInput;
  dogs?: DogInput[];
  isAvailable?: boolean;
  availabilityMessage?: string;
  hourlyRate?: number;
  bio?: string;
}

export interface CreateRequestInput {
  message: string;
  startDate: string;
  endDate: string;
  location: LocationInput;
  specialInstructions?: string;
  preferredRate?: number;
}

// Navigation types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Profile: { userId?: string };
  Chat: { userId: string; userName: string };
  RequestForm: { request?: Request };
  UserDetail: { user: User };
};

export type MainTabParamList = {
  Map: undefined;
  ChatList: undefined;
  MyProfile: undefined;
  Requests: undefined;
};
