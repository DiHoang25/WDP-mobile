import { AppColors } from '@/constants/theme';
import { Notification } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { Animated, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface GlobalNotificationBannerProps {
    notification: Notification;
    onPress: () => void;
    onClose: () => void;
}

const GlobalNotificationBanner: React.FC<GlobalNotificationBannerProps> = ({
    notification,
    onPress,
    onClose
}) => {
    const insets = useSafeAreaInsets();
    const translateY = new Animated.Value(-200);

    useEffect(() => {
        // Slide down
        Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 40,
            friction: 7
        }).start();

        // Auto close after 5 seconds
        const timer = setTimeout(() => {
            handleClose();
        }, 5000);

        return () => clearTimeout(timer);
    }, []);

    const handleClose = () => {
        Animated.timing(translateY, {
            toValue: -200,
            duration: 300,
            useNativeDriver: true
        }).start(() => onClose());
    };

    const getSenderName = () => {
        return notification.meta?.enterprise?.name ||
            notification.meta?.enterpriseName ||
            notification.meta?.senderName ||
            "Greenpoint";
    };

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    transform: [{ translateY }],
                    top: Platform.OS === 'ios' ? insets.top : insets.top + 10
                }
            ]}
        >
            <TouchableOpacity
                style={styles.content}
                onPress={onPress}
                activeOpacity={0.9}
            >
                <View style={styles.iconCircle}>
                    <Ionicons name="notifications" size={24} color={AppColors.white} />
                </View>

                <View style={styles.textContainer}>
                    <View style={styles.headerRow}>
                        <Text style={styles.senderName}>{getSenderName()}</Text>
                        <Text style={styles.timeLabel}>Vừa xong</Text>
                    </View>
                    <Text style={styles.title} numberOfLines={1}>{notification.title}</Text>
                    <Text style={styles.message} numberOfLines={2}>{notification.content}</Text>
                </View>

                <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                    <Ionicons name="close" size={20} color={AppColors.gray[400]} />
                </TouchableOpacity>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 10,
        right: 10,
        zIndex: 9999,
        // Elevation for Android
        elevation: 8,
        // Shadow for iOS
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.30,
        shadowRadius: 4.65,
    },
    content: {
        backgroundColor: AppColors.white,
        borderRadius: 16,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: AppColors.gray[100],
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: AppColors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    textContainer: {
        flex: 1,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 2,
    },
    senderName: {
        fontSize: 12,
        fontWeight: '700',
        color: AppColors.primary,
        textTransform: 'uppercase',
    },
    timeLabel: {
        fontSize: 10,
        color: AppColors.gray[400],
    },
    title: {
        fontSize: 15,
        fontWeight: 'bold',
        color: AppColors.textPrimary,
        marginBottom: 2,
    },
    message: {
        fontSize: 13,
        color: AppColors.textSecondary,
        lineHeight: 18,
    },
    closeButton: {
        padding: 4,
        marginLeft: 8,
    }
});

export default GlobalNotificationBanner;
