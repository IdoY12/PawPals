export const reviewTypeDefs = `#graphql
  # Types
  type Review {
    id: ID!
    reviewer: User!
    reviewee: User!
    reviewerId: ID!
    revieweeId: ID!
    requestId: ID
    rating: Int!
    comment: String!
    createdAt: String!
    updatedAt: String!
  }

  type ReviewStats {
    average: Float!
    count: Int!
  }

  # Inputs
  input CreateReviewInput {
    revieweeId: ID!
    requestId: ID
    rating: Int!
    comment: String!
  }

  # Queries
  extend type Query {
    # Get reviews for a user
    getUserReviews(userId: ID!, limit: Int, offset: Int): [Review!]!
    
    # Get review stats for a user
    getUserReviewStats(userId: ID!): ReviewStats!
    
    # Check if current user can review another user
    canReview(revieweeId: ID!, requestId: ID): Boolean!
  }

  # Mutations
  extend type Mutation {
    # Create a review
    createReview(input: CreateReviewInput!): Review!
  }
`;
