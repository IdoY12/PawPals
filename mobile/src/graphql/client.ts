import { ApolloClient, InMemoryCache, createHttpLink, split } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:4000';
const WS_URL = Constants.expoConfig?.extra?.wsUrl || 'ws://localhost:4000';

// Create HTTP link
const httpLink = createHttpLink({
  uri: `${API_URL}/graphql`,
});

// Create auth link
const authLink = setContext(async (_, { headers }) => {
  try {
    const token = await AsyncStorage.getItem('@dog_sitting_token');
    return {
      headers: {
        ...headers,
        authorization: token ? `Bearer ${token}` : '',
      },
    };
  } catch (error) {
    console.error('Error getting token:', error);
    return { headers };
  }
});

// Create WebSocket link for subscriptions
const wsLink = new GraphQLWsLink(
  createClient({
    url: `${WS_URL}/graphql`,
    connectionParams: async () => {
      try {
        const token = await AsyncStorage.getItem('@dog_sitting_token');
        return {
          authorization: token ? `Bearer ${token}` : '',
        };
      } catch (error) {
        console.error('Error getting token for WS:', error);
        return {};
      }
    },
  })
);

// Split link based on operation type
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  authLink.concat(httpLink)
);

// Create Apollo Client
export const apolloClient = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache({
    // Explicitly disable to silence the deprecation warning in Apollo 3.14+
    canonizeResults: false,
    typePolicies: {
      Query: {
        fields: {
          nearbyUsers: {
            merge: false,
          },
          nearbyAvailableSitters: {
            merge: false,
          },
          nearbyRequests: {
            merge: false,
          },
          getMessages: {
            keyArgs: ['userId'],
            merge(existing = [], incoming) {
              return [...incoming];
            },
          },
          getConversations: {
            merge: false,
          },
        },
      },
      User: {
        keyFields: ['id'],
      },
      Request: {
        keyFields: ['id'],
      },
      Message: {
        keyFields: ['id'],
      },
      Conversation: {
        keyFields: ['conversationId'],
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
});

export default apolloClient;
