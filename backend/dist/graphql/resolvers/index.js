"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvers = void 0;
const user_1 = require("./user");
const request_1 = require("./request");
const message_1 = require("./message");
const review_1 = require("./review");
// Merge all resolvers
exports.resolvers = {
    Query: {
        ...user_1.userResolvers.Query,
        ...request_1.requestResolvers.Query,
        ...message_1.messageResolvers.Query,
        ...review_1.reviewResolvers.Query,
    },
    Mutation: {
        ...user_1.userResolvers.Mutation,
        ...request_1.requestResolvers.Mutation,
        ...message_1.messageResolvers.Mutation,
        ...review_1.reviewResolvers.Mutation,
    },
    Subscription: {
        ...request_1.requestResolvers.Subscription,
        ...message_1.messageResolvers.Subscription,
    },
    // Field resolvers
    User: user_1.userResolvers.User,
    Request: request_1.requestResolvers.Request,
    Message: message_1.messageResolvers.Message,
    Review: review_1.reviewResolvers.Review,
    Conversation: message_1.messageResolvers.Conversation,
};
//# sourceMappingURL=index.js.map