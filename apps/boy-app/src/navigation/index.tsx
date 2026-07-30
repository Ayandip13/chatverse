import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import { AuthNavigator } from './AuthStack';
import { AppNavigator } from './AppStack';
import { SplashScreen } from '../components/ui/SplashScreen'; // Or an ActivityIndicator

const Stack = createNativeStackNavigator();

export function RootNavigator() {
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading); // 👈 Add your loading state

  // Block screen rendering until auth state is restored
  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <Stack.Screen name="App" component={AppNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
}