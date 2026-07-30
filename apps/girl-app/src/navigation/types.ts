export type RootStackParamList = {
  Auth: undefined;
  App: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  PendingVerification: undefined;
  AccountRejected: undefined;
  AccountSuspended: undefined;
};

export type AppStackParamList = {
  Dashboard: undefined;
  EditProfile: undefined;
  ChatScreen: { id: string };
  Wallet: undefined;
  WalletHistory: undefined;
  WalletWithdraw: undefined;
};
