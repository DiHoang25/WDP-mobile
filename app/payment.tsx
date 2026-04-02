import { Button, Card, Header } from "@/components/common";
import { AppColors } from "@/constants/theme";
import { useAlert } from "@/contexts/AlertContext";
import { businessService } from "@/services/business.service";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
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
    const { showAlert } = useAlert();
    const referenceCodeParam = params.referenceCode as string || "PAY-UNKNOWN";
    const amountParam = parseFloat(params.amount as string || "0");
    const planNameParam = params.planName as string || "Gói đăng ký";

    // New parameters from BE
    const qrUrlParam = params.qrUrl as string || "";
    const bankNameParam = params.bankName as string || "";
    const accountNumberParam = params.accountNumber as string || "";
    const accountHolderParam = params.accountHolder as string || "";
    const transferContentParam = params.transferContent as string || referenceCodeParam;
    const planId = parseInt(params.planId as string || "0");

    const [paymentData, setPaymentData] = useState({
        referenceCode: referenceCodeParam,
        amount: amountParam,
        planName: planNameParam,
        qrUrl: qrUrlParam,
        bankName: bankNameParam,
        accountNumber: accountNumberParam,
        accountHolder: accountHolderParam,
        transferContent: transferContentParam,
    });

    const [status, setStatus] = useState<"PENDING" | "PAID" | "CANCELLED">("PENDING");
    const [loading, setLoading] = useState(false);
    const [checkingStatus, setCheckingStatus] = useState(false);

    // Use dynamic remaining time if provided, otherwise fallback to 30 mins
    const initialRemainingSeconds = params.remainingSeconds
        ? parseInt(params.remainingSeconds as string)
        : params.expiresAt
            ? Math.max(0, Math.floor((new Date(params.expiresAt as string).getTime() - new Date().getTime()) / 1000))
            : 1800;

    const [timeLeft, setTimeLeft] = useState(initialRemainingSeconds);
    const [isExpired, setIsExpired] = useState(initialRemainingSeconds <= 0);

    // Guard: If no valid reference code, don't render payment screen
    useEffect(() => {
        if (paymentData.referenceCode === "PAY-UNKNOWN") {
            console.log("[Payment] Invalid reference code, redirecting to login");
            router.replace("/login");
        }
    }, [paymentData.referenceCode]);

    useEffect(() => {
        let interval: any;

        if (status === "PENDING" && paymentData.referenceCode !== "PAY-UNKNOWN" && !isExpired) {
            checkPaymentStatus();
            interval = setInterval(checkPaymentStatus, 2000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [status, paymentData.referenceCode, isExpired]);

    // QR Expiration Timer
    useEffect(() => {
        if (status !== "PENDING" || isExpired) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setIsExpired(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [status, isExpired]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
    };

    const checkPaymentStatus = async () => {
        try {
            console.log(`[Payment] Checking status for ${paymentData.referenceCode}...`);
            const response = await businessService.getPayment(paymentData.referenceCode);
            console.log("[Payment] Response:", response);
            if (response.success && response.data) {
                const currentStatus = response.data.status?.toUpperCase();
                console.log(`[Payment] Status: ${currentStatus}`);

                if (currentStatus === "PAID") {
                    setStatus("PAID");
                } else if (currentStatus === "CANCELLED" || currentStatus === "FAILED" || currentStatus === "EXPIRED") {
                    setStatus("CANCELLED");
                    setIsExpired(true);
                }
            }
        } catch (error) {
            console.error("Error polling payment status:", error);
        }
    };

    const handleTestSuccess = async () => {
        setCheckingStatus(true);
        try {
            const response = await businessService.testPaymentSuccess(paymentData.referenceCode);
            if (response.success) {
                showAlert("Thông báo", "Đã gửi yêu cầu giả lập thanh toán thành công. Vui lòng đợi trong giây lát.");
                checkPaymentStatus();
            } else {
                showAlert("Lỗi", response.error || "Không thể thực hiện test");
            }
        } catch (error) {
            showAlert("Lỗi", "Đã có lỗi xảy ra");
        } finally {
            setCheckingStatus(false);
        }
    };

    const handleRenewPayment = async () => {
        if (!planId) {
            showAlert("Lỗi", "Không tìm thấy thông tin gói dịch vụ nhen!");
            return;
        }

        setLoading(true);
        try {
            const response = await businessService.renewSubscription(planId);
            if (response.success && response.data) {
                const newData = response.data;
                const payment = newData.pendingPayment || newData.payment || newData;
                const qrCode = payment.qrCode || {};
                const bankInfo = qrCode.bankInfo || {};

                setPaymentData({
                    referenceCode: payment.referenceCode || "",
                    amount: payment.amount || 0,
                    planName: payment.planName || paymentData.planName,
                    qrUrl: qrCode.qrUrl || "",
                    bankName: bankInfo.bankCode || bankInfo.bankName || "",
                    accountNumber: bankInfo.accountNumber || "",
                    accountHolder: bankInfo.accountHolder || "",
                    transferContent: bankInfo.transferContent || payment.referenceCode || "",
                });

                setTimeLeft(payment.remainingSeconds || 1800);
                setIsExpired(false);
                setStatus("PENDING");
            } else {
                showAlert("Lỗi", response.message || "Không thể tạo mã mới nhen!");
            }
        } catch (error) {
            console.error("[Payment] Renew error:", error);
            showAlert("Lỗi", "Đã có lỗi xảy ra nhenn!");
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string, label: string) => {
        Clipboard.setString(text);
        showAlert("Thông báo", `Đã sao chép ${label}`);
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
                        Cảm ơn bạn đã tin dùng ECoNet. Bạn đã trở thành doanh nghiệp, vui lòng truy cập vô web ECoNet để có thể bắt đầu nhận đơn.
                    </Text>

                    <Card variant="outlined" style={styles.successDetailCard}>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Gói đăng ký:</Text>
                            <Text style={styles.detailValue}>{paymentData.planName}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Số tiền:</Text>
                            <Text style={styles.detailValue}>{paymentData.amount.toLocaleString("vi-VN")} đ</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Mã tham chiếu:</Text>
                            <Text style={styles.detailValue}>{paymentData.referenceCode}</Text>
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
            <Header title="Thanh toán" subtitle="Hoàn tất đăng ký doanh nghiệp" showBack />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.statusBanner}>
                    <View style={styles.pulseContainer}>
                        <View style={styles.pulseDot} />
                    </View>
                    <Text style={styles.statusText}>
                        {isExpired ? "Giao dịch đã hết hạn" : "Đang chờ thanh toán..."}
                    </Text>
                </View>

                {isExpired ? (
                    <Card variant="elevated" style={styles.expiredFullCard}>
                        <View style={styles.expiredIconContainer}>
                            <Ionicons name="alert-circle" size={80} color={AppColors.error} />
                        </View>
                        <Text style={styles.expiredFullTitle}>Mã thanh toán đã hết hạn</Text>
                        <Text style={styles.expiredFullDesc}>
                            Thông tin thanh toán này không còn hiệu lực. Vui lòng tạo mã QR mới để thực hiện giao dịch nhen!
                        </Text>
                        <Button
                            title={loading ? "Đang tạo..." : "Tạo mã QR mới"}
                            onPress={handleRenewPayment}
                            loading={loading}
                            style={styles.renewLargeBtn}
                        />
                    </Card>
                ) : (
                    <>
                        {paymentData.qrUrl ? (
                            <Card variant="elevated" style={styles.qrCard}>
                                <View style={styles.timerHeader}>
                                    <Ionicons name="time-outline" size={18} color={AppColors.secondary} />
                                    <Text style={styles.timerText}>
                                        Hiệu lực còn: {formatTime(timeLeft)}
                                    </Text>
                                </View>
                                <Text style={styles.qrTitle}>Mã QR Thanh toán</Text>
                                <Text style={styles.qrSubtitle}>Quét mã bằng ứng dụng Ngân hàng để thanh toán nhanh</Text>
                                <View style={styles.qrContainer}>
                                    <Image
                                        source={{ uri: paymentData.qrUrl }}
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
                                    <Text style={styles.bankValue}>{paymentData.bankName || "MB Bank"}</Text>
                                    <TouchableOpacity onPress={() => copyToClipboard(paymentData.bankName || "MB Bank", "Tên ngân hàng")}>
                                        <Ionicons name="copy-outline" size={20} color={AppColors.primary} />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={styles.bankInfoItem}>
                                <Text style={styles.bankLabel}>Số tài khoản</Text>
                                <View style={styles.bankValueRow}>
                                    <Text style={[styles.bankValue, styles.bold]}>{paymentData.accountNumber || "1234567890"}</Text>
                                    <TouchableOpacity onPress={() => copyToClipboard(paymentData.accountNumber || "1234567890", "Số tài khoản")}>
                                        <Ionicons name="copy-outline" size={20} color={AppColors.primary} />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={styles.bankInfoItem}>
                                <Text style={styles.bankLabel}>Chủ tài khoản</Text>
                                <Text style={styles.bankValue}>{paymentData.accountHolder || "CÔNG TY ECO COLLECT"}</Text>
                            </View>

                            <View style={styles.bankInfoItem}>
                                <Text style={styles.bankLabel}>Số tiền</Text>
                                <View style={styles.bankValueRow}>
                                    <Text style={[styles.bankValue, styles.amountText]}>{paymentData.amount.toLocaleString("vi-VN")} đ</Text>
                                    <TouchableOpacity onPress={() => copyToClipboard(paymentData.amount.toString(), "Số tiền")}>
                                        <Ionicons name="copy-outline" size={20} color={AppColors.primary} />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={[styles.bankInfoItem, styles.lastItem]}>
                                <Text style={styles.bankLabel}>Nội dung chuyển khoản</Text>
                                <View style={styles.bankValueRow}>
                                    <Text style={[styles.bankValue, styles.referenceText]}>{paymentData.transferContent}</Text>
                                    <TouchableOpacity onPress={() => copyToClipboard(paymentData.transferContent, "Nội dung")}>
                                        <Ionicons name="copy-outline" size={20} color={AppColors.primary} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </Card>
                    </>
                )}
            </ScrollView>
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
    timerHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginBottom: 12,
        backgroundColor: AppColors.gray[100],
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
    },
    timerText: {
        fontSize: 13,
        fontWeight: "bold",
        color: AppColors.secondary,
    },
    expiredCard: {
        opacity: 0.8,
    },
    expiredOverlay: {
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
    },
    expiredText: {
        fontSize: 16,
        fontWeight: "bold",
        color: AppColors.error,
    },
    renewBtn: {
        backgroundColor: AppColors.primary,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 10,
    },
    renewBtnText: {
        color: AppColors.white,
        fontWeight: "bold",
    },
    testButtonSmall: {
        marginBottom: 12,
        padding: 10,
        backgroundColor: AppColors.gray[100],
        borderRadius: 8,
        alignItems: "center",
    },
    testButtonTextSmall: {
        fontSize: 12,
        color: AppColors.textSecondary,
    },
    // Expired Full Card Styles
    expiredFullCard: {
        padding: 30,
        borderRadius: 24,
        alignItems: "center",
        marginTop: 20,
    },
    expiredIconContainer: {
        marginBottom: 20,
    },
    expiredFullTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: AppColors.textPrimary,
        marginBottom: 12,
        textAlign: "center",
    },
    expiredFullDesc: {
        fontSize: 14,
        color: AppColors.textSecondary,
        textAlign: "center",
        lineHeight: 22,
        marginBottom: 30,
    },
    renewLargeBtn: {
        width: "100%",
    },
});
