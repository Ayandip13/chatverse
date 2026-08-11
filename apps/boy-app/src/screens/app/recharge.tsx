import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Coins, CreditCard, ShieldCheck, Sparkles, CheckCircle2, Zap } from 'lucide-react-native';
import { useQueryClient } from '@tanstack/react-query';

import apiClient from '../../api/apiClient';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { theme } from '../../constants/theme';

interface CoinPackage {
  amount: number;
  bonus?: string;
  isPopular?: boolean;
}

const PRESET_PACKAGES: CoinPackage[] = [
  { amount: 50 },
  { amount: 100, isPopular: true },
  { amount: 200 },
  { amount: 500, bonus: '+50 Extra' },
  { amount: 1000, bonus: '+150 Extra', isPopular: true },
  { amount: 5000, bonus: '+1,000 Extra' },
];

const MIN_RECHARGE = 10;
const MAX_RECHARGE = 100000;

export default function RechargeScreen() {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState<string>('100');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const numAmount = parseInt(amount, 10) || 0;
  const coinsAmount = numAmount;

  const validateAmount = (val: number) => {
    if (val < MIN_RECHARGE) return `Minimum recharge is ₹${MIN_RECHARGE}`;
    if (val > MAX_RECHARGE) return `Maximum recharge is ₹${MAX_RECHARGE}`;
    return '';
  };

  useEffect(() => {
    if (amount !== '') {
      setError(validateAmount(numAmount));
    }
  }, [amount]);

  const handleRecharge = async () => {
    const validationError = validateAmount(numAmount);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);

      // 1. Create Razorpay Order via Backend
      const orderResponse = await apiClient.post('/wallet/recharge', {
        amountInr: numAmount
      });
      const order = orderResponse.data.data;
      const orderId = order.id || order.orderId;

      // 2. Open Razorpay Checkout (Simulated Flow)
      Alert.alert(
        'Razorpay Checkout',
        `Simulating instant payment of ₹${numAmount} for Order ${orderId}...`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => setLoading(false) },
          { 
            text: 'Simulate Success', 
            onPress: async () => {
              try {
                // 3. Verify Payment
                await apiClient.post('/wallet/verify', {
                  razorpayOrderId: orderId,
                  razorpayPaymentId: `pay_mock_${Math.random().toString(36).substring(7)}`,
                  razorpaySignature: 'mock_signature',
                  amountInr: numAmount,
                });

                // 4. Invalidate all wallet & profile queries
                queryClient.invalidateQueries({ queryKey: ['walletSummary'] });
                queryClient.invalidateQueries({ queryKey: ['wallet-summary'] });
                queryClient.invalidateQueries({ queryKey: ['wallet-recent-transactions'] });
                queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] });
                queryClient.invalidateQueries({ queryKey: ['myProfile'] });

                Alert.alert(
                  'Payment Successful! 🎉',
                  `₹${numAmount} (${numAmount} coins) has been added to your wallet.`,
                  [{ text: 'Great', onPress: () => navigation.goBack() }]
                );
              } catch (verifyError: any) {
                Alert.alert('Verification Failed', verifyError.response?.data?.message || 'Payment verification failed');
              } finally {
                setLoading(false);
              }
            }
          }
        ]
      );
    } catch (apiError: any) {
      Alert.alert('Error', apiError.response?.data?.message || 'Failed to initialize payment');
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        
        {/* Header */}
        <View className="px-6 py-4 flex-row items-center justify-between border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2 mr-2" activeOpacity={0.7}>
              <View className="items-center justify-center">
                <ArrowLeft color={theme.colors.text.main.light} size={22} />
              </View>
            </TouchableOpacity>
            <Text className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Add Coins</Text>
          </View>
          
          <View className="flex-row items-center bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1.5 rounded-full border border-indigo-100 dark:border-indigo-900/40">
            <View className="mr-1.5 items-center justify-center">
              <Zap size={13} color="#6366f1" fill="#6366f1" />
            </View>
            <Text className="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">Instant Credit</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 20, paddingBottom: 50 }} showsVerticalScrollIndicator={false}>
          
          {/* Compact Coin Preview Bar */}
          <View className="bg-indigo-600 dark:bg-indigo-800 rounded-2xl p-4 shadow-md shadow-indigo-500/20 relative overflow-hidden mb-5 border border-indigo-500/30 flex-row items-center justify-between">
            {/* Ambient Glow */}
            <View className="absolute -top-8 -right-8 w-24 h-24 bg-violet-400/20 rounded-full blur-xl" />

            <View className="flex-row items-center flex-1">
              <View className="w-11 h-11 bg-white/15 rounded-2xl items-center justify-center mr-3 border border-white/20">
                <View className="items-center justify-center">
                  <Coins color="#f59e0b" size={22} fill="#fbbf24" />
                </View>
              </View>
              
              <View>
                <Text className="text-indigo-200 text-[10px] font-black uppercase tracking-wider">
                  You Will Receive
                </Text>
                <View className="flex-row items-baseline">
                  <Text className="text-2xl font-black text-white tracking-tight mr-1">
                    {coinsAmount > 0 ? coinsAmount.toLocaleString() : '0'}
                  </Text>
                  <Text className="text-indigo-200 font-bold text-xs">Coins</Text>
                </View>
              </View>
            </View>

            <View className="bg-indigo-900/40 dark:bg-indigo-950/50 px-2.5 py-1 rounded-xl border border-indigo-400/20">
              <Text className="text-indigo-200 text-[10px] font-bold">1 Coin = 1 Min Talk</Text>
            </View>
          </View>

          {/* Preset Packages Grid */}
          <Text className="text-xs font-bold text-gray-400 dark:text-gray-400 uppercase tracking-wider mb-3 px-1">
            Select Coin Pack
          </Text>

          <View className="flex-row flex-wrap justify-between mb-6">
            {PRESET_PACKAGES.map((pkg) => {
              const isSelected = numAmount === pkg.amount;
              return (
                <TouchableOpacity
                  key={pkg.amount}
                  onPress={() => setAmount(pkg.amount.toString())}
                  className={`w-[48%] p-4 mb-3.5 rounded-3xl border relative overflow-hidden ${
                    isSelected 
                      ? 'bg-indigo-600 border-indigo-600 shadow-md shadow-indigo-500/30' 
                      : 'bg-white border-gray-200/80 dark:bg-gray-800 dark:border-gray-700/80'
                  }`}
                  activeOpacity={0.8}
                >
                  {/* Popular Badge */}
                  {pkg.isPopular && (
                    <View className={`absolute top-0 right-0 px-2.5 py-0.5 rounded-bl-xl ${
                      isSelected ? 'bg-amber-400' : 'bg-indigo-100 dark:bg-indigo-900/60'
                    }`}>
                      <Text className={`text-[9px] font-black ${
                        isSelected ? 'text-gray-900' : 'text-indigo-600 dark:text-indigo-400'
                      }`}>
                        POPULAR
                      </Text>
                    </View>
                  )}

                  <View className="flex-row items-center mb-1">
                    <View className="mr-1.5 items-center justify-center">
                      <Coins size={18} color={isSelected ? '#f59e0b' : '#d97706'} fill={isSelected ? '#fbbf24' : '#f59e0b'} />
                    </View>
                    <Text className={`text-xl font-black ${isSelected ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                      {pkg.amount.toLocaleString()}
                    </Text>
                  </View>

                  <Text className={`text-xs font-bold ${isSelected ? 'text-indigo-100' : 'text-gray-500 dark:text-gray-400'}`}>
                    ₹{pkg.amount.toLocaleString()}
                  </Text>

                  {pkg.bonus && (
                    <View className={`mt-2 px-2 py-0.5 rounded-lg self-start ${
                      isSelected ? 'bg-white/20' : 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/40'
                    }`}>
                      <Text className={`text-[10px] font-black ${
                        isSelected ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {pkg.bonus}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Custom Amount Input */}
          <Text className="text-xs font-bold text-gray-400 dark:text-gray-400 uppercase tracking-wider mb-2 px-1">
            Or Enter Custom Amount
          </Text>

          <View className="mb-6">
            <Input
              label=""
              placeholder="Enter custom amount in ₹"
              keyboardType="number-pad"
              value={amount}
              onChangeText={(text) => {
                if (/^\d*$/.test(text)) {
                  setAmount(text);
                }
              }}
              error={error}
              leftIcon={
                <View className="mr-2 items-center justify-center">
                  <Text className="text-gray-500 font-black text-xl">₹</Text>
                </View>
              }
              className="text-2xl font-black h-16 bg-white dark:bg-gray-800 border-gray-200/80 dark:border-gray-700/80 rounded-2xl"
            />
          </View>

          {/* Trust Banner */}
          <View className="bg-white dark:bg-gray-800 rounded-3xl p-4 mb-8 flex-row items-center border border-gray-100 dark:border-gray-700/80 shadow-xs">
            <View className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 items-center justify-center mr-3.5">
              <ShieldCheck color="#10b981" size={20} />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-extrabold text-gray-900 dark:text-white">100% Encrypted & Instant Payment</Text>
              <Text className="text-[11px] font-semibold text-gray-400 dark:text-gray-400 mt-0.5">UPI, Cards, NetBanking via Razorpay</Text>
            </View>
          </View>

          {/* Payment CTA Button */}
          <Button
            onPress={handleRecharge}
            isLoading={loading}
            disabled={!!error || numAmount === 0}
            className="w-full h-15 rounded-3xl bg-indigo-600 active:bg-indigo-700 shadow-lg shadow-indigo-500/30"
            leftIcon={
              <View className="mr-2 items-center justify-center">
                <CreditCard color="white" size={20} />
              </View>
            }
          >
            Pay ₹{numAmount > 0 ? numAmount.toLocaleString() : '0'} Now
          </Button>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
