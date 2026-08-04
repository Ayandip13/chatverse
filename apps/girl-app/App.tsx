import { View } from "react-native";
import { QueryProvider } from "./src/providers/QueryProvider";
import { SocketProvider } from "./src/providers/SocketProvider";
import { useEffect } from "react";
import { useAuthStore } from "./src/store/authStore";
import { SplashScreen } from "./src/components/ui/SplashScreen";
import { StatusBar } from "expo-status-bar";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { NavigationContainer } from "@react-navigation/native";

import "./global.css"; // NativeWind v4 requires this

export default function App() {
  const hydrateAuth = useAuthStore((state) => state.hydrateAuth);
  const isLoading = useAuthStore((state) => state.isLoading);

  useEffect(() => {
    hydrateAuth();
  }, []);

  return (
    <QueryProvider>
      <SocketProvider>
        <StatusBar style="auto" />
        <NavigationContainer>
          <View style={{ flex: 1 }}>
            <RootNavigator />
            {isLoading && (
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  left: 0,
                  right: 0,
                  zIndex: 999,
                }}
              >
                <SplashScreen />
              </View>
            )}
          </View>
        </NavigationContainer>
      </SocketProvider>
    </QueryProvider>
  );
}

import { registerRootComponent } from "expo";
registerRootComponent(App);
