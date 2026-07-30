export type RootStackParamList = {
  Auth: undefined;
  App: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token?: string } | undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  ChatsTab: undefined;
  ProfileTab: undefined;
};

export type AppStackParamList = {
  MainTabs: undefined;
  Home: undefined;
  Search: undefined;
  Profile: undefined;
  Chats: undefined;
  Settings: undefined;
  Wallet: undefined;
  Favorites: undefined;
  Notifications: undefined;
  Transactions: undefined;
  Recharge: undefined;
  Legal: { type: string };
  Help: undefined;
  ChatRequests: undefined;
  EditProfile: undefined;
  ChatScreen: { id: string };
  GirlDetailScreen: { id: string };
};
