import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Coins, CreditCard, ShieldCheck } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import { useQueryClient } from '@tanstack/react-query';

import apiClient from '../../src/api/apiClient';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { theme } from '../../src/constants/theme';

const PRESET_AMOUNTS = [100, 500, 1000, 5000, 10000];
const MIN_RECHARGE = 50;
const MAX_RECHARGE = 100000;

export default function RechargeScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState<string>('100');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const numAmount = parseInt(amount, 10) || 0;
  const coinsAmount = numAmount; // Assuming 1 INR = 1 Coin for display

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

      // 2. Open Razorpay Web Checkout (Mocked Flow since we don't have the SDK keys here)
      // In production, you would use react-native-razorpay SDK here
      // For this architecture demo, we mock the Razorpay successful checkout flow
      
      Alert.alert(
        'Razorpay Checkout',
        `Simulating payment of ₹${numAmount} for Order ${order.id}...`,
        [
          { text: 'Cancel Payment', style: 'cancel', onPress: () => setLoading(false) },
          { 
            text: 'Simulate Success', 
            onPress: async () => {
              try {
                // 3. Verify Payment
                await apiClient.post('/wallet/verify', {
                  razorpayOrderId: order.id,
                  razorpayPaymentId: `pay_mock_${Math.random().toString(36).substring(7)}`,
                  razorpaySignature: 'mock_signature'
                });

                // 4. Invalidate Queries
                queryClient.invalidateQueries({ queryKey: ['wallet-summary'] });
                queryClient.invalidateQueries({ queryKey: ['wallet-recent-transactions'] });
                queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] });

                Alert.alert(
                  'Payment Successful!',
                  `₹${numAmount} has been added to your wallet.`,
                  [{ text: 'Great', onPress: () => router.back() }]
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
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        
        {/* Header */}
        <View className="px-4 py-3 flex-row items-center border-b border-gray-100 dark:border-gray-800">
          <TouchableOpacity onPress={() => router.back()} className="p-2 mr-2">
            <ArrowLeft color={theme.colors.text.main.light} size={24} />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900 dark:text-white">Add Coins</Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
          
          <View className="items-center mb-8 mt-4">
            <View className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/30 rounded-full items-center justify-center mb-4 border-4 border-indigo-100 dark:border-indigo-900/50">
              <Coins color={theme.colors.primary} size={40} />
            </View>
            <Text className="text-gray-500 dark:text-gray-400 font-medium mb-2">You will get</Text>
            <Text className="text-5xl font-extrabold text-gray-900 dark:text-white">
              {coinsAmount > 0 ? coinsAmount.toLocaleString() : '0'}
            </Text>
            <Text className="text-indigo-500 font-bold text-lg mt-1">Coins</Text>
          </View>

          <Input
            label="Recharge Amount (₹)"
            placeholder="Enter amount"
            keyboardType="number-pad"
            value={amount}
            onChangeText={(text) => {
              // Only allow numbers
              if (/^\d*$/.test(text)) {
                setAmount(text);
              }
            }}
            error={error}
            leftIcon={<Text className="text-gray-500 font-bold text-lg mr-1">₹</Text>}
            className="text-2xl font-bold h-16"
          />

          <View className="flex-row flex-wrap justify-between mt-4 mb-8">
            {PRESET_AMOUNTS.map((preset) => (
              <TouchableOpacity
                key={preset}
                onPress={() => setAmount(preset.toString())}
                className={`w-[31%] py-3 mb-3 rounded-xl border items-center justify-center ${
                  numAmount === preset 
                    ? 'bg-indigo-50 border-indigo-500 dark:bg-indigo-900/30 dark:border-indigo-400' 
                    : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                }`}
              >
                <Text className={`font-bold ${numAmount === preset ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300'}`}>
                  ₹{preset}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 mb-8 flex-row items-center gap-3">
            <ShieldCheck color={theme.colors.success} size={24} />
            <View className="flex-1">
              <Text className="text-sm font-semibold text-gray-900 dark:text-white">100% Secure Payments</Text>
              <Text className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Powered by Razorpay</Text>
            </View>
          </View>

          <Button
            onPress={handleRecharge}
            isLoading={loading}
            disabled={!!error || numAmount === 0}
            className="w-full h-14"
            leftIcon={<CreditCard color="white" size={20} />}
          >
            Pay ₹{numAmount > 0 ? numAmount.toLocaleString() : '0'}
          </Button>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
