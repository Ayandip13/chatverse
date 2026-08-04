import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, ArrowLeft, KeyRound } from "lucide-react-native";

import apiClient from "../../api/apiClient";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { theme } from "../../constants/theme";

const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setLoading(true);
      await apiClient.post("/auth/forgot-password", { email: data.email });
      setSubmitted(true);
    } catch (error: any) {
      console.log(
        "Forgot Password Error:",
        error.response?.data || error.message,
      );
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to send reset email",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-900">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24 }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 items-center justify-center mb-6"
          >
            <ArrowLeft color={theme.colors.text.main.light} size={20} />
          </TouchableOpacity>

          <View className="mb-8 items-center">
            <View className="w-20 h-20 bg-pink-500/10 rounded-3xl items-center justify-center mb-5 border border-pink-500/20">
              <KeyRound color={theme.colors.secondary} size={40} />
            </View>
            <Text className="text-3xl font-extrabold text-slate-900 dark:text-white text-center">
              Forgot Password
            </Text>
            <Text className="text-slate-500 dark:text-slate-400 mt-2 text-center text-base font-medium">
              Enter your email address and we'll send instructions to reset your
              password.
            </Text>
          </View>

          {submitted ? (
            <View className="bg-emerald-500/10 border border-emerald-500/30 p-6 rounded-2xl items-center mb-8">
              <Text className="text-emerald-600 dark:text-emerald-400 font-bold text-lg text-center mb-2">
                Reset Link Sent!
              </Text>
              <Text className="text-slate-600 dark:text-slate-300 text-center text-sm">
                If an account exists for that email, password recovery
                instructions have been sent.
              </Text>
              <Button
                variant="outline"
                onPress={() => navigation.navigate("Login")}
                className="mt-6 border-emerald-500 text-emerald-500 w-full"
              >
                Back to Sign In
              </Button>
            </View>
          ) : (
            <View className="space-y-4">
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Email Address"
                    placeholder="Enter your registered email"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={errors.email?.message}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    leftIcon={
                      <Mail color={theme.colors.text.muted.light} size={20} />
                    }
                  />
                )}
              />

              <Button
                variant="secondary"
                onPress={handleSubmit(onSubmit)}
                isLoading={loading}
                className="w-full mt-4"
              >
                Send Reset Link
              </Button>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
