import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text } from "react-native";

export type ToastType = "success" | "error" | "info";

interface ToastProps {
    visible: boolean;
    message: string;
    type?: ToastType;
    duration?: number;
    onHide: () => void;
    onPress?: () => void;
}

export default function Toast({
    visible,
    message,
    type = "success",
    duration = 2500,
    onHide,
    onPress,
}: ToastProps) {
    const translateY = useRef(new Animated.Value(-100)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(translateY, {
                    toValue: 0,
                    useNativeDriver: true,
                    tension: 80,
                    friction: 10,
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();

            const timer = setTimeout(() => {
                Animated.parallel([
                    Animated.timing(translateY, {
                        toValue: -100,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                    Animated.timing(opacity, {
                        toValue: 0,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                ]).start(() => onHide());
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [visible]);

    if (!visible) return null;

    const config = {
        success: { bg: "#D1FAE5", border: "#10B981", icon: "checkmark-circle" as const, iconColor: "#059669" },
        error: { bg: "#FEE2E2", border: "#EF4444", icon: "close-circle" as const, iconColor: "#DC2626" },
        info: { bg: "#DBEAFE", border: "#3B82F6", icon: "information-circle" as const, iconColor: "#2563EB" },
    }[type];

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    backgroundColor: config.bg,
                    borderLeftColor: config.border,
                    transform: [{ translateY }],
                    opacity,
                },
            ]}
        >
            <Ionicons name={config.icon} size={22} color={config.iconColor} />
            <Text
                style={[styles.text, { color: config.iconColor }]}
                onPress={onPress}
            >
                {message}
            </Text>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        top: 50,
        right: 16,
        left: 16,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 12,
        borderLeftWidth: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
        zIndex: 9999,
    },
    text: {
        fontSize: 14,
        fontWeight: "600",
        marginLeft: 10,
        flex: 1,
    },
});
