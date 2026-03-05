import { Button, Card, Header, Loading } from "@/components/common";
import { AppColors } from "@/constants/theme";
import { businessService } from "@/services/business.service";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Alert,
    Clipboard,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function PaymentScreen() {
    const params = useLocalSearchParams();
    const referenceCode = params.referenceCode as string || "PAY-UNKNOWN";
    const amount = parseFloat(params.amount as string || "0");
    const planName = params.planName as string || "Gói đăng ký";

    // New parameters from BE
    const qrUrl = params.qrUrl as string || "";
    const bankName = params.bankName as string || "";
    const accountNumber = params.accountNumber as string || "";
    const accountHolder = params.accountHolder as string || "";
    const transferContent = params.transferContent as string || referenceCode;

    const [status, setStatus] = useState<"PENDING" | "PAID" | "CANCELLED">("PENDING");
    const [loading, setLoading] = useState(false);
    const [checkingStatus, setCheckingStatus] = useState(false);

    useEffect(() => {
        let interval: any;

        if (status === "PENDING") {
            // Check immediately on mount/status change
            checkPaymentStatus();
            // Then poll every 2 seconds for faster response
            interval = setInterval(checkPaymentStatus, 2000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [status]);

    const checkPaymentStatus = async () => {
        try {
            console.log(`[Payment] Checking status for ${referenceCode}...`);
            const response = await businessService.getPayment(referenceCode);
            console.log("[Payment] Response:", response);
            if (response.success && response.data) {
                const currentStatus = response.data.status?.toUpperCase();
                console.log(`[Payment] Status: ${currentStatus}`);

                if (currentStatus === "PAID") {
                    setStatus("PAID");
                } else if (currentStatus === "CANCELLED") {
                    setStatus("CANCELLED");
                }
            }
        } catch (error) {
            console.error("Error polling payment status:", error);
        }
    };

    const handleTestSuccess = async () => {
        setCheckingStatus(true);
        try {
            const response = await businessService.testPaymentSuccess(referenceCode);
            if (response.success) {
                Alert.alert("Thông báo", "Đã gửi yêu cầu giả lập thanh toán thành công. Vui lòng đợi trong giây lát.");
                checkPaymentStatus();
            } else {
                Alert.alert("Lỗi", response.error || "Không thể thực hiện test");
            }
        } catch (error) {
            Alert.alert("Lỗi", "Đã có lỗi xảy ra");
        } finally {
            setCheckingStatus(false);
        }
    };

    const copyToClipboard = (text: string, label: string) => {
        Clipboard.setString(text);
        Alert.alert("Thông báo", `Đã sao chép ${label}`);
    };

    if (status === "PAID") {
        return (
            <View style={styles.container}>
                <Header title="Kết quả thanh toán" />
                <View style={styles.successContainer}>
                    <View style={styles.successIconBox}>
                        <Ionicons name="checkmark-circle" size={100} color={AppColors.primary} />
                    </View>
                    <Text style={styles.successTitle}>Đăng ký thành công!</Text>
                    <Text style={styles.successSubtitle}>
                        Cảm ơn bạn đã tin dùng ECONNET. Thanh toán đã được ghi nhận và yêu cầu đang chờ quản trị viên phê duyệt.
                    </Text>

                    <Card variant="outlined" style={styles.successDetailCard}>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Gói đăng ký:</Text>
                            <Text style={styles.detailValue}>{planName}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Số tiền:</Text>
                            <Text style={styles.detailValue}>{amount.toLocaleString("vi-VN")} đ</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Mã tham chiếu:</Text>
                            <Text style={styles.detailValue}>{referenceCode}</Text>
                        </View>
                    </Card>

                    <Button
                        title="Bắt đầu ngay"
                        onPress={() => router.replace("/login")}
                        style={styles.doneButton}
                    />
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Header title="Thanh toán Chuyển khoản" subtitle="Hoàn tất đăng ký doanh nghiệp" showBack />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.statusBanner}>
                    <View style={styles.pulseContainer}>
                        <View style={styles.pulseDot} />
                    </View>
                    <Text style={styles.statusText}>Đang chờ thanh toán...</Text>
                </View>

                {qrUrl ? (
                    <Card variant="elevated" style={styles.qrCard}>
                        <Text style={styles.qrTitle}>Mã QR Thanh toán</Text>
                        <Text style={styles.qrSubtitle}>Quét mã bằng ứng dụng Ngân hàng để thanh toán nhanh</Text>
                        <View style={styles.qrContainer}>
                            <Image
                                source={{ uri: qrUrl }}
                                style={styles.qrImage}
                                resizeMode="contain"
                            />
                        </View>
                    </Card>
                ) : null}

                <Card variant="elevated" style={styles.bankCard}>
                    <Text style={styles.bankTitle}>Thông tin tài khoản</Text>

                    <View style={styles.bankInfoItem}>
                        <Text style={styles.bankLabel}>Ngân hàng</Text>
                        <View style={styles.bankValueRow}>
                            <Text style={styles.bankValue}>{bankName || "MB Bank"}</Text>
                            <TouchableOpacity onPress={() => copyToClipboard(bankName || "MB Bank", "Tên ngân hàng")}>
                                <Ionicons name="copy-outline" size={20} color={AppColors.primary} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.bankInfoItem}>
                        <Text style={styles.bankLabel}>Số tài khoản</Text>
                        <View style={styles.bankValueRow}>
                            <Text style={[styles.bankValue, styles.bold]}>{accountNumber || "1234567890"}</Text>
                            <TouchableOpacity onPress={() => copyToClipboard(accountNumber || "1234567890", "Số tài khoản")}>
                                <Ionicons name="copy-outline" size={20} color={AppColors.primary} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.bankInfoItem}>
                        <Text style={styles.bankLabel}>Chủ tài khoản</Text>
                        <Text style={styles.bankValue}>{accountHolder || "CÔNG TY ECO COLLECT"}</Text>
                    </View>

                    <View style={styles.bankInfoItem}>
                        <Text style={styles.bankLabel}>Số tiền</Text>
                        <View style={styles.bankValueRow}>
                            <Text style={[styles.bankValue, styles.amountText]}>{amount.toLocaleString("vi-VN")} đ</Text>
                            <TouchableOpacity onPress={() => copyToClipboard(amount.toString(), "Số tiền")}>
                                <Ionicons name="copy-outline" size={20} color={AppColors.primary} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={[styles.bankInfoItem, styles.lastItem]}>
                        <Text style={styles.bankLabel}>Nội dung chuyển khoản</Text>
                        <View style={styles.bankValueRow}>
                            <Text style={[styles.bankValue, styles.referenceText]}>{transferContent}</Text>
                            <TouchableOpacity onPress={() => copyToClipboard(transferContent, "Nội dung")}>
                                <Ionicons name="copy-outline" size={20} color={AppColors.primary} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </Card>

                <View style={styles.alertBox}>
                    <Ionicons name="alert-circle" size={24} color={AppColors.warning} />
                    <Text style={styles.alertText}>
                        Lưu ý: Bạn phải nhập chính xác <Text style={styles.bold}>Nội dung chuyển khoản</Text> để hệ thống tự động kích hoạt gói ngay lập tức.
                    </Text>
                </View>

                <TouchableOpacity
                    style={styles.testButton}
                    onPress={handleTestSuccess}
                    disabled={checkingStatus}
                >
                    <Text style={styles.testButtonText}>
                        {checkingStatus ? "Đang xử lý..." : "Bấm vào đây để test Thanh toán thành công"}
                    </Text>
                </TouchableOpacity>
            </ScrollView>

            <View style={styles.footer}>
                <View style={styles.pollingInfo}>
                    {status === "PENDING" && <Loading size="small" />}
                    <Text style={styles.pollingText}>Hệ thống đang tự động kiểm tra trạng thái...</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: AppColors.background,
    },
    scrollContent: {
        padding: 20,
    },
    statusBanner: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: AppColors.primary + "10",
        padding: 12,
        borderRadius: 12,
        marginBottom: 20,
        justifyContent: "center",
    },
    pulseContainer: {
        marginRight: 10,
    },
    pulseDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: AppColors.primary,
    },
    statusText: {
        fontSize: 15,
        fontWeight: "600",
        color: AppColors.primary,
    },
    qrCard: {
        padding: 20,
        borderRadius: 24,
        alignItems: "center",
        marginBottom: 20,
    },
    qrTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: AppColors.textPrimary,
        marginBottom: 8,
    },
    qrSubtitle: {
        fontSize: 13,
        color: AppColors.textSecondary,
        textAlign: "center",
        marginBottom: 20,
    },
    qrContainer: {
        width: 240,
        height: 240,
        backgroundColor: AppColors.white,
        padding: 10,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: AppColors.gray[200],
        justifyContent: "center",
        alignItems: "center",
    },
    qrImage: {
        width: "100%",
        height: "100%",
    },
    bankCard: {
        padding: 20,
        borderRadius: 24,
    },
    bankTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: AppColors.textPrimary,
        marginBottom: 20,
        textAlign: "center",
    },
    bankInfoItem: {
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: AppColors.gray[100],
        paddingBottom: 12,
    },
    lastItem: {
        borderBottomWidth: 0,
        marginBottom: 0,
        paddingBottom: 0,
    },
    bankLabel: {
        fontSize: 13,
        color: AppColors.textSecondary,
        marginBottom: 4,
    },
    bankValueRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    bankValue: {
        fontSize: 16,
        color: AppColors.textPrimary,
        fontWeight: "500",
        flex: 1,
    },
    bold: {
        fontWeight: "bold",
    },
    amountText: {
        fontSize: 20,
        color: AppColors.primary,
        fontWeight: "800",
    },
    referenceText: {
        fontSize: 18,
        color: AppColors.secondary,
        fontWeight: "bold",
    },
    alertBox: {
        flexDirection: "row",
        backgroundColor: AppColors.warning + "10",
        padding: 16,
        borderRadius: 16,
        marginTop: 20,
        gap: 12,
        alignItems: "center",
        borderWidth: 1,
        borderColor: AppColors.warning + "30",
    },
    alertText: {
        flex: 1,
        fontSize: 14,
        color: AppColors.textPrimary,
        lineHeight: 20,
    },
    testButton: {
        marginTop: 30,
        padding: 16,
        backgroundColor: AppColors.gray[200],
        borderRadius: 12,
        alignItems: "center",
    },
    testButtonText: {
        color: AppColors.textSecondary,
        fontWeight: "600",
    },
    footer: {
        padding: 20,
        backgroundColor: AppColors.white,
        borderTopWidth: 1,
        borderTopColor: AppColors.gray[200],
    },
    pollingInfo: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
    },
    pollingText: {
        fontSize: 13,
        color: AppColors.textSecondary,
    },
    successContainer: {
        flex: 1,
        alignItems: "center",
        padding: 30,
        justifyContent: "center",
    },
    successIconBox: {
        marginBottom: 24,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: "bold",
        color: AppColors.textPrimary,
        textAlign: "center",
        marginBottom: 12,
    },
    successSubtitle: {
        fontSize: 15,
        color: AppColors.textSecondary,
        textAlign: "center",
        lineHeight: 22,
        marginBottom: 30,
    },
    successDetailCard: {
        width: "100%",
        padding: 20,
        marginBottom: 40,
    },
    detailRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 10,
    },
    detailLabel: {
        fontSize: 14,
        color: AppColors.textSecondary,
    },
    detailValue: {
        fontSize: 14,
        fontWeight: "600",
        color: AppColors.textPrimary,
    },
    doneButton: {
        width: "100%",
    },
});
