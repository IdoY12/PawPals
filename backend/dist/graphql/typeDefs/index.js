"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.typeDefs = void 0;
const user_1 = require("./user");
const request_1 = require("./request");
const message_1 = require("./message");
const review_1 = require("./review");
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
exports.typeDefs = [
    baseTypeDefs,
    user_1.userTypeDefs,
    request_1.requestTypeDefs,
    message_1.messageTypeDefs,
    review_1.reviewTypeDefs,
];
//# sourceMappingURL=index.js.map