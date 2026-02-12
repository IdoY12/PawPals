import { userResolvers } from './user';
import { requestResolvers } from './request';
import { messageResolvers } from './message';
import { reviewResolvers } from './review';

// Merge all resolvers
export const resolvers = {
  Query: {
    ...userResolvers.Query,
    ...requestResolvers.Query,
    ...messageResolvers.Query,
    ...reviewResolvers.Query,
  },
  Mutation: {
    ...userResolvers.Mutation,
    ...requestResolvers.Mutation,
    ...messageResolvers.Mutation,
    ...reviewResolvers.Mutation,
  },
  Subscription: {
    ...requestResolvers.Subscription,
    ...messageResolvers.Subscription,
  },
  // Field resolvers
  User: userResolvers.User,
  Request: requestResolvers.Request,
  Message: messageResolvers.Message,
  Review: reviewResolvers.Review,
  Conversation: messageResolvers.Conversation,
};
