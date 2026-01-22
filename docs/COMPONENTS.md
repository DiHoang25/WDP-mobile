# Tài liệu Cấu trúc Components

## 📁 Cấu trúc Components

### `components/common/` - Components Dùng Chung

Các components có thể tái sử dụng trong toàn bộ app:

- **Button** - Button với variants (primary, outline, secondary), loading state
- **Input** - Input field với validation, icons, show/hide password
- **Card** - Card container với variants (default, elevated, outlined)
- **Header** - Header với gradient, back button, custom right component
- **Badge** - Badge với nhiều colors và sizes
- **EmptyState** - Empty state với icon, title, message
- **Loading** - Loading indicator component

### `components/auth/` - Components Authentication

Components liên quan đến đăng nhập/đăng ký:

- **LogoHeader** - App logo với gradient header
- **QuickLoginButton** - Quick login button cho testing

### `components/forms/` - Form Components

Components cho forms:

- **RoleSelector** - Selector chọn role (citizen/shipper)

### `components/dashboard/` - Dashboard Components

Components cho dashboard screens:

- **StatCard** - Card hiển thị statistics

### `components/reports/` - Report Components

Components liên quan đến waste reports:

- **WasteReportCard** - Card hiển thị thông tin waste report

### `components/waste/` - Waste Management Components

Components quản lý rác:

- **WasteTypeSelector** - Grid selector chọn loại rác

### `components/ui/` - UI Components

Basic UI components:

- **TabIcon** - Tab icon component cho bottom tabs

## 🎯 Cách Sử Dụng

### Import Components

```typescript
// Common components
import { Button, Input, Card, Header } from "@/components/common";

// Auth components
import { LogoHeader, QuickLoginButton } from "@/components/auth";

// Dashboard components
import { StatCard } from "@/components/dashboard";

// Report components
import { WasteReportCard } from "@/components/reports";

// Waste components
import { WasteTypeSelector } from "@/components/waste";

// UI components
import { TabIcon } from "@/components/ui";
```

### Example: Using Button

```typescript
<Button
  title="Đăng nhập"
  onPress={handleLogin}
  loading={loading}
  icon="🚀"
  variant="primary"
  size="medium"
/>
```

### Example: Using Input

```typescript
<Input
  label="Email"
  icon="📧"
  placeholder="example@email.com"
  value={email}
  onChangeText={setEmail}
  keyboardType="email-address"
  required
  error={emailError}
/>
```

## 📝 Utils

### `utils/validators.ts`

- `validateEmail(email)` - Validate email format
- `validatePhone(phone)` - Validate phone number
- `validatePassword(password)` - Validate password strength
- `validateRequired(value, fieldName)` - Check required field

### `utils/helpers.ts`

- `formatDate(date)` - Format date to DD/MM/YYYY
- `formatDateTime(date)` - Format date and time
- `formatNumber(num)` - Format number with thousands separator
- `formatCurrency(amount)` - Format currency in VND
- `getStatusColor(status)` - Get color for status
- `getStatusText(status)` - Get Vietnamese text for status

## 🎨 Constants

### `constants/theme.ts`

- `AppColors` - All app colors (primary, secondary, gray scale, role colors)
- `Colors` - Light/dark theme colors
- `Fonts` - Platform-specific fonts

### `constants/styles.ts`

- `commonStyles` - Common reusable styles (container, shadow, spacing, etc.)
