import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AppStackParamList } from "./types";
import DashboardScreen from "../screens/app/dashboard";
import EditProfileScreen from "../screens/app/edit-profile";
import ChatScreen from "../screens/app/ChatScreen";
import WalletScreen from "../screens/app/wallet/index";
import WalletHistoryScreen from "../screens/app/wallet/history";
import WalletWithdrawScreen from "../screens/app/wallet/withdraw";

const Stack = createNativeStackNavigator<AppStackParamList>();

export function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="ChatScreen" component={ChatScreen} />
      <Stack.Screen name="Wallet" component={WalletScreen} />
      <Stack.Screen name="WalletHistory" component={WalletHistoryScreen} />
      <Stack.Screen name="WalletWithdraw" component={WalletWithdrawScreen} />
    </Stack.Navigator>
  );
}
