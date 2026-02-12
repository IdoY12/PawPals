export const requestTypeDefs = `#graphql
  # Enums
  enum RequestStatus {
    active
    completed
    cancelled
  }

  # Types
  type Request {
    id: ID!
    owner: User!
    ownerId: ID!
    message: String!
    startDate: String!
    endDate: String!
    location: Location!
    status: RequestStatus!
    specialInstructions: String
    preferredRate: Float
    # Computed
    distance: Float
    # Timestamps
    createdAt: String!
    updatedAt: String!
  }

  # Inputs
  input CreateRequestInput {
    message: String!
    startDate: String!
    endDate: String!
    location: LocationInput!
    specialInstructions: String
    preferredRate: Float
  }

  input UpdateRequestInput {
    message: String
    startDate: String
    endDate: String
    location: LocationInput
    specialInstructions: String
    preferredRate: Float
    status: RequestStatus
  }

  # Queries
  extend type Query {
    # Get request by ID
    getRequest(id: ID!): Request
    
    # Get current user's requests
    myRequests(status: RequestStatus): [Request!]!
    
    # Get nearby active requests (for sitters)
    nearbyRequests(
      radius: Float!
      longitude: Float!
      latitude: Float!
    ): [Request!]!
  }

  # Mutations
  extend type Mutation {
    # Create a new dog sitting request
    createRequest(input: CreateRequestInput!): Request!
    
    # Update an existing request
    updateRequest(id: ID!, input: UpdateRequestInput!): Request!
    
    # Delete a request
    deleteRequest(id: ID!): Boolean!
    
    # Complete a request
    completeRequest(id: ID!): Request!
    
    # Cancel a request
    cancelRequest(id: ID!): Request!
  }

  # Subscriptions
  extend type Subscription {
    # Subscribe to new requests in an area
    newRequestNearby(
      radius: Float!
      longitude: Float!
      latitude: Float!
    ): Request!
    
    # Subscribe to request updates
    requestUpdated(id: ID!): Request!
  }
`;
