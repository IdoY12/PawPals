export const messageTypeDefs = `#graphql
  # Types
  type Message {
    id: ID!
    senderId: ID!
    receiverId: ID!
    sender: User!
    receiver: User!
    conversationId: String!
    content: String!
    isRead: Boolean!
    readAt: String
    createdAt: String!
    updatedAt: String!
  }

  type Conversation {
    conversationId: String!
    otherUser: User!
    lastMessage: Message!
    unreadCount: Int!
  }

  # Queries
  extend type Query {
    # Get all conversations for current user
    getConversations: [Conversation!]!
    
    # Get messages in a conversation
    getMessages(userId: ID!, limit: Int, offset: Int): [Message!]!
    
    # Get unread message count
    getUnreadCount: Int!
  }

  # Mutations
  extend type Mutation {
    # Send a message
    sendMessage(receiverId: ID!, content: String!): Message!
    
    # Mark messages as read
    markMessagesAsRead(conversationId: String!): Boolean!
  }

  # Subscriptions
  extend type Subscription {
    # Subscribe to new messages
    messageReceived: Message!
    
    # Subscribe to messages in a specific conversation
    newMessageInConversation(conversationId: String!): Message!
  }
`;
