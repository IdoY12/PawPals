import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Message } from '../types';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { formatTime } from '../utils/helpers';

interface ChatBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  showTimestamp?: boolean;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  message,
  isOwnMessage,
  showTimestamp = true,
}) => {
  return (
    <View style={[styles.container, isOwnMessage ? styles.ownContainer : styles.otherContainer]}>
      <View style={[styles.bubble, isOwnMessage ? styles.ownBubble : styles.otherBubble]}>
        <Text style={[styles.messageText, isOwnMessage ? styles.ownText : styles.otherText]}>
          {message.content}
        </Text>
      </View>
      {showTimestamp && (
        <View style={styles.metaRow}>
          <Text style={styles.timestamp}>{formatTime(message.createdAt)}</Text>
          {isOwnMessage && (
            <Text style={styles.readStatus}>{message.isRead ? ' \u2713\u2713' : ' \u2713'}</Text>
          )}
        </View>
      )}
    </View>
  );
};

interface DateDividerProps {
  date: string;
}

export const DateDivider: React.FC<DateDividerProps> = ({ date }) => {
  return (
    <View style={styles.dateDivider}>
      <View style={styles.dividerLine} />
      <View style={styles.datePill}>
        <Text style={styles.dividerText}>{date}</Text>
      </View>
      <View style={styles.dividerLine} />
    </View>
  );
};

interface TypingIndicatorProps {
  userName: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ userName }) => {
  return (
    <View style={styles.typingContainer}>
      <View style={styles.typingBubble}>
        <View style={styles.typingDots}>
          <View style={[styles.dot, styles.dot1]} />
          <View style={[styles.dot, styles.dot2]} />
          <View style={[styles.dot, styles.dot3]} />
        </View>
      </View>
      <Text style={styles.typingText}>{userName} is typing...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginVertical: SPACING.xs, paddingHorizontal: SPACING.base },
  ownContainer: { alignItems: 'flex-end' },
  otherContainer: { alignItems: 'flex-start' },
  bubble: {
    maxWidth: '78%',
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.md + 2,
    borderRadius: BORDER_RADIUS.xl,
  },
  ownBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: BORDER_RADIUS.xs,
  },
  otherBubble: {
    backgroundColor: COLORS.gray100,
    borderBottomLeftRadius: BORDER_RADIUS.xs,
  },
  messageText: { fontSize: FONTS.sizes.base, lineHeight: 22 },
  ownText: { color: COLORS.white },
  otherText: { color: COLORS.textPrimary },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  timestamp: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted },
  readStatus: { fontSize: FONTS.sizes.xs, color: COLORS.primary },
  // Divider
  dateDivider: {
    flexDirection: 'row', alignItems: 'center',
    marginVertical: SPACING.md, paddingHorizontal: SPACING.base,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.gray200 },
  datePill: {
    backgroundColor: COLORS.gray100, paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs, borderRadius: BORDER_RADIUS.full,
    marginHorizontal: SPACING.sm,
  },
  dividerText: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, fontWeight: '500' },
  // Typing
  typingContainer: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.base, marginVertical: SPACING.sm,
  },
  typingBubble: {
    backgroundColor: COLORS.gray100,
    paddingVertical: SPACING.sm + 2, paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.xl, borderBottomLeftRadius: BORDER_RADIUS.xs,
  },
  typingDots: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  dot: {
    width: 7, height: 7, borderRadius: 3.5,
    backgroundColor: COLORS.gray400,
  },
  dot1: { opacity: 0.4 },
  dot2: { opacity: 0.6 },
  dot3: { opacity: 0.8 },
  typingText: {
    fontSize: FONTS.sizes.sm, color: COLORS.textMuted,
    marginLeft: SPACING.sm, fontStyle: 'italic',
  },
});

export default ChatBubble;
