import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useSubscription } from '@apollo/client';
import { useRoute, RouteProp } from '@react-navigation/native';
import { GET_MESSAGES } from '../graphql/queries';
import { SEND_MESSAGE, MARK_MESSAGES_AS_READ } from '../graphql/mutations';
import { NEW_MESSAGE_IN_CONVERSATION } from '../graphql/subscriptions';
import { useAuth } from '../context/AuthContext';
import { ChatBubble, TypingIndicator } from '../components/ChatBubble';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { generateConversationId } from '../utils/helpers';
import {
  initializeSocket,
  joinConversation,
  leaveConversation,
  startTyping,
  stopTyping,
  getSocket,
} from '../utils/socket';
import { Message, RootStackParamList } from '../types';

type ChatRouteProps = RouteProp<RootStackParamList, 'Chat'>;

export const ChatScreen: React.FC = () => {
  const route = useRoute<ChatRouteProps>();
  const { userId, userName } = route.params;
  const { user } = useAuth();

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const conversationId = generateConversationId(user?.id || '', userId);

  // Fetch messages
  const { data, loading, refetch } = useQuery(GET_MESSAGES, {
    variables: { userId, limit: 50 },
    fetchPolicy: 'cache-and-network',
  });

  // Send message mutation
  const [sendMessageMutation, { loading: sending }] = useMutation(SEND_MESSAGE, {
    update: (cache, { data }) => {
      if (data?.sendMessage) {
        const existingMessages = cache.readQuery<{ getMessages: Message[] }>({
          query: GET_MESSAGES,
          variables: { userId, limit: 50 },
        });

        if (existingMessages) {
          cache.writeQuery({
            query: GET_MESSAGES,
            variables: { userId, limit: 50 },
            data: {
              getMessages: [...existingMessages.getMessages, data.sendMessage],
            },
          });
        }
      }
    },
  });

  // Mark messages as read
  const [markAsRead] = useMutation(MARK_MESSAGES_AS_READ);

  // Subscribe to new messages
  useSubscription(NEW_MESSAGE_IN_CONVERSATION, {
    variables: { conversationId },
    onData: ({ data: subscriptionData }) => {
      if (subscriptionData?.data?.newMessageInConversation) {
        refetch();
      }
    },
  });

  // Initialize socket and join conversation
  useEffect(() => {
    let socketCleanup: (() => void) | undefined;

    const setupSocket = async () => {
      await initializeSocket();
      joinConversation(conversationId);

      const socket = getSocket();
      if (socket) {
        const onTypingStarted = (data: { userId: string }) => {
          if (data.userId === userId) setOtherUserTyping(true);
        };
        const onTypingStopped = (data: { userId: string }) => {
          if (data.userId === userId) setOtherUserTyping(false);
        };
        const onNewMessage = () => {
          refetch();
        };

        socket.on('typing:started', onTypingStarted);
        socket.on('typing:stopped', onTypingStopped);
        socket.on('message:new', onNewMessage);
        socket.on('message:received', onNewMessage);

        socketCleanup = () => {
          socket.off('typing:started', onTypingStarted);
          socket.off('typing:stopped', onTypingStopped);
          socket.off('message:new', onNewMessage);
          socket.off('message:received', onNewMessage);
        };
      }
    };

    setupSocket();

    // Mark messages as read when entering chat
    markAsRead({ variables: { conversationId } });

    return () => {
      leaveConversation(conversationId);
      socketCleanup?.();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [conversationId]);

  const messages: Message[] = data?.getMessages || [];

  // Handle typing indicator
  const handleTextChange = useCallback(
    (text: string) => {
      setInputText(text);

      if (!isTyping) {
        setIsTyping(true);
        startTyping(conversationId);
      }

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        stopTyping(conversationId);
      }, 2000);
    },
    [conversationId, isTyping]
  );

  const handleSend = async () => {
    if (!inputText.trim() || sending) return;

    const text = inputText.trim();
    setInputText('');
    setIsTyping(false);
    stopTyping(conversationId);

    try {
      await sendMessageMutation({
        variables: {
          receiverId: userId,
          content: text,
        },
      });

      // Scroll to bottom after sending
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      setInputText(text); // Restore text if failed
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.senderId === user?.id;
    return (
      <ChatBubble
        message={item}
        isOwnMessage={isOwnMessage}
        showTimestamp={true}
      />
    );
  };

  if (loading && !data) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        onLayout={() => flatListRef.current?.scrollToEnd()}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name="chatbubble-outline"
              size={48}
              color={COLORS.gray300}
            />
            <Text style={styles.emptyText}>
              Start the conversation with {userName}
            </Text>
          </View>
        }
        ListFooterComponent={
          otherUserTyping ? <TypingIndicator userName={userName} /> : null
        }
      />

      {/* Input Container */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={handleTextChange}
            placeholder="Type a message..."
            placeholderTextColor={COLORS.gray500}
            multiline
            maxLength={2000}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || sending) && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Ionicons name="send" size={20} color={COLORS.white} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  messagesList: {
    paddingVertical: SPACING.md,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxxl,
  },
  emptyText: {
    marginTop: SPACING.md,
    fontSize: FONTS.sizes.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  inputContainer: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.gray100,
    borderRadius: BORDER_RADIUS.xl,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingRight: SPACING.sm,
    fontSize: FONTS.sizes.base,
    color: COLORS.textPrimary,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.sm,
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.gray400,
  },
});

export default ChatScreen;
