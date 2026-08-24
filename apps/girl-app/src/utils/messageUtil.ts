export type MessageType = 'TEXT' | 'IMAGE' | 'VOICE' | 'REPLY' | 'EMPTY';

export interface ParsedMessage {
  type: MessageType;
  displayText: string;
  imageUrl?: string;
  caption?: string;
  voiceDuration?: number;
  replyQuote?: string;
  raw: string;
}

/**
 * Parses raw message content protocol into structured message preview details.
 * Supports:
 * - Image: `[IMAGE]:/uploads/...` or `[IMAGE]:/uploads/...\nCaption` or `[IMAGE]:/uploads/...[CAPTION]:Caption`
 * - Voice: `[VOICE:12]:/uploads/...` or `[VOICE]:/uploads/...`
 * - Reply: `[REPLY:quote]:actual message`
 * - Text: standard plain text
 */
export function parseMessageContent(rawContent?: string | null): ParsedMessage {
  if (!rawContent || !rawContent.trim()) {
    return {
      type: 'EMPTY',
      displayText: '',
      raw: '',
    };
  }

  const trimmed = rawContent.trim();

  // 1. Image message: [IMAGE]:url or [IMAGE]:url\ncaption
  if (trimmed.startsWith('[IMAGE]:')) {
    const payload = trimmed.replace('[IMAGE]:', '').trim();
    let imageUrl = payload;
    let caption = '';

    if (payload.includes('[CAPTION]:')) {
      const parts = payload.split('[CAPTION]:');
      imageUrl = parts[0].trim();
      caption = parts[1]?.trim() || '';
    } else if (payload.includes('\n')) {
      const newlineIdx = payload.indexOf('\n');
      imageUrl = payload.substring(0, newlineIdx).trim();
      caption = payload.substring(newlineIdx + 1).trim();
    }

    return {
      type: 'IMAGE',
      displayText: caption ? `Photo: ${caption}` : 'Photo',
      imageUrl,
      caption,
      raw: trimmed,
    };
  }

  // 2. Voice message: [VOICE:15]:url or [VOICE]:url
  if (trimmed.startsWith('[VOICE')) {
    const match = /^\[VOICE(?::(\d+))?\]:(.*)$/.exec(trimmed);
    const duration = match && match[1] ? parseInt(match[1], 10) : 0;
    const voiceUrl = match ? match[2].trim() : trimmed.replace(/^\[VOICE.*?\]:/, '').trim();
    return {
      type: 'VOICE',
      displayText: duration > 0 ? `Voice message (${duration}s)` : 'Voice message',
      voiceDuration: duration,
      raw: trimmed,
    };
  }

  // 3. Reply message: [REPLY:quote]:actualMessage
  if (trimmed.startsWith('[REPLY:')) {
    const endQuoteIdx = trimmed.indexOf(']:');
    if (endQuoteIdx !== -1) {
      const quote = trimmed.substring(7, endQuoteIdx);
      const actualMessage = trimmed.substring(endQuoteIdx + 2).trim();
      return {
        type: 'REPLY',
        displayText: actualMessage || 'Reply',
        replyQuote: quote,
        raw: trimmed,
      };
    }
  }

  // 4. Default plain text
  return {
    type: 'TEXT',
    displayText: trimmed,
    raw: trimmed,
  };
}

/**
 * Format quote excerpt for replies so nested quotes/images/voices aren't raw protocol strings
 */
export function formatQuoteExcerpt(content: string): string {
  if (!content) return '';
  const parsed = parseMessageContent(content);
  if (parsed.type === 'IMAGE') return parsed.caption ? `Photo: ${parsed.caption.substring(0, 40)}` : 'Photo';
  if (parsed.type === 'VOICE') return parsed.displayText;
  if (parsed.type === 'REPLY') return parsed.displayText.substring(0, 50);
  return parsed.displayText.substring(0, 50);
}
