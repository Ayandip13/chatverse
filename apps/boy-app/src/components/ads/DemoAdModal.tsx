import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, ExternalLink, Sparkles, ShieldCheck, Zap, Award, Star } from 'lucide-react-native';

/**
 * DemoAdModal Component (Full-Screen Interstitial Ad)
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
    <Modal visible={visible} transparent={false} animationType="slide" statusBarTranslucent>
      <View className="flex-1 bg-gray-950">
        <SafeAreaView className="flex-1 justify-between">
          {/* Top Bar */}
          <View className="flex-row justify-between items-center px-6 py-4 border-b border-gray-850 bg-gray-900/60">
            <View className="flex-row items-center">
              <View className="bg-amber-500/20 px-2.5 py-1 rounded-md border border-amber-500/40 mr-2">
                <Text className="text-amber-400 text-xs font-black tracking-widest uppercase">AD</Text>
              </View>
              <Text className="text-gray-300 text-xs font-bold">Sponsored Ad</Text>
            </View>

            {/* Skip Ad Button */}
            <TouchableOpacity
              onPress={canSkip ? onClose : undefined}
              disabled={!canSkip}
              activeOpacity={0.8}
              className={`px-4 py-2 rounded-full flex-row items-center shadow-md ${
                canSkip ? 'bg-indigo-600 active:bg-indigo-700' : 'bg-gray-800 opacity-80'
              }`}
            >
              <Text className="text-white text-xs font-black mr-1">
                {canSkip ? 'Skip Ad' : `Skip in ${skipCountdown}s`}
              </Text>
              {canSkip && <X size={14} color="#ffffff" />}
            </TouchableOpacity>
          </View>

          {/* Full Screen Main Content */}
          <View className="flex-1 justify-center items-center px-8 py-6">
            {/* Ad Hero Logo Container */}
            <View className="w-28 h-28 bg-indigo-600/30 rounded-3xl border-2 border-indigo-500/40 items-center justify-center mb-6 shadow-2xl shadow-indigo-500/20">
              <Sparkles size={56} color="#a5b4fc" />
            </View>

            {/* Badge */}
            <View className="flex-row items-center bg-indigo-950/80 border border-indigo-800/60 px-3 py-1 rounded-full mb-3">
              <View className="mr-1.5 justify-center items-center">
                <Star size={12} color="#fbbf24" fill="#fbbf24" />
              </View>
              <Text className="text-indigo-300 text-xs font-extrabold tracking-wide uppercase">Featured Offer</Text>
            </View>

            <Text className="text-3xl font-black text-white text-center mb-3 leading-tight">
              ChatVerse VIP Pass
            </Text>

            <Text className="text-gray-400 text-sm text-center mb-8 leading-6 max-w-xs">
              Unlock unlimited messages, priority matching, instant chat boosts, and exclusive VIP badges for your profile!
            </Text>

            {/* Highlights Grid */}
            <View className="w-full bg-gray-900/90 rounded-2xl p-4 border border-gray-800 space-y-3">
              <View className="flex-row items-center">
                <Zap size={16} color="#6366f1" />
                <Text className="text-gray-200 text-xs font-bold ml-2.5">Instant High-Priority Matchmaking</Text>
              </View>
              <View className="flex-row items-center mt-2.5">
                <ShieldCheck size={16} color="#10b981" />
                <Text className="text-gray-200 text-xs font-bold ml-2.5">Verified Profile Badge & Unlimited Reach</Text>
              </View>
              <View className="flex-row items-center mt-2.5">
                <Award size={16} color="#f59e0b" />
                <Text className="text-gray-200 text-xs font-bold ml-2.5">Bonus Daily Coins & Ad-Free Experience</Text>
              </View>
            </View>
          </View>

          {/* Bottom CTA Footer */}
          <View className="px-6 pb-6 pt-2">
            <TouchableOpacity
              onPress={() => {}}
              className="w-full bg-indigo-600 py-4 rounded-2xl flex-row items-center justify-center shadow-xl shadow-indigo-600/40 mb-3 active:bg-indigo-700"
            >
              <Text className="text-white font-black text-base mr-2">Get VIP Pass Now</Text>
              <ExternalLink size={18} color="#ffffff" />
            </TouchableOpacity>

            <Text className="text-gray-600 text-[10px] text-center font-medium">
              Google AdMob Interstitial Ad • 2 Min Session Limit
            </Text>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
