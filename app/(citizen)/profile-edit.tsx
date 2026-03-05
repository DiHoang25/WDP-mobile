import { Button, Header } from "@/components/common";
import { AppColors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { profileService } from "@/services/profile.service";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileEditScreen() {
    const { user, updateUser } = useAuth();
    const { t } = useLanguage();
    const [loading, setLoading] = useState(false);

    const [fullName, setFullName] = useState(user?.name || "");
    const [phone, setPhone] = useState(user?.phone || "");
    // Address update removed
    const [avatar, setAvatar] = useState<ImagePicker.ImagePickerAsset | null>(null);

    // Fetch full profile data on mount
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await profileService.getProfile();
                if (response.success && response.data) {
                    const data = response.data;
                    setFullName(data.name || (data as any).fullName || "");
                    setPhone(data.phone || "");
                    // setAddress(data.address || user?.address || "");

                    updateUser({ ...user, ...data } as any);
                }
            } catch (error) {
                console.error("Fetch profile details error:", error);
            }
        };

        fetchProfile();
    }, []);

    const handlePickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setAvatar(result.assets[0]);
            }
        } catch (error) {
            Alert.alert(t("common.error"), t("profileEdit.imageError"));
        }
    };

    const handleSave = async () => {
        console.log("handleSave START");
        if (!fullName.trim()) {
            Alert.alert(t("common.error"), t("profileEdit.nameRequired"));
            return;
        }
        if (!phone.trim()) {
            Alert.alert(t("common.error"), t("profileEdit.phoneRequired"));
            return;
        }

        setLoading(true);
        try {
            const response = await profileService.updateProfile({
                fullName,
                phone,
                avatar: avatar ? {
                    uri: avatar.uri,
                    name: avatar.fileName || 'avatar.jpg',
                    type: avatar.mimeType || 'image/jpeg',
                } : undefined,
            });

            if (response.error) {
                console.log("UPDATE ERROR:", response.error);
                Alert.alert(t("common.error"), response.error || t("profileEdit.saveError"));
            } else if (response.data) {
                await updateUser(response.data as any);

                Alert.alert(t("common.success"), t("profileEdit.saveSuccess"), [
                    {
                        text: "OK", onPress: () => {
                            router.replace("/(citizen)/profile-detail");
                        }
                    }
                ]);
            }
        } catch (error) {
            console.error("Update profile error:", error);
            Alert.alert(t("common.error"), t("profileEdit.updateError"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <Header
                title={t("profileEdit.title")}
                showBack={true}
                onBackPress={() => {
                    router.replace("/(citizen)/profile-detail");
                }}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    <View style={styles.avatarSection}>
                        <TouchableOpacity onPress={handlePickImage} activeOpacity={0.8}>
                            <View style={styles.avatarContainer}>
                                {avatar ? (
                                    <Image source={{ uri: avatar.uri }} style={styles.avatar} />
                                ) : user?.avatar ? (
                                    <Image source={{ uri: user.avatar }} style={styles.avatar} />
                                ) : (
                                    <View style={styles.avatarPlaceholder}>
                                        <Text style={styles.avatarText}>
                                            {fullName?.charAt(0) || "?"}
                                        </Text>
                                    </View>
                                )}
                                <View style={styles.cameraIcon}>
                                    <Ionicons name="camera" size={16} color={AppColors.white} />
                                </View>
                            </View>
                        </TouchableOpacity>
                        <Text style={styles.avatarHint}>{t("profileEdit.changeAvatar")}</Text>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>{t("profileDetail.name")}</Text>
                            <TextInput
                                style={styles.input}
                                value={fullName}
                                onChangeText={setFullName}
                                placeholder={t("profileEdit.namePlaceholder")}
                                placeholderTextColor={AppColors.gray[400]}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>{t("profileDetail.phone")}</Text>
                            <TextInput
                                style={styles.input}
                                value={phone}
                                onChangeText={setPhone}
                                placeholder={t("profileEdit.phonePlaceholder")}
                                keyboardType="phone-pad"
                                placeholderTextColor={AppColors.gray[400]}
                            />
                        </View>

                        {/* Address update removed as requested */}
                    </View>

                    <View style={styles.footer}>
                        <Button
                            title={t("profileEdit.save")}
                            onPress={handleSave}
                            loading={loading}
                            disabled={loading}
                        />

                        <TouchableOpacity
                            style={styles.changePasswordButton}
                            onPress={() => router.push("/(citizen)/change-password")}
                        >
                            <Ionicons name="key-outline" size={20} color={AppColors.primary} />
                            <Text style={styles.changePasswordText}>{t("profileDetail.changePassword")}</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={{ height: 40 }} />
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
    avatarSection: {
        alignItems: "center",
        marginTop: 20,
        marginBottom: 30,
    },
    avatarContainer: {
        position: "relative",
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        borderColor: AppColors.white,
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: AppColors.primary + "30",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 3,
        borderColor: AppColors.white,
    },
    avatarText: {
        fontSize: 40,
        fontWeight: "bold",
        color: AppColors.primary,
    },
    cameraIcon: {
        position: "absolute",
        bottom: 0,
        right: 0,
        backgroundColor: AppColors.primary,
        padding: 8,
        borderRadius: 15,
        borderWidth: 2,
        borderColor: AppColors.white,
    },
    avatarHint: {
        marginTop: 10,
        fontSize: 14,
        color: AppColors.textSecondary,
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
    input: {
        backgroundColor: AppColors.white,
        borderWidth: 1,
        borderColor: AppColors.gray[300],
        borderRadius: 12,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 16,
        color: AppColors.textPrimary,
    },
    footer: {
        marginTop: 30,
        marginBottom: 20,
        gap: 15,
    },
    changePasswordButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 12,
        gap: 8,
        borderWidth: 1,
        borderColor: AppColors.primary,
        borderRadius: 12,
        backgroundColor: AppColors.white,
    },
    changePasswordText: {
        fontSize: 16,
        fontWeight: "600",
        color: AppColors.primary,
    },
});
