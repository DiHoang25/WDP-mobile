import { Button, Header } from "@/components/common";
import { AppColors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { profileService } from "@/services/profile.service";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ChangePasswordScreen() {
    const { logout } = useAuth();
    const [loading, setLoading] = useState(false);

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleChangePassword = async () => {
        // Validations
        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert("Lỗi", "Vui lòng nhập đầy đủ thông tin");
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert("Lỗi", "Mật khẩu mới không trùng khớp");
            return;
        }

        if (newPassword.length < 6) {
            Alert.alert("Lỗi", "Mật khẩu mới phải có ít nhất 6 ký tự");
            return;
        }

        if (currentPassword === newPassword) {
            Alert.alert("Lỗi", "Mật khẩu mới không được trùng với mật khẩu cũ");
            return;
        }

        setLoading(true);
        try {
            const response = await profileService.changePassword({
                currentPassword,
                newPassword,
            });

            if (response.error) {
                Alert.alert("Lỗi", response.error || "Đổi mật khẩu thất bại");
            } else {
                Alert.alert(
                    "Thành công",
                    "Đổi mật khẩu thành công. Vui lòng đăng nhập lại.",
                    [
                        {
                            text: "Đăng nhập lại",
                            onPress: async () => {
                                await logout();
                                router.replace("/login");
                            },
                        },
                    ]
                );
            }
        } catch (error) {
            console.error("Change password error:", error);
            Alert.alert("Lỗi", "Đã xảy ra lỗi khi đổi mật khẩu");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <Header
                title="Đổi mật khẩu"
                showBack={true}
                onBackPress={() => {
                    router.replace("/(citizen)/profile-edit");
                }}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Illustration/Icon */}
                    <View style={styles.iconContainer}>
                        <View style={styles.iconCircle}>
                            <Ionicons name="lock-closed" size={40} color={AppColors.primary} />
                        </View>
                        <Text style={styles.hintText}>
                            Mật khẩu mới phải khác mật khẩu trước đó và có ít nhất 6 ký tự.
                        </Text>
                    </View>

                    {/* Form Fields */}
                    <View style={styles.form}>
                        {/* Current Password */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Mật khẩu hiện tại</Text>
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={styles.passwordInput}
                                    value={currentPassword}
                                    onChangeText={setCurrentPassword}
                                    placeholder="Nhập mật khẩu hiện tại"
                                    secureTextEntry={!showCurrent}
                                    placeholderTextColor={AppColors.gray[400]}
                                />
                                <TouchableOpacity
                                    style={styles.eyeIcon}
                                    onPress={() => setShowCurrent(!showCurrent)}
                                >
                                    <Ionicons
                                        name={showCurrent ? "eye-off" : "eye"}
                                        size={20}
                                        color={AppColors.gray[500]}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* New Password */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Mật khẩu mới</Text>
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={styles.passwordInput}
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                    placeholder="Nhập mật khẩu mới"
                                    secureTextEntry={!showNew}
                                    placeholderTextColor={AppColors.gray[400]}
                                />
                                <TouchableOpacity
                                    style={styles.eyeIcon}
                                    onPress={() => setShowNew(!showNew)}
                                >
                                    <Ionicons
                                        name={showNew ? "eye-off" : "eye"}
                                        size={20}
                                        color={AppColors.gray[500]}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Confirm Password */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Nhập lại mật khẩu mới</Text>
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={styles.passwordInput}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    placeholder="Xác nhận mật khẩu mới"
                                    secureTextEntry={!showConfirm}
                                    placeholderTextColor={AppColors.gray[400]}
                                />
                                <TouchableOpacity
                                    style={styles.eyeIcon}
                                    onPress={() => setShowConfirm(!showConfirm)}
                                >
                                    <Ionicons
                                        name={showConfirm ? "eye-off" : "eye"}
                                        size={20}
                                        color={AppColors.gray[500]}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    <View style={styles.footer}>
                        <Button
                            title="Đổi mật khẩu"
                            onPress={handleChangePassword}
                            loading={loading}
                            disabled={loading}
                        />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: AppColors.background,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    iconContainer: {
        alignItems: "center",
        marginVertical: 30,
        paddingHorizontal: 20,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: AppColors.primary + "15",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 15,
    },
    hintText: {
        textAlign: "center",
        color: AppColors.textSecondary,
        fontSize: 14,
        lineHeight: 20,
    },
    form: {
        gap: 20,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        color: AppColors.textPrimary,
    },
    passwordContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: AppColors.white,
        borderWidth: 1,
        borderColor: AppColors.gray[300],
        borderRadius: 12,
    },
    passwordInput: {
        flex: 1,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 16,
        color: AppColors.textPrimary,
    },
    eyeIcon: {
        padding: 12,
    },
    footer: {
        marginTop: 40,
        marginBottom: 20,
    },
});
