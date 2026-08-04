import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthStackParamList } from "./types";
import LoginScreen from "../screens/auth/login";
import RegisterScreen from "../screens/auth/register";
import ForgotPasswordScreen from "../screens/auth/forgot-password";
import PendingVerificationScreen from "../screens/auth/pending-verification";
import AccountRejectedScreen from "../screens/auth/account-rejected";
import AccountSuspendedScreen from "../screens/auth/account-suspended";

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen
        name="PendingVerification"
        component={PendingVerificationScreen}
      />
      <Stack.Screen name="AccountRejected" component={AccountRejectedScreen} />
      <Stack.Screen
        name="AccountSuspended"
        component={AccountSuspendedScreen}
      />
    </Stack.Navigator>
  );
}
