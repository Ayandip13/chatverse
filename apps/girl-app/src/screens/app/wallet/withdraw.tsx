import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Check, ArrowRight, ShieldCheck, Coins, CreditCard, Zap, Building2, AlertCircle, CheckCircle2 } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useWithdrawalSummary, useRequestWithdrawal } from '../../../hooks/useWithdrawals';

const PRESETS = [500, 1000, 2000, 5000];

export default function RequestWithdrawalScreen() {
  const navigation = useNavigation<any>();
  const { data: summary } = useWithdrawalSummary();
  const { mutate: submitRequest, isPending } = useRequestWithdrawal();

  const [amount, setAmount] = useState<string>('500');
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'BANK_TRANSFER'>('UPI');
  const [upiId, setUpiId] = useState<string>('');
  
  // Bank Details
  const [accountName, setAccountName] = useState<string>('');
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [ifscCode, setIfscCode] = useState<string>('');
  const [bankName, setBankName] = useState<string>('');

  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const availableBalance = summary?.availableBalance || 0;
  const parsedAmount = parseFloat(amount) || 0;
  const platformFee = 0;
  const netAmount = Math.max(0, parsedAmount - platformFee);

  const handleSubmit = () => {
    if (parsedAmount < 500) {
      Alert.alert('Validation Error', 'Minimum withdrawal amount is 500 Coins (₹500).');
      return;
    }

    if (parsedAmount > availableBalance) {
      Alert.alert('Insufficient Balance', `Your available balance is ${availableBalance.toLocaleString()} Coins.`);
      return;
    }

    if (paymentMethod === 'UPI') {
      if (!upiId.trim() || !upiId.includes('@')) {
        Alert.alert('Validation Error', 'Please enter a valid UPI ID (e.g. name@upi).');
        return;
      }
    } else {
      if (!accountName.trim() || !accountNumber.trim() || !ifscCode.trim()) {
        Alert.alert('Validation Error', 'Please complete all bank account details.');
        return;
      }
    }

    submitRequest(
      {
        amount: parsedAmount,
        paymentMethod,
        upiId: paymentMethod === 'UPI' ? upiId.trim() : undefined,
        bankDetails: paymentMethod === 'BANK_TRANSFER' ? {
          accountName: accountName.trim(),
          accountNumber: accountNumber.trim(),
          ifscCode: ifscCode.trim(),
          bankName: bankName.trim(),
        } : undefined,
      },
      {
        onSuccess: () => {
          setShowSuccessModal(true);
        },
        onError: (err: any) => {
          Alert.alert('Request Failed', err.response?.data?.message || err.message || 'Failed to submit request.');
        },
      }
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" edges={['top']}>
      {/* --- TOP HEADER --- */}
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center border border-slate-200 dark:border-slate-700"
            activeOpacity={0.8}
          >
            <ArrowLeft size={20} color="#64748b" />
          </TouchableOpacity>
          <View>
            <Text className="text-xs font-bold text-pink-600 dark:text-pink-400 uppercase tracking-wider">Payout Gateway</Text>
            <Text className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Request Payout</Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-5 py-5" showsVerticalScrollIndicator={false}>
        {/* --- AVAILABLE BALANCE CARD --- */}
        <View className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 mb-6 flex-row items-center justify-between shadow-sm">
          <View>
            <Text className="text-xs text-slate-400 font-extrabold uppercase tracking-wider">Available for Payout</Text>
            <View className="flex-row items-baseline gap-1.5 mt-0.5">
              <Text className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                {availableBalance.toLocaleString()}
              </Text>
              <Text className="text-pink-600 dark:text-pink-400 text-xs font-extrabold uppercase">Coins</Text>
            </View>
          </View>

          <View className="bg-pink-500/10 dark:bg-pink-500/20 px-3 py-1.5 rounded-full border border-pink-500/30 flex-row items-center gap-1">
            <Coins size={14} color="#f43f5e" />
            <Text className="text-xs font-black text-pink-600 dark:text-pink-300">Min 500 Coins</Text>
          </View>
        </View>

        {/* --- AMOUNT SECTION --- */}
        <View className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 mb-6 shadow-sm">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Enter Withdrawal Amount</Text>
            <TouchableOpacity onPress={() => setAmount(availableBalance.toString())} activeOpacity={0.8}>
              <Text className="text-xs font-extrabold text-pink-600 dark:text-pink-400">MAX</Text>
            </TouchableOpacity>
          </View>

          {/* Amount Input */}
          <View className="flex-row items-center bg-slate-50 dark:bg-slate-800 px-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 mb-4">
            <Text className="text-2xl font-black text-slate-400 mr-2 font-mono">₹</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#94a3b8"
              className="flex-1 text-2xl font-black text-slate-900 dark:text-white font-mono p-0"
            />
            <Text className="text-xs font-extrabold text-slate-400 uppercase">Coins</Text>
          </View>

          {/* Preset Quick Selection Pills */}
          <View className="flex-row gap-2">
            {PRESETS.map((preset) => {
              const isSelected = parsedAmount === preset;
              return (
                <TouchableOpacity
                  key={preset}
                  onPress={() => setAmount(preset.toString())}
                  className={`flex-1 py-2.5 rounded-xl border items-center ${
                    isSelected
                      ? 'bg-pink-600 border-pink-600'
                      : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                  }`}
                  activeOpacity={0.8}
                >
                  <Text className={`text-xs font-extrabold font-mono ${isSelected ? 'text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                    {preset.toLocaleString()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* --- PAYMENT METHOD SELECTOR --- */}
        <View className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 mb-6 shadow-sm">
          <Text className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-3">Select Payout Method</Text>

          <View className="flex-row gap-3 mb-4">
            {/* UPI Option */}
            <TouchableOpacity
              onPress={() => setPaymentMethod('UPI')}
              className={`flex-1 p-4 rounded-2xl border flex-row items-center gap-3 ${
                paymentMethod === 'UPI'
                  ? 'bg-pink-500/10 dark:bg-pink-500/20 border-pink-500'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
              }`}
              activeOpacity={0.8}
            >
              <View className={`w-9 h-9 rounded-xl items-center justify-center ${
                paymentMethod === 'UPI' ? 'bg-pink-600' : 'bg-slate-200 dark:bg-slate-700'
              }`}>
                <Zap size={18} color={paymentMethod === 'UPI' ? '#ffffff' : '#64748b'} />
              </View>
              <View>
                <Text className="text-xs font-black text-slate-900 dark:text-white">UPI Instant</Text>
                <Text className="text-[10px] text-slate-400 mt-0.5">Fast Payout</Text>
              </View>
            </TouchableOpacity>

            {/* Bank Transfer Option */}
            <TouchableOpacity
              onPress={() => setPaymentMethod('BANK_TRANSFER')}
              className={`flex-1 p-4 rounded-2xl border flex-row items-center gap-3 ${
                paymentMethod === 'BANK_TRANSFER'
                  ? 'bg-pink-500/10 dark:bg-pink-500/20 border-pink-500'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
              }`}
              activeOpacity={0.8}
            >
              <View className={`w-9 h-9 rounded-xl items-center justify-center ${
                paymentMethod === 'BANK_TRANSFER' ? 'bg-pink-600' : 'bg-slate-200 dark:bg-slate-700'
              }`}>
                <CreditCard size={18} color={paymentMethod === 'BANK_TRANSFER' ? '#ffffff' : '#64748b'} />
              </View>
              <View>
                <Text className="text-xs font-black text-slate-900 dark:text-white">Bank Account</Text>
                <Text className="text-[10px] text-slate-400 mt-0.5">Direct NEFT/IMPS</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Dynamic Form Inputs */}
          {paymentMethod === 'UPI' ? (
            <View>
              <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">UPI VPA ID</Text>
              <TextInput
                value={upiId}
                onChangeText={setUpiId}
                placeholder="username@upi or mobile@paytm"
                placeholderTextColor="#94a3b8"
                autoCapitalize="none"
                className="bg-slate-50 dark:bg-slate-800 px-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white"
              />
            </View>
          ) : (
            <View className="gap-3">
              <View>
                <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Account Holder Name</Text>
                <TextInput
                  value={accountName}
                  onChangeText={setAccountName}
                  placeholder="Full Name as on Bank Account"
                  placeholderTextColor="#94a3b8"
                  className="bg-slate-50 dark:bg-slate-800 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white"
                />
              </View>

              <View>
                <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Account Number</Text>
                <TextInput
                  value={accountNumber}
                  onChangeText={setAccountNumber}
                  keyboardType="numeric"
                  placeholder="e.g. 918237465012"
                  placeholderTextColor="#94a3b8"
                  className="bg-slate-50 dark:bg-slate-800 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white font-mono"
                />
              </View>

              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">IFSC Code</Text>
                  <TextInput
                    value={ifscCode}
                    onChangeText={(val) => setIfscCode(val.toUpperCase())}
                    placeholder="e.g. SBIN0001234"
                    placeholderTextColor="#94a3b8"
                    autoCapitalize="characters"
                    className="bg-slate-50 dark:bg-slate-800 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white font-mono"
                  />
                </View>

                <View className="flex-1">
                  <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Bank Name (Optional)</Text>
                  <TextInput
                    value={bankName}
                    onChangeText={setBankName}
                    placeholder="e.g. State Bank of India"
                    placeholderTextColor="#94a3b8"
                    className="bg-slate-50 dark:bg-slate-800 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white"
                  />
                </View>
              </View>
            </View>
          )}
        </View>

        {/* --- PAYOUT BREAKDOWN SUMMARY --- */}
        <View className="bg-slate-100 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 mb-6 gap-2">
          <View className="flex-row justify-between">
            <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400">Withdrawal Amount</Text>
            <Text className="text-xs font-bold text-slate-900 dark:text-white font-mono">₹{parsedAmount.toLocaleString()}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400">Processing Fee</Text>
            <Text className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">FREE (₹0)</Text>
          </View>
          <View className="h-px bg-slate-200 dark:bg-slate-800 my-1" />
          <View className="flex-row justify-between">
            <Text className="text-xs font-extrabold text-slate-900 dark:text-white">Net Payout to Bank/UPI</Text>
            <Text className="text-sm font-black text-rose-600 dark:text-pink-400 font-mono">₹{netAmount.toLocaleString()}</Text>
          </View>
        </View>

        {/* --- SUBMIT BUTTON --- */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isPending}
          className="bg-pink-600 py-4 rounded-2xl flex-row items-center justify-center shadow-lg shadow-pink-600/40 mb-4"
          activeOpacity={0.9}
        >
          {isPending ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <ShieldCheck size={20} color="#ffffff" className="mr-2" />
              <Text className="text-white font-black text-base tracking-wide">Submit Payout Request</Text>
            </>
          )}
        </TouchableOpacity>

        <View className="flex-row items-center justify-center gap-1.5 pb-8">
          <ShieldCheck size={14} color="#10b981" />
          <Text className="text-[11px] text-slate-400 font-semibold">100% Encrypted & Verified Financial Transfer</Text>
        </View>

      </ScrollView>

      {/* --- SUCCESS CONFIRMATION MODAL --- */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View className="flex-1 bg-black/70 items-center justify-center p-6">
          <View className="bg-white dark:bg-slate-900 w-full p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl items-center text-center">
            <View className="w-16 h-16 rounded-full bg-emerald-500/10 items-center justify-center border-2 border-emerald-500 mb-4">
              <CheckCircle2 size={36} color="#10b981" />
            </View>

            <Text className="text-xl font-black text-slate-900 dark:text-white">Payout Requested!</Text>
            <Text className="text-xs text-slate-500 dark:text-slate-400 text-center mt-1.5 leading-relaxed">
              Your request for <Text className="font-extrabold text-slate-900 dark:text-white">₹{parsedAmount.toLocaleString()}</Text> has been submitted successfully and will be processed shortly.
            </Text>

            <TouchableOpacity
              onPress={() => {
                setShowSuccessModal(false);
                navigation.replace('Wallet');
              }}
              className="bg-pink-600 w-full py-3.5 rounded-2xl items-center mt-6 shadow-md"
              activeOpacity={0.9}
            >
              <Text className="text-white font-black text-sm">Done & Back to Wallet</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
