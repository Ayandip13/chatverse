import { RouterProvider } from "react-router-dom";
import { AppProvider } from "./providers/AppProvider";
import { router } from "./routes";
import { useAuthStore } from "./store/authStore";
import { useEffect } from "react";

function App() {
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Basic verification on app load to check if token exists
    // Future: Dispatch an action to verify token with API
  }, [isAuthenticated]);

  return (
    <AppProvider>
      <RouterProvider router={router} />
    </AppProvider>
  );
}

export default App;
