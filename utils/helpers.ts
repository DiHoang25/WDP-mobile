export const formatDate = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export const formatDateTime = (date: Date): string => {
  const dateStr = formatDate(date);
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${dateStr} ${hours}:${minutes}`;
};

export const formatNumber = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

export const formatCurrency = (amount: number): string => {
  return `${formatNumber(amount)}đ`;
};

export const getStatusColor = (
  status: string,
): { bg: string; text: string } => {
  const s = status?.toLowerCase() || "";
  const statusColors: Record<string, { bg: string; text: string }> = {
    pending: { bg: "#FEF3C7", text: "#92400E" },
    accepted: { bg: "#DBEAFE", text: "#1E40AF" },
    assigned: { bg: "#DBEAFE", text: "#1E40AF" },
    on_the_way: { bg: "#E0E7FF", text: "#4338CA" },
    waiting_customer: { bg: "#FDF2F2", text: "#9B1C1C" },
    collected: { bg: "#E0E7FF", text: "#4338CA" },
    completed: { bg: "#D1FAE5", text: "#065F46" },
    cancelled: { bg: "#F3F4F6", text: "#6B7280" },
  };
  return statusColors[s] || { bg: "#F3F4F6", text: "#6B7280" };
};

export const getStatusText = (status: string): string => {
  const s = status?.toLowerCase() || "";
  const statusTexts: Record<string, string> = {
    pending: "Chờ xử lý",
    accepted: "Đã tiếp nhận",
    assigned: "Đã phân công",
    on_the_way: "Đang đến",
    waiting_customer: "Đang chờ khách",
    collected: "Đã thu gom",
    completed: "Hoàn thành",
    cancelled: "Đã hủy",
  };
  return statusTexts[s] || status;
};

export const getWasteTypeLabel = (type: string): string => {
  if (!type) return "Rác khác";
  const s = String(type).toUpperCase();
  const typeMap: Record<string, string> = {
    ORGANIC: "Rác hữu cơ",
    RECYCLABLE: "Rác tái chế",
    HAZARDOUS: "Rác nguy hại",
  };
  return typeMap[s] || type;
};

/**
 * Chuyển đổi từ mã tỉnh/quận/phường sang tên địa chỉ chi tiết
 * @param provinceCode - Mã tỉnh/thành phố
 * @param districtCode - Mã quận/huyện
 * @param wardCode - Mã phường/xã
 * @returns Object chứa tên của tỉnh, quận, phường và địa chỉ đầy đủ
 */
export const getLocationNamesFromCodes = async (
  provinceCode?: string,
  districtCode?: string,
  wardCode?: string
): Promise<{
  province: string;
  district: string;
  ward: string;
  fullAddress: string;
}> => {
  const result = {
    province: "",
    district: "",
    ward: "",
    fullAddress: "",
  };

  try {
    // Fetch province name
    if (provinceCode) {
      const pRes = await fetch(`https://provinces.open-api.vn/api/p/${provinceCode}`);
      if (pRes.ok) {
        const pData = await pRes.json();
        result.province = pData.name || "";
      }
    }

    // Fetch district name
    if (districtCode) {
      const dRes = await fetch(`https://provinces.open-api.vn/api/d/${districtCode}`);
      if (dRes.ok) {
        const dData = await dRes.json();
        result.district = dData.name || "";
      }
    }

    // Fetch ward name
    if (wardCode) {
      const wRes = await fetch(`https://provinces.open-api.vn/api/w/${wardCode}`);
      if (wRes.ok) {
        const wData = await wRes.json();
        result.ward = wData.name || "";
      }
    }

    // Build full address
    result.fullAddress = [result.ward, result.district, result.province]
      .filter(Boolean)
      .join(", ");
  } catch (error) {
    console.error("Error fetching location names:", error);
  }

  return result;
};
