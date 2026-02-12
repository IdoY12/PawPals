export const userTypeDefs = `#graphql
  # Enums
  enum UserType {
    owner
    sitter
  }

  # Types
  type Location {
    type: String!
    coordinates: [Float!]!
    address: String
  }

  type Dog {
    name: String!
    breed: String!
    age: Int!
    photo: String
    description: String
  }

  type User {
    id: ID!
    email: String!
    userType: UserType!
    name: String!
    phone: String
    profilePicture: String
    location: Location!
    # Dog Owner fields
    dogs: [Dog!]
    # Dog Sitter fields
    isAvailable: Boolean
    availabilityMessage: String
    hourlyRate: Float
    bio: String
    # Rating
    rating: Float
    reviewCount: Int
    # Computed fields
    distance: Float
    # Timestamps
    createdAt: String!
    updatedAt: String!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  # Inputs
  input LocationInput {
    coordinates: [Float!]!
    address: String
  }

  input DogInput {
    name: String!
    breed: String!
    age: Int!
    photo: String
    description: String
  }

  input RegisterInput {
    email: String!
    password: String!
    userType: UserType!
    name: String!
    phone: String
    location: LocationInput!
    # Dog Owner fields
    dogs: [DogInput!]
    # Dog Sitter fields
    hourlyRate: Float
    bio: String
  }

  input ProfileUpdateInput {
    name: String
    phone: String
    profilePicture: String
    location: LocationInput
    # Dog Owner fields
    dogs: [DogInput!]
    # Dog Sitter fields
    isAvailable: Boolean
    availabilityMessage: String
    hourlyRate: Float
    bio: String
  }

  # Queries
  extend type Query {
    # Get current user profile
    me: User
    
    # Get user by ID
    getUser(id: ID!): User
    
    # Get nearby users (sitters for owners, owners with requests for sitters)
    nearbyUsers(
      radius: Float!
      userType: UserType!
      longitude: Float!
      latitude: Float!
    ): [User!]!
    
    # Get available sitters near a location
    nearbyAvailableSitters(
      radius: Float!
      longitude: Float!
      latitude: Float!
    ): [User!]!
  }

  # Mutations
  extend type Mutation {
    # Authentication
    register(input: RegisterInput!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
    
    # Profile management
    updateProfile(input: ProfileUpdateInput!): User!
    updateLocation(location: LocationInput!): User!
    
    # Dog Sitter availability
    toggleAvailability(isAvailable: Boolean!, message: String): User!
    
    # Dog management (for owners)
    addDog(dog: DogInput!): User!
    updateDog(index: Int!, dog: DogInput!): User!
    removeDog(index: Int!): User!
  }
`;
