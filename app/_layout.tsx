import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { AlertProvider } from "@/contexts/AlertContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { useColorScheme } from "@/hooks/use-color-scheme";

import { NotificationProvider } from "@/contexts/NotificationContext";
import { SafeAreaProvider } from "react-native-safe-area-context";

export const unstable_settings = {
  // Ensure proper initial route
  initialRouteName: "index",
};

import { Provider } from "react-redux";
import { store } from "@/store";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <LanguageProvider>
          <AuthProvider>
            <NotificationProvider>
              <AlertProvider>
                <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
                  <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="index" options={{ headerShown: false }} />
                    <Stack.Screen name="login" options={{ headerShown: false }} />
                    <Stack.Screen name="register" options={{ headerShown: false }} />
                    <Stack.Screen name="(citizen)" options={{ headerShown: false }} />
                    <Stack.Screen name="(admin)" options={{ headerShown: false }} />
                    <Stack.Screen name="(collectors)" options={{ headerShown: false }} />
                    <Stack.Screen name="(enterprise)" options={{ headerShown: false }} />
                  </Stack>
                  <StatusBar style="auto" />
                </ThemeProvider>
              </AlertProvider>
            </NotificationProvider>
          </AuthProvider>
        </LanguageProvider>
      </SafeAreaProvider>
    </Provider>
  );
}
