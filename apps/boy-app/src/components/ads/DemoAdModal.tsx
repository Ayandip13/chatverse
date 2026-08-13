import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';
import { X, ExternalLink, Sparkles } from 'lucide-react-native';

/**
 * DemoAdModal Component
 * 
 * FUTURE ADMOB INTEGRATION GUIDE:
 * To integrate real Google AdMob Interstitial Ads in the future:
 * 1. Install react-native-google-mobile-ads:
 *    `npm install react-native-google-mobile-ads`
 * 2. Add your AdMob App ID to app.json / AndroidManifest.xml.
 * 3. Import `InterstitialAd`, `AdRequest`, `TestIds` from 'react-native-google-mobile-ads'.
 * 4. Replace or wrap this component with the AdMob Interstitial hook:
 *    ```ts
 *    const interstitial = InterstitialAd.createForAdRequest(adUnitId, {
 *      requestNonPersonalizedAdsOnly: true,
 *    });
 *    interstitial.addAdEventListener(AdEventType.CLOSED, () => onClose());
 *    interstitial.show();
 *    ```
 */

interface DemoAdModalProps {
  visible: boolean;
  onClose: () => void;
}

export function DemoAdModal({ visible, onClose }: DemoAdModalProps) {
  const [skipCountdown, setSkipCountdown] = useState(5);
  const [canSkip, setCanSkip] = useState(false);

  useEffect(() => {
    if (!visible) {
      setSkipCountdown(5);
      setCanSkip(false);
      return;
    }

    const timer = setInterval(() => {
      setSkipCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanSkip(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View className="flex-1 bg-black/90 justify-center items-center px-5">
        {/* Main Ad Card Container */}
        <View className="w-full bg-gray-900 rounded-3xl overflow-hidden border border-gray-800 shadow-2xl">
          {/* Header Bar */}
          <View className="flex-row justify-between items-center px-5 py-4 bg-gray-950/80 border-b border-gray-800">
            <View className="flex-row items-center">
              <View className="bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/40 mr-2">
                <Text className="text-amber-400 text-[10px] font-black tracking-widest uppercase">AD</Text>
              </View>
              <Text className="text-gray-400 text-xs font-semibold">Sponsored Ad</Text>
            </View>

            {/* Skip Ad Button */}
            <TouchableOpacity
              onPress={canSkip ? onClose : undefined}
              disabled={!canSkip}
              activeOpacity={0.8}
              className={`px-3.5 py-1.5 rounded-full flex-row items-center ${
                canSkip ? 'bg-indigo-600 active:bg-indigo-700' : 'bg-gray-800 opacity-80'
              }`}
            >
              <Text className="text-white text-xs font-bold mr-1">
                {canSkip ? 'Skip Ad' : `Skip in ${skipCountdown}s`}
              </Text>
              {canSkip && <X size={14} color="#ffffff" />}
            </TouchableOpacity>
          </View>

          {/* Ad Banner Content */}
          <View className="p-6 items-center">
            {/* Promo Icon / Logo */}
            <View className="w-20 h-20 bg-indigo-600/20 rounded-2xl border border-indigo-500/30 items-center justify-center mb-4">
              <Sparkles size={40} color="#818cf8" />
            </View>

            <Text className="text-xl font-black text-white text-center mb-2">
              ChatVerse VIP Pass
            </Text>

            <Text className="text-gray-400 text-xs text-center mb-6 leading-5 px-2">
              Unlock unlimited messages, priority matching, and exclusive VIP badges for your profile!
            </Text>

            {/* Demo CTA Button */}
            <TouchableOpacity
              onPress={() => {}}
              className="w-full bg-indigo-600 py-3.5 rounded-2xl flex-row items-center justify-center shadow-lg shadow-indigo-500/30 mb-3"
            >
              <Text className="text-white font-extrabold text-sm mr-2">Explore Premium Features</Text>
              <ExternalLink size={16} color="#ffffff" />
            </TouchableOpacity>

            <Text className="text-gray-500 text-[10px] text-center">
              AdMob Interstitial Demo • 2 min time limit reached
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}
