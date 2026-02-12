import { gql } from '@apollo/client';

// User fragments
export const USER_FRAGMENT = gql`
  fragment UserFragment on User {
    id
    email
    userType
    name
    phone
    profilePicture
    location {
      type
      coordinates
      address
    }
    dogs {
      name
      breed
      age
      photo
      description
    }
    isAvailable
    availabilityMessage
    hourlyRate
    bio
    rating
    reviewCount
    createdAt
    updatedAt
  }
`;

export const USER_BASIC_FRAGMENT = gql`
  fragment UserBasicFragment on User {
    id
    name
    profilePicture
    userType
    rating
    reviewCount
  }
`;

// User queries
export const GET_ME = gql`
  ${USER_FRAGMENT}
  query GetMe {
    me {
      ...UserFragment
    }
  }
`;

export const GET_USER = gql`
  ${USER_FRAGMENT}
  query GetUser($id: ID!) {
    getUser(id: $id) {
      ...UserFragment
    }
  }
`;

export const GET_NEARBY_USERS = gql`
  ${USER_FRAGMENT}
  query GetNearbyUsers($radius: Float!, $userType: UserType!, $longitude: Float!, $latitude: Float!) {
    nearbyUsers(radius: $radius, userType: $userType, longitude: $longitude, latitude: $latitude) {
      ...UserFragment
      distance
    }
  }
`;

export const GET_NEARBY_AVAILABLE_SITTERS = gql`
  ${USER_FRAGMENT}
  query GetNearbyAvailableSitters($radius: Float!, $longitude: Float!, $latitude: Float!) {
    nearbyAvailableSitters(radius: $radius, longitude: $longitude, latitude: $latitude) {
      ...UserFragment
      distance
    }
  }
`;

// Request queries
export const REQUEST_FRAGMENT = gql`
  ${USER_BASIC_FRAGMENT}
  fragment RequestFragment on Request {
    id
    ownerId
    owner {
      ...UserBasicFragment
    }
    message
    startDate
    endDate
    location {
      type
      coordinates
      address
    }
    status
    specialInstructions
    preferredRate
    createdAt
    updatedAt
  }
`;

export const GET_REQUEST = gql`
  ${REQUEST_FRAGMENT}
  query GetRequest($id: ID!) {
    getRequest(id: $id) {
      ...RequestFragment
    }
  }
`;

export const GET_MY_REQUESTS = gql`
  ${REQUEST_FRAGMENT}
  query GetMyRequests($status: RequestStatus) {
    myRequests(status: $status) {
      ...RequestFragment
    }
  }
`;

export const GET_NEARBY_REQUESTS = gql`
  ${REQUEST_FRAGMENT}
  query GetNearbyRequests($radius: Float!, $longitude: Float!, $latitude: Float!) {
    nearbyRequests(radius: $radius, longitude: $longitude, latitude: $latitude) {
      ...RequestFragment
      distance
    }
  }
`;

// Message queries
export const MESSAGE_FRAGMENT = gql`
  fragment MessageFragment on Message {
    id
    senderId
    receiverId
    conversationId
    content
    isRead
    readAt
    createdAt
    updatedAt
  }
`;

export const CONVERSATION_FRAGMENT = gql`
  ${USER_BASIC_FRAGMENT}
  ${MESSAGE_FRAGMENT}
  fragment ConversationFragment on Conversation {
    conversationId
    otherUser {
      ...UserBasicFragment
    }
    lastMessage {
      ...MessageFragment
    }
    unreadCount
  }
`;

export const GET_CONVERSATIONS = gql`
  ${CONVERSATION_FRAGMENT}
  query GetConversations {
    getConversations {
      ...ConversationFragment
    }
  }
`;

export const GET_MESSAGES = gql`
  ${MESSAGE_FRAGMENT}
  query GetMessages($userId: ID!, $limit: Int, $offset: Int) {
    getMessages(userId: $userId, limit: $limit, offset: $offset) {
      ...MessageFragment
    }
  }
`;

export const GET_UNREAD_COUNT = gql`
  query GetUnreadCount {
    getUnreadCount
  }
`;

// Review queries
export const REVIEW_FRAGMENT = gql`
  ${USER_BASIC_FRAGMENT}
  fragment ReviewFragment on Review {
    id
    reviewer {
      ...UserBasicFragment
    }
    reviewee {
      ...UserBasicFragment
    }
    reviewerId
    revieweeId
    requestId
    rating
    comment
    createdAt
    updatedAt
  }
`;

export const GET_USER_REVIEWS = gql`
  ${REVIEW_FRAGMENT}
  query GetUserReviews($userId: ID!, $limit: Int, $offset: Int) {
    getUserReviews(userId: $userId, limit: $limit, offset: $offset) {
      ...ReviewFragment
    }
  }
`;

export const GET_USER_REVIEW_STATS = gql`
  query GetUserReviewStats($userId: ID!) {
    getUserReviewStats(userId: $userId) {
      average
      count
    }
  }
`;

export const CAN_REVIEW = gql`
  query CanReview($revieweeId: ID!, $requestId: ID) {
    canReview(revieweeId: $revieweeId, requestId: $requestId)
  }
`;
