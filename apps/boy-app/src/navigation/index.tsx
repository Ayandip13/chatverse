import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import { AuthNavigator } from './AuthStack';
import { AppNavigator } from './AppStack';
import { SplashScreen } from '../components/ui/SplashScreen'; // Or an ActivityIndicator

const Stack = createNativeStackNavigator();

export function RootNavigator() {
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);

  if (isLoading) {
    return <SplashScreen />;
  }

  return user ? <AppNavigator /> : <AuthNavigator />;
}