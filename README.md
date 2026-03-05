# ECONNET - Ứng dụng Thu Gom Rác Thông Minh 🌱♻️

Ứng dụng mobile React Native với Expo giúp bảo vệ môi trường thông qua dịch vụ thu gom rác thông minh.

## 🚀 Cài Đặt và Chạy

1. Cài đặt dependencies

   ```bash
   npm install
   ```

2. Chạy app

   ```bash
   npm start
   ```

3. Quét QR code bằng Expo Go (Android) hoặc Camera app (iOS)

## 🎯 Tính Năng

### 👤 Công Dân (Citizens)

- Tạo báo cáo rác với 8 loại phân loại
- Tích điểm từ việc báo cáo rác
- Bảng xếp hạng theo khu vực
- Đổi điểm lấy voucher
- Theo dõi lịch sử báo cáo

### 🚚 Shipper

- Nhận và xử lý đơn hàng thu gom
- Theo dõi trạng thái đơn hàng
- Lịch sử công việc
- Quản lý thông tin phương tiện

## 🔐 Tài Khoản Test

**Công dân:**

- Email: `citizen@test.com`
- Password: `123456`

**Shipper:**

- Email: `shipper@test.com`
- Password: `123456`

## 🎨 Công Nghệ

- React Native 0.81.5
- Expo SDK 54
- Expo Router 6 (file-based routing)
- TypeScript
- React Native Reanimated

## 📂 Cấu Trúc Dự Án

```
app/
  (citizen)/     # Screens cho Citizens
  (shipper)/     # Screens cho Shipper
  index.tsx      # Entry point
  login.tsx      # Màn hình đăng nhập
  register.tsx   # Màn hình đăng ký
  _layout.tsx    # Root layout

components/      # Reusable components
constants/       # Theme, colors
contexts/        # AuthContext
data/           # Mock data
hooks/          # Custom hooks
types/          # TypeScript types
```

## 🔄 Tích Hợp Backend

Để tích hợp với backend, chỉnh sửa file `contexts/AuthContext.tsx`:

```typescript
const login = async (email: string, password: string): Promise<boolean> => {
  const response = await fetch("/api/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json();
  if (data.success) {
    setUser(data.user);
    return true;
  }
  return false;
};
```

Backend API cần trả về:

- `user` object với `role` field ('citizen' hoặc 'shipper')
- App sẽ tự động chuyển hướng dựa trên role

## 📱 Build Production

```bash
# Build Android APK
eas build --platform android

# Build iOS
eas build --platform ios
```
