import { gql } from '@apollo/client';
import { USER_FRAGMENT, REQUEST_FRAGMENT, MESSAGE_FRAGMENT, REVIEW_FRAGMENT } from './queries';

// Auth mutations
export const REGISTER = gql`
  ${USER_FRAGMENT}
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      token
      user {
        ...UserFragment
      }
    }
  }
`;

export const LOGIN = gql`
  ${USER_FRAGMENT}
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        ...UserFragment
      }
    }
  }
`;

// Profile mutations
export const UPDATE_PROFILE = gql`
  ${USER_FRAGMENT}
  mutation UpdateProfile($input: ProfileUpdateInput!) {
    updateProfile(input: $input) {
      ...UserFragment
    }
  }
`;

export const UPDATE_LOCATION = gql`
  ${USER_FRAGMENT}
  mutation UpdateLocation($location: LocationInput!) {
    updateLocation(location: $location) {
      ...UserFragment
    }
  }
`;

export const TOGGLE_AVAILABILITY = gql`
  ${USER_FRAGMENT}
  mutation ToggleAvailability($isAvailable: Boolean!, $message: String) {
    toggleAvailability(isAvailable: $isAvailable, message: $message) {
      ...UserFragment
    }
  }
`;

// Dog mutations
export const ADD_DOG = gql`
  ${USER_FRAGMENT}
  mutation AddDog($dog: DogInput!) {
    addDog(dog: $dog) {
      ...UserFragment
    }
  }
`;

export const UPDATE_DOG = gql`
  ${USER_FRAGMENT}
  mutation UpdateDog($index: Int!, $dog: DogInput!) {
    updateDog(index: $index, dog: $dog) {
      ...UserFragment
    }
  }
`;

export const REMOVE_DOG = gql`
  ${USER_FRAGMENT}
  mutation RemoveDog($index: Int!) {
    removeDog(index: $index) {
      ...UserFragment
    }
  }
`;

// Request mutations
export const CREATE_REQUEST = gql`
  ${REQUEST_FRAGMENT}
  mutation CreateRequest($input: CreateRequestInput!) {
    createRequest(input: $input) {
      ...RequestFragment
    }
  }
`;

export const UPDATE_REQUEST = gql`
  ${REQUEST_FRAGMENT}
  mutation UpdateRequest($id: ID!, $input: UpdateRequestInput!) {
    updateRequest(id: $id, input: $input) {
      ...RequestFragment
    }
  }
`;

export const DELETE_REQUEST = gql`
  mutation DeleteRequest($id: ID!) {
    deleteRequest(id: $id)
  }
`;

export const COMPLETE_REQUEST = gql`
  ${REQUEST_FRAGMENT}
  mutation CompleteRequest($id: ID!) {
    completeRequest(id: $id) {
      ...RequestFragment
    }
  }
`;

export const CANCEL_REQUEST = gql`
  ${REQUEST_FRAGMENT}
  mutation CancelRequest($id: ID!) {
    cancelRequest(id: $id) {
      ...RequestFragment
    }
  }
`;

// Message mutations
export const SEND_MESSAGE = gql`
  ${MESSAGE_FRAGMENT}
  mutation SendMessage($receiverId: ID!, $content: String!) {
    sendMessage(receiverId: $receiverId, content: $content) {
      ...MessageFragment
    }
  }
`;

export const MARK_MESSAGES_AS_READ = gql`
  mutation MarkMessagesAsRead($conversationId: String!) {
    markMessagesAsRead(conversationId: $conversationId)
  }
`;

// Review mutations
export const CREATE_REVIEW = gql`
  ${REVIEW_FRAGMENT}
  mutation CreateReview($input: CreateReviewInput!) {
    createReview(input: $input) {
      ...ReviewFragment
    }
  }
`;
