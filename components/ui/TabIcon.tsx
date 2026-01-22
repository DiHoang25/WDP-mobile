import { Text } from "react-native";

export function TabIcon({ emoji, color }: { emoji: string; color: string }) {
  return <Text style={{ fontSize: 24 }}>{emoji}</Text>;
}
