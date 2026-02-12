import { gql } from '@apollo/client';
import { MESSAGE_FRAGMENT, REQUEST_FRAGMENT } from './queries';

// Message subscriptions
export const MESSAGE_RECEIVED = gql`
  ${MESSAGE_FRAGMENT}
  subscription MessageReceived {
    messageReceived {
      ...MessageFragment
    }
  }
`;

export const NEW_MESSAGE_IN_CONVERSATION = gql`
  ${MESSAGE_FRAGMENT}
  subscription NewMessageInConversation($conversationId: String!) {
    newMessageInConversation(conversationId: $conversationId) {
      ...MessageFragment
    }
  }
`;

// Request subscriptions
export const NEW_REQUEST_NEARBY = gql`
  ${REQUEST_FRAGMENT}
  subscription NewRequestNearby($radius: Float!, $longitude: Float!, $latitude: Float!) {
    newRequestNearby(radius: $radius, longitude: $longitude, latitude: $latitude) {
      ...RequestFragment
      distance
    }
  }
`;

export const REQUEST_UPDATED = gql`
  ${REQUEST_FRAGMENT}
  subscription RequestUpdated($id: ID!) {
    requestUpdated(id: $id) {
      ...RequestFragment
    }
  }
`;
