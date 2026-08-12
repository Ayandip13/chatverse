import React from 'react';
import { View } from 'react-native';
import { Check, CheckCheck, Clock } from 'lucide-react-native';

export type MessageTickStatus = 'SENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'seen' | 'delivered' | 'sent';

interface MessageStatusTicksProps {
  status?: MessageTickStatus;
  size?: number;
}

export function MessageStatusTicks({ status, size = 14 }: MessageStatusTicksProps) {
  const normStatus = (status || 'SENT').toUpperCase();

  if (normStatus === 'SENDING') {
    return <Clock size={size - 2} color="#94a3b8" />;
  }

  if (normStatus === 'READ' || normStatus === 'SEEN') {
    // WhatsApp Blue Tick (#38bdf8 / cyan-sky blue)
    return <CheckCheck size={size} color="#38bdf8" />;
  }

  if (normStatus === 'DELIVERED') {
    // WhatsApp Double Grey Tick
    return <CheckCheck size={size} color="#94a3b8" />;
  }

  // Single Grey Tick ('SENT')
  return <Check size={size} color="#94a3b8" />;
}
