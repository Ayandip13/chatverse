import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import { AuthNavigator } from './AuthStack';
import { AppNavigator } from './AppStack';

import PendingVerificationScreen from '../screens/auth/pending-verification';
import AccountRejectedScreen from '../screens/auth/account-rejected';
import AccountSuspendedScreen from '../screens/auth/account-suspended';

const Stack = createNativeStackNavigator();

export function RootNavigator() {
  const user = useAuthStore((state) => state.user);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : user.status === 'PENDING' ? (
        <Stack.Screen name="PendingVerification" component={PendingVerificationScreen} />
      ) : user.status === 'REJECTED' ? (
        <Stack.Screen name="AccountRejected" component={AccountRejectedScreen} />
      ) : user.status === 'SUSPENDED' || user.status === 'BANNED' ? (
        <Stack.Screen name="AccountSuspended" component={AccountSuspendedScreen} />
      ) : (
        <Stack.Screen name="App" component={AppNavigator} />
      )}
    </Stack.Navigator>
  );
}
