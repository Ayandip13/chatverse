import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  Image,
  TouchableOpacity,
  TextInput,
  PanResponder,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  RotateCw,
  Crop,
  Pencil,
  Smile,
  Undo2,
  SendHorizontal,
  Trash2,
} from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { EMOJI_CATEGORIES } from '../../constants/emojis';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const COLOR_PALETTE = [
  '#ffffff',
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#06b6d4',
  '#3b82f6',
  '#a855f7',
  '#ec4899',
  '#000000',
];

interface PathData {
  d: string;
  color: string;
  width: number;
}

interface StickerItem {
  id: string;
  emoji: string;
  x: number;
  y: number;
}

interface ImageEditorModalProps {
  visible: boolean;
  imageUri: string | null;
  onClose: () => void;
  onSend: (finalUri: string, caption: string) => Promise<void> | void;
  isUploading?: boolean;
  themeColor?: string;
}

export function ImageEditorModal({
  visible,
  imageUri,
  onClose,
  onSend,
  isUploading = false,
  themeColor = '#6366f1',
}: ImageEditorModalProps) {
  const insets = useSafeAreaInsets();
  const [currentUri, setCurrentUri] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [stickerCategory, setStickerCategory] = useState('popular');

  const currentCategoryObj =
    EMOJI_CATEGORIES.find((c) => c.id === stickerCategory) || EMOJI_CATEGORIES[0];
  const [selectedColor, setSelectedColor] = useState('#ef4444');
  const [paths, setPaths] = useState<PathData[]>([]);
  const [stickers, setStickers] = useState<StickerItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const currentPathRef = useRef<string>('');

  useEffect(() => {
    if (visible && imageUri) {
      setCurrentUri(imageUri);
      setCaption('');
      setIsDrawing(false);
      setShowEmojiPicker(false);
      setPaths([]);
      setStickers([]);
    }
  }, [visible, imageUri]);

  // PanResponder for freehand drawing
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        currentPathRef.current = `M ${locationX.toFixed(1)} ${locationY.toFixed(1)}`;
        setPaths((prev) => [
          ...prev,
          { d: currentPathRef.current, color: selectedColor, width: 4 },
        ]);
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        currentPathRef.current += ` L ${locationX.toFixed(1)} ${locationY.toFixed(1)}`;
        setPaths((prev) => {
          if (prev.length === 0) return prev;
          const updated = [...prev];
          updated[updated.length - 1] = {
            d: currentPathRef.current,
            color: selectedColor,
            width: 4,
          };
          return updated;
        });
      },
      onPanResponderRelease: () => {
        currentPathRef.current = '';
      },
    })
  ).current;

  // Rotate 90 degrees Clockwise
  const handleRotate = async () => {
    if (!currentUri) return;
    try {
      setIsProcessing(true);
      const manipResult = await ImageManipulator.manipulateAsync(
        currentUri,
        [{ rotate: 90 }],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
      );
      setCurrentUri(manipResult.uri);
    } catch (err) {
      console.log('Rotate error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Re-crop with native ImagePicker cropper
  const handleCrop = async () => {
    if (!currentUri) return;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.9,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setCurrentUri(result.assets[0].uri);
      }
    } catch (e) {
      console.log('Crop error:', e);
    }
  };

  // Undo last action (draw path or sticker)
  const handleUndo = () => {
    if (paths.length > 0) {
      setPaths((prev) => prev.slice(0, -1));
    } else if (stickers.length > 0) {
      setStickers((prev) => prev.slice(0, -1));
    }
  };

  // Add emoji sticker
  const handleAddSticker = (emoji: string) => {
    const newSticker: StickerItem = {
      id: Date.now().toString(),
      emoji,
      x: SCREEN_WIDTH / 2 - 24,
      y: SCREEN_HEIGHT / 3,
    };
    setStickers((prev) => [...prev, newSticker]);
    setShowEmojiPicker(false);
  };

  const handleSend = () => {
    if (!currentUri) return;
    onSend(currentUri, caption.trim());
  };

  if (!visible || !currentUri) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <View className="flex-1 bg-black">
        {/* Top Control Bar */}
        <View 
          className="flex-row items-center justify-between px-4 py-3 z-30 bg-black/50"
          style={{ paddingTop: Math.max(insets.top, 16) }}
        >
          {/* Close button */}
          <TouchableOpacity
            onPress={onClose}
            className="w-10 h-10 rounded-full bg-white/20 items-center justify-center"
            activeOpacity={0.7}
          >
            <X size={22} color="#ffffff" />
          </TouchableOpacity>

          {/* Action Toolbar */}
          <View className="flex-row items-center gap-3">
            {/* Rotate */}
            <TouchableOpacity
              onPress={handleRotate}
              disabled={isProcessing}
              className="w-10 h-10 rounded-full bg-white/20 items-center justify-center"
              activeOpacity={0.7}
            >
              <RotateCw size={20} color="#ffffff" />
            </TouchableOpacity>

            {/* Crop */}
            <TouchableOpacity
              onPress={handleCrop}
              className="w-10 h-10 rounded-full bg-white/20 items-center justify-center"
              activeOpacity={0.7}
            >
              <Crop size={20} color="#ffffff" />
            </TouchableOpacity>

            {/* Stickers / Emojis */}
            <TouchableOpacity
              onPress={() => {
                setShowEmojiPicker((prev) => !prev);
                setIsDrawing(false);
              }}
              className={`w-10 h-10 rounded-full items-center justify-center ${
                showEmojiPicker ? 'bg-indigo-600' : 'bg-white/20'
              }`}
              activeOpacity={0.7}
            >
              <Smile size={20} color="#ffffff" />
            </TouchableOpacity>

            {/* Pen / Draw */}
            <TouchableOpacity
              onPress={() => {
                setIsDrawing((prev) => !prev);
                setShowEmojiPicker(false);
              }}
              className={`w-10 h-10 rounded-full items-center justify-center ${
                isDrawing ? 'bg-indigo-600' : 'bg-white/20'
              }`}
              activeOpacity={0.7}
            >
              <Pencil size={20} color="#ffffff" />
            </TouchableOpacity>

            {/* Undo */}
            {(paths.length > 0 || stickers.length > 0) && (
              <TouchableOpacity
                onPress={handleUndo}
                className="w-10 h-10 rounded-full bg-white/20 items-center justify-center"
                activeOpacity={0.7}
              >
                <Undo2 size={20} color="#ffffff" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Color Palette bar when Drawing Mode active */}
        {isDrawing && (
          <View className="px-4 py-2 bg-black/60 flex-row items-center justify-around z-30">
            {COLOR_PALETTE.map((color) => (
              <TouchableOpacity
                key={color}
                onPress={() => setSelectedColor(color)}
                className={`w-7 h-7 rounded-full items-center justify-center ${
                  selectedColor === color ? 'border-2 border-white scale-125' : ''
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </View>
        )}

        {/* Emoji Sticker Picker Sheet */}
        {showEmojiPicker && (
          <View className="bg-gray-900/95 border-b border-gray-800 z-30 pb-2">
            {/* Category tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-3 py-1.5 border-b border-gray-800/80">
              {EMOJI_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setStickerCategory(cat.id)}
                  className={`px-2.5 py-1 mr-1 rounded-full flex-row items-center gap-1 ${
                    stickerCategory === cat.id ? 'bg-indigo-600' : 'bg-gray-800'
                  }`}
                >
                  <Text className="text-sm">{cat.icon}</Text>
                  {stickerCategory === cat.id && (
                    <Text className="text-xs font-bold text-white">{cat.name.split(' ')[0]}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Emojis list */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-3 pt-2">
              {currentCategoryObj.emojis.map((emoji, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleAddSticker(emoji)}
                  className="p-2 mr-1 active:bg-gray-800 rounded-xl"
                >
                  <Text className="text-3xl">{emoji}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Main Image Canvas Area */}
        <View className="flex-1 items-center justify-center relative overflow-hidden bg-black">
          {isProcessing ? (
            <ActivityIndicator size="large" color="#ffffff" />
          ) : (
            <Image
              source={{ uri: currentUri }}
              className="w-full h-full"
              resizeMode="contain"
            />
          )}

          {/* SVG Freehand Drawing Layer */}
          <View
            className="absolute inset-0 z-10"
            {...(isDrawing ? panResponder.panHandlers : {})}
            pointerEvents={isDrawing ? 'auto' : 'none'}
          >
            <Svg height="100%" width="100%" className="absolute inset-0">
              {paths.map((p, index) => (
                <Path
                  key={index}
                  d={p.d}
                  stroke={p.color}
                  strokeWidth={p.width}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              ))}
            </Svg>
          </View>

          {/* Emoji Stickers Layer */}
          {stickers.map((st) => (
            <View
              key={st.id}
              className="absolute z-20"
              style={{ left: st.x, top: st.y }}
            >
              <Text className="text-5xl">{st.emoji}</Text>
            </View>
          ))}
        </View>

        {/* Bottom Caption Input & WhatsApp-style Send Button */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? insets.bottom : 0}
        >
          <View 
            className="px-4 py-3 bg-black/80 flex-row items-center gap-3 z-30"
            style={{ paddingBottom: Math.max(insets.bottom, 16) }}
          >
            {/* Caption Input Pill */}
            <View className="flex-1 bg-gray-800/90 rounded-full px-4 py-2.5 flex-row items-center border border-gray-700">
              <TextInput
                value={caption}
                onChangeText={setCaption}
                placeholder="Add a caption..."
                placeholderTextColor="#9ca3af"
                className="flex-1 text-white text-base py-0 font-medium"
                multiline={false}
                returnKeyType="send"
                onSubmitEditing={handleSend}
              />
            </View>

            {/* WhatsApp Send Floating Action Button */}
            <TouchableOpacity
              onPress={handleSend}
              disabled={isUploading}
              className="w-13 h-13 rounded-full items-center justify-center shadow-lg"
              style={{ backgroundColor: themeColor }}
              activeOpacity={0.8}
            >
              {isUploading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <SendHorizontal size={22} color="#ffffff" className="ml-0.5" />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
