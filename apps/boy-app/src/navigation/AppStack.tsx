import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppStackParamList } from './types';
import { MainTabNavigator } from './MainTabNavigator';
import HomeScreen from '../screens/app/home';
import SearchScreen from '../screens/app/search';
import ProfileScreen from '../screens/app/profile';
import ChatsScreen from '../screens/app/chats';
import SettingsScreen from '../screens/app/settings';
import WalletScreen from '../screens/app/wallet';
import FavoritesScreen from '../screens/app/favorites';
import NotificationsScreen from '../screens/app/notifications';
import TransactionsScreen from '../screens/app/transactions';
import RechargeScreen from '../screens/app/recharge';
import LegalScreen from '../screens/app/legal';
import HelpScreen from '../screens/app/help';
import ChatRequestsScreen from '../screens/app/chat-requests';
import EditProfileScreen from '../screens/app/edit-profile';
import ChatScreen from '../screens/app/ChatScreen';
import GirlDetailScreen from '../screens/app/GirlDetailScreen';

const Stack = createNativeStackNavigator<AppStackParamList>();

export function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabNavigator} />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Chats" component={ChatsScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Wallet" component={WalletScreen} />
      <Stack.Screen name="Favorites" component={FavoritesScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Transactions" component={TransactionsScreen} />
      <Stack.Screen name="Recharge" component={RechargeScreen} />
      <Stack.Screen name="Legal" component={LegalScreen} />
      <Stack.Screen name="Help" component={HelpScreen} />
      <Stack.Screen name="ChatRequests" component={ChatRequestsScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="ChatScreen" component={ChatScreen} />
      <Stack.Screen name="GirlDetailScreen" component={GirlDetailScreen} />
    </Stack.Navigator>
  );
}
