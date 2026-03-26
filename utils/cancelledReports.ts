import AsyncStorage from "@react-native-async-storage/async-storage";

const CANCELLED_REPORTS_KEY = "cancelled_report_ids";
const KNOWN_REPORTS_KEY = "known_report_ids";

// ─── Cancelled Reports (đơn bị hủy) ───────────────────────────────────────────

/**
 * Lưu một report ID vào danh sách đơn đã hủy (AsyncStorage)
 */
export async function saveCancelledReportId(reportId: number): Promise<void> {
    try {
        const raw = await AsyncStorage.getItem(CANCELLED_REPORTS_KEY);
        const ids: number[] = raw ? JSON.parse(raw) : [];
        if (!ids.includes(reportId)) {
            ids.push(reportId);
            await AsyncStorage.setItem(CANCELLED_REPORTS_KEY, JSON.stringify(ids));
        }
    } catch (e) {
        console.error("saveCancelledReportId error:", e);
    }
}

/**
 * Lấy toàn bộ danh sách report ID đã hủy
 */
export async function getCancelledReportIds(): Promise<number[]> {
    try {
        const raw = await AsyncStorage.getItem(CANCELLED_REPORTS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        console.error("getCancelledReportIds error:", e);
        return [];
    }
}

/**
 * Xóa một ID khỏi danh sách (dùng khi đồng bộ được từ API rồi)
 */
export async function removeCancelledReportId(reportId: number): Promise<void> {
    try {
        const raw = await AsyncStorage.getItem(CANCELLED_REPORTS_KEY);
        const ids: number[] = raw ? JSON.parse(raw) : [];
        const updated = ids.filter((id) => id !== reportId);
        await AsyncStorage.setItem(CANCELLED_REPORTS_KEY, JSON.stringify(updated));
    } catch (e) {
        console.error("removeCancelledReportId error:", e);
    }
}

// ─── Known Reports (mọi đơn đã tạo — PENDING, ACCEPTED, ...) ──────────────────

/**
 * Lưu ID đơn vừa tạo để history có thể fetch detail khi API list không trả về
 */
export async function saveKnownReportId(reportId: number): Promise<void> {
    try {
        const raw = await AsyncStorage.getItem(KNOWN_REPORTS_KEY);
        const ids: number[] = raw ? JSON.parse(raw) : [];
        if (!ids.includes(reportId)) {
            ids.push(reportId);
            await AsyncStorage.setItem(KNOWN_REPORTS_KEY, JSON.stringify(ids));
        }
    } catch (e) {
        console.error("saveKnownReportId error:", e);
    }
}

/**
 * Lấy tất cả ID đơn đã biết (để history fetch detail)
 */
export async function getKnownReportIds(): Promise<number[]> {
    try {
        const raw = await AsyncStorage.getItem(KNOWN_REPORTS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        console.error("getKnownReportIds error:", e);
        return [];
    }
}

/**
 * Xóa IDs đã biết khỏi cache (khi API list đã trả về rồi)
 */
export async function removeKnownReportIds(ids: number[]): Promise<void> {
    try {
        const raw = await AsyncStorage.getItem(KNOWN_REPORTS_KEY);
        const existing: number[] = raw ? JSON.parse(raw) : [];
        const updated = existing.filter((id) => !ids.includes(id));
        await AsyncStorage.setItem(KNOWN_REPORTS_KEY, JSON.stringify(updated));
    } catch (e) {
        console.error("removeKnownReportIds error:", e);
    }
}
