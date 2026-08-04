import { createBrowserRouter, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { Login } from "../pages/auth/Login";
import { Dashboard } from "../pages/dashboard/Dashboard";
import { Users } from "../pages/users/Users";
import { Girls } from "../pages/girls/Girls";
import { VerificationList } from "../pages/verification/VerificationList";
import { VerificationDetail } from "../pages/verification/VerificationDetail";
import { Chats } from "../pages/chats/Chats";
import { Reports } from "../pages/reports/Reports";
import { Wallet } from "../pages/wallet/Wallet";
import { Withdrawals } from "../pages/withdrawals/Withdrawals";
import { Settings } from "../pages/settings/Settings";
import { Profile } from "../pages/profile/Profile";
import { Settlements } from "../pages/settlements/Settlements";
import { NotFound } from "../pages/errors/NotFound";
import { Unauthorized } from "../pages/errors/Unauthorized";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/",
    element: <ProtectedRoute />,
    children: [
      { path: "/", element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard", element: <Dashboard /> },
      { path: "users", element: <Users /> },
      { path: "girls", element: <Girls /> },
      { path: "verification", element: <VerificationList /> },
      { path: "verification/:girlId", element: <VerificationDetail /> },
      { path: "chats", element: <Chats /> },
      { path: "reports", element: <Reports /> },
      { path: "wallet", element: <Wallet /> },
      { path: "withdrawals", element: <Withdrawals /> },
      { path: "settlements", element: <Settlements /> },
      { path: "settings", element: <Settings /> },
      { path: "profile", element: <Profile /> },
    ],
  },
  {
    path: "/unauthorized",
    element: <Unauthorized />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);
