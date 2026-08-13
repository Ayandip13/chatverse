import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Play, Pause, Volume2 } from 'lucide-react-native';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import { getMediaUrl } from '../../utils/avatarUtil';

interface VoicePlayerProps {
  audioUrl: string;
  durationSeconds?: number;
  isOwnMessage?: boolean;
}

export function VoicePlayer({ audioUrl, durationSeconds = 0, isOwnMessage = false }: VoicePlayerProps) {
  const resolvedUrl = getMediaUrl(audioUrl);
  const player = useAudioPlayer(resolvedUrl);
  const status = useAudioPlayerStatus(player);

  const isPlaying = status.playing;
  const isBuffering = status.isBuffering;
  const currentTime = status.currentTime || 0;
  const totalDuration = status.duration || durationSeconds;

  const handleTogglePlay = async () => {
    try {
      if (isPlaying) {
        player.pause();
      } else {
        await setAudioModeAsync({
          allowsRecording: false,
          playsInSilentMode: true,
        }).catch(() => {});

        if (totalDuration > 0 && currentTime >= totalDuration - 0.5) {
          player.seekTo(0);
        }
        player.play();
      }
    } catch (error: any) {
      console.error('Error playing voice note:', error);
      Alert.alert('Playback Error', 'Failed to play voice note.');
    }
  };

  const formatSeconds = (sec: number) => {
    const totalSec = Math.max(0, Math.floor(sec));
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progressPercent = totalDuration > 0 ? Math.min(100, (currentTime / totalDuration) * 100) : 0;

  return (
    <View className="flex-row items-center gap-3 py-1 px-1 min-w-[200px]">
      <TouchableOpacity
        onPress={handleTogglePlay}
        disabled={isBuffering}
        className={`w-10 h-10 rounded-full items-center justify-center ${
          isOwnMessage ? 'bg-white/20' : 'bg-indigo-100 dark:bg-indigo-950'
        }`}
      >
        {isBuffering ? (
          <ActivityIndicator size="small" color={isOwnMessage ? '#ffffff' : '#6366f1'} />
        ) : isPlaying ? (
          <Pause size={18} color={isOwnMessage ? '#ffffff' : '#6366f1'} />
        ) : (
          <Play size={18} color={isOwnMessage ? '#ffffff' : '#6366f1'} className="ml-0.5" />
        )}
      </TouchableOpacity>

      <View className="flex-1 justify-center">
        <View className={`h-1.5 w-full rounded-full overflow-hidden ${isOwnMessage ? 'bg-white/30' : 'bg-gray-200 dark:bg-gray-700'}`}>
          <View
            className={`h-full ${isOwnMessage ? 'bg-white' : 'bg-indigo-600'}`}
            style={{ width: `${progressPercent}%` }}
          />
        </View>

        <View className="flex-row justify-between items-center mt-1">
          <Text className={`text-[10px] font-mono ${isOwnMessage ? 'text-indigo-100' : 'text-gray-500 dark:text-gray-400'}`}>
            {isPlaying || currentTime > 0 ? formatSeconds(currentTime) : formatSeconds(totalDuration)}
          </Text>
          <View className="flex-row items-center gap-0.5">
            <Volume2 size={10} color={isOwnMessage ? '#e0e7ff' : '#9ca3af'} />
            <Text className={`text-[9px] font-bold ${isOwnMessage ? 'text-indigo-200' : 'text-gray-400'}`}>Voice Note</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
