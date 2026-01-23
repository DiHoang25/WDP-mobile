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
  const statusColors: Record<string, { bg: string; text: string }> = {
    pending: { bg: "#FEF3C7", text: "#92400E" },
    assigned: { bg: "#DBEAFE", text: "#1E40AF" },
    collected: { bg: "#E0E7FF", text: "#4338CA" },
    completed: { bg: "#D1FAE5", text: "#065F46" },
  };
  return statusColors[status] || { bg: "#F3F4F6", text: "#6B7280" };
};

export const getStatusText = (status: string): string => {
  const statusTexts: Record<string, string> = {
    pending: "Chờ xử lý",
    assigned: "Đã phân công",
    collected: "Đã thu gom",
    completed: "Hoàn thành",
  };
  return statusTexts[status] || status;
};

export const getWasteTypeLabel = (type: string): string => {
  const typeMap: Record<string, string> = {
    organic: "Rác hữu cơ",
    plastic: "Nhựa",
    paper: "Giấy",
    metal: "Kim loại",
    glass: "Thủy tinh",
    electronic: "Điện tử",
    hazardous: "Nguy hại",
    mixed: "Hỗn hợp",
  };
  return typeMap[type] || type;
};
