import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Check,
  ArrowRight,
  ShieldCheck,
  Coins,
  CreditCard,
} from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import {
  useWithdrawalSummary,
  useRequestWithdrawal,
} from "../../../hooks/useWithdrawals";

const PRESETS = [500, 1000, 2000, 5000];

export default function RequestWithdrawalScreen() {
  const navigation = useNavigation<any>();
  const { data: summary } = useWithdrawalSummary();
  const { mutate: submitRequest, isPending } = useRequestWithdrawal();

  const [amount, setAmount] = useState<string>("500");
  const [paymentMethod, setPaymentMethod] = useState<"UPI" | "BANK_TRANSFER">(
    "UPI",
  );
  const [upiId, setUpiId] = useState<string>("");

  // Bank Details
  const [accountName, setAccountName] = useState<string>("");
  const [accountNumber, setAccountNumber] = useState<string>("");
  const [ifscCode, setIfscCode] = useState<string>("");
  const [bankName, setBankName] = useState<string>("");

  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const availableBalance = summary?.availableBalance || 0;
  const parsedAmount = parseFloat(amount) || 0;
  const platformFee = 0;
  const netAmount = Math.max(0, parsedAmount - platformFee);

  const handleSubmit = () => {
    if (parsedAmount < 500) {
      Alert.alert("Validation Error", "Minimum withdrawal amount is ₹500.");
      return;
    }

    if (parsedAmount > availableBalance) {
      Alert.alert(
        "Insufficient Balance",
        `Your available balance is ₹${availableBalance.toLocaleString()}.`,
      );
      return;
    }

    if (paymentMethod === "UPI") {
      if (!upiId.trim() || !upiId.includes("@")) {
        Alert.alert(
          "Validation Error",
          "Please enter a valid UPI ID (e.g. name@upi).",
        );
        return;
      }
    } else {
      if (!accountName.trim() || !accountNumber.trim() || !ifscCode.trim()) {
        Alert.alert(
          "Validation Error",
          "Please complete all bank account details.",
        );
        return;
      }
    }

    submitRequest(
      {
        amount: parsedAmount,
        paymentMethod,
        upiId: paymentMethod === "UPI" ? upiId.trim() : undefined,
        bankDetails:
          paymentMethod === "BANK_TRANSFER"
            ? {
                accountName: accountName.trim(),
                accountNumber: accountNumber.trim(),
                ifscCode: ifscCode.trim(),
                bankName: bankName.trim(),
              }
            : undefined,
      },
      {
        onSuccess: () => {
          setShowSuccessModal(true);
        },
        onError: (err: any) => {
          Alert.alert(
            "Request Failed",
            err.response?.data?.message ||
              err.message ||
              "Failed to submit request.",
          );
        },
      },
    );
  };

  return (
    <SafeAreaView
      className="flex-1 bg-slate-50 dark:bg-slate-900"
      edges={["top"]}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="mr-4"
          >
            <ArrowLeft size={24} color="#64748b" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-slate-900 dark:text-white">
            Request Payout
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-6 py-6"
        showsVerticalScrollIndicator={false}
      >
        {/* Available Balance Header */}
        <View className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 mb-6 flex-row items-center justify-between">
          <View>
            <Text className="text-xs text-slate-400 font-semibold">
              Available for Payout
            </Text>
            <Text className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono mt-0.5">
              ₹{availableBalance.toLocaleString()}
            </Text>
          </View>
          <View className="bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
            <Text className="text-xs font-bold text-rose-600 dark:text-rose-400">
              Min ₹500
            </Text>
          </View>
        </View>

        {/* Amount Input */}
        <View className="mb-6">
          <Text className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
            Withdrawal Amount (₹)
          </Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="Enter amount"
            placeholderTextColor="#94a3b8"
            className="w-full bg-white dark:bg-slate-800 rounded-2xl px-4 h-14 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 font-mono text-lg font-bold"
          />

          {/* Quick Presets */}
          <View className="flex-row gap-2 mt-3">
            {PRESETS.map((preset) => (
              <TouchableOpacity
                key={preset}
                onPress={() => setAmount(preset.toString())}
                className={`flex-1 py-2 rounded-xl items-center border ${
                  parsedAmount === preset
                    ? "bg-pink-600 border-pink-600"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                }`}
              >
                <Text
                  className={`text-xs font-bold ${parsedAmount === preset ? "text-white" : "text-slate-700 dark:text-slate-300"}`}
                >
                  ₹{preset}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Payment Method Selector */}
        <View className="mb-6">
          <Text className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
            Payment Method
          </Text>
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => setPaymentMethod("UPI")}
              className={`flex-1 p-4 rounded-2xl border flex-row items-center justify-center gap-2 ${
                paymentMethod === "UPI"
                  ? "bg-rose-50 dark:bg-rose-900/30 border-rose-500"
                  : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              }`}
            >
              <Coins
                size={18}
                color={paymentMethod === "UPI" ? "#e11d48" : "#64748b"}
              />
              <Text
                className={`text-sm font-bold ${paymentMethod === "UPI" ? "text-rose-600 dark:text-rose-400" : "text-slate-700 dark:text-slate-300"}`}
              >
                UPI Instant
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setPaymentMethod("BANK_TRANSFER")}
              className={`flex-1 p-4 rounded-2xl border flex-row items-center justify-center gap-2 ${
                paymentMethod === "BANK_TRANSFER"
                  ? "bg-rose-50 dark:bg-rose-900/30 border-rose-500"
                  : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              }`}
            >
              <CreditCard
                size={18}
                color={
                  paymentMethod === "BANK_TRANSFER" ? "#e11d48" : "#64748b"
                }
              />
              <Text
                className={`text-sm font-bold ${paymentMethod === "BANK_TRANSFER" ? "text-rose-600 dark:text-rose-400" : "text-slate-700 dark:text-slate-300"}`}
              >
                Bank Transfer
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Dynamic Payment Details Input */}
        {paymentMethod === "UPI" ? (
          <View className="mb-6">
            <Text className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              VPA / UPI ID
            </Text>
            <TextInput
              value={upiId}
              onChangeText={setUpiId}
              placeholder="e.g. mobile@upi or name@okaxis"
              placeholderTextColor="#94a3b8"
              autoCapitalize="none"
              className="w-full bg-white dark:bg-slate-800 rounded-2xl px-4 h-14 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 text-sm"
            />
          </View>
        ) : (
          <View className="space-y-4 mb-6">
            <View>
              <Text className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                Account Holder Name
              </Text>
              <TextInput
                value={accountName}
                onChangeText={setAccountName}
                placeholder="Full name on bank account"
                placeholderTextColor="#94a3b8"
                className="w-full bg-white dark:bg-slate-800 rounded-2xl px-4 h-14 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 text-sm"
              />
            </View>

            <View className="mt-3">
              <Text className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                Account Number
              </Text>
              <TextInput
                value={accountNumber}
                onChangeText={setAccountNumber}
                keyboardType="numeric"
                placeholder="Enter bank account number"
                placeholderTextColor="#94a3b8"
                className="w-full bg-white dark:bg-slate-800 rounded-2xl px-4 h-14 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 text-sm font-mono"
              />
            </View>

            <View className="mt-3">
              <Text className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                IFSC Code
              </Text>
              <TextInput
                value={ifscCode}
                onChangeText={(t) => setIfscCode(t.toUpperCase())}
                autoCapitalize="characters"
                placeholder="e.g. SBIN0001234"
                placeholderTextColor="#94a3b8"
                className="w-full bg-white dark:bg-slate-800 rounded-2xl px-4 h-14 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 text-sm font-mono"
              />
            </View>

            <View className="mt-3">
              <Text className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                Bank Name (Optional)
              </Text>
              <TextInput
                value={bankName}
                onChangeText={setBankName}
                placeholder="e.g. State Bank of India"
                placeholderTextColor="#94a3b8"
                className="w-full bg-white dark:bg-slate-800 rounded-2xl px-4 h-14 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 text-sm"
              />
            </View>
          </View>
        )}

        {/* Summary Card */}
        <View className="bg-slate-100 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 mb-8 space-y-2">
          <View className="flex-row justify-between">
            <Text className="text-xs text-slate-500">Gross Amount</Text>
            <Text className="text-xs font-bold text-slate-900 dark:text-white font-mono">
              ₹{parsedAmount}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-xs text-slate-500">Processing Fee</Text>
            <Text className="text-xs font-bold text-emerald-600 font-mono">
              ₹0 (Free)
            </Text>
          </View>
          <View className="w-full h-[1px] bg-slate-200 dark:bg-slate-700 my-1" />
          <View className="flex-row justify-between">
            <Text className="text-sm font-bold text-slate-900 dark:text-white">
              Net Payout
            </Text>
            <Text className="text-base font-extrabold text-rose-600 dark:text-rose-400 font-mono">
              ₹{netAmount}
            </Text>
          </View>
        </View>

        {/* Submit Action Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isPending}
          className="bg-pink-600 py-4 rounded-2xl flex-row items-center justify-center gap-2 shadow-lg shadow-pink-500/30 mb-8"
        >
          {isPending ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <ShieldCheck size={20} color="#ffffff" />
              <Text className="text-white font-bold text-base">
                Submit Withdrawal Request
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Success Modal */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View className="flex-1 bg-black/60 items-center justify-center px-6">
          <View className="bg-white dark:bg-slate-800 w-full p-6 rounded-3xl items-center shadow-2xl border border-slate-200 dark:border-slate-700">
            <View className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/40 rounded-full items-center justify-center mb-4">
              <Check size={36} color="#10b981" />
            </View>

            <Text className="text-xl font-extrabold text-slate-900 dark:text-white text-center mb-1">
              Request Submitted!
            </Text>
            <Text className="text-xs text-slate-500 dark:text-slate-400 text-center mb-6 px-4">
              Your request for ₹{netAmount} is queued for admin approval. Funds
              are held safely in escrow.
            </Text>

            <TouchableOpacity
              onPress={() => {
                setShowSuccessModal(false);
                navigation.replace("WalletHistory");
              }}
              className="w-full bg-pink-600 py-3.5 rounded-2xl items-center shadow-md"
            >
              <Text className="text-white font-bold text-base">
                View History
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
