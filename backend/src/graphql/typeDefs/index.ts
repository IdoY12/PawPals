import { userTypeDefs } from './user';
import { requestTypeDefs } from './request';
import { messageTypeDefs } from './message';
import { reviewTypeDefs } from './review';

// Base type definitions with Query, Mutation, and Subscription roots
const baseTypeDefs = `#graphql
  type Query {
    _empty: String
  }

  type Mutation {
    _empty: String
  }

  type Subscription {
    _empty: String
  }
`;

// Combine all type definitions
export const typeDefs = [
  baseTypeDefs,
  userTypeDefs,
  requestTypeDefs,
  messageTypeDefs,
  reviewTypeDefs,
];
