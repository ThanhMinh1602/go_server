# FCM Setup Guide

Hướng dẫn cấu hình Firebase Cloud Messaging (FCM) cho friend request notifications.

## Backend Setup

### 1. Cài đặt Firebase Admin SDK

Firebase Admin SDK đã được cài đặt:
```bash
npm install firebase-admin
```

### 2. Lấy Firebase Service Account

1. Vào [Firebase Console](https://console.firebase.google.com/)
2. Chọn project của bạn
3. Vào **Project Settings** > **Service Accounts**
4. Click **Generate New Private Key**
5. Download file JSON

### 3. Cấu hình Environment Variables

Thêm vào file `.env`:

**Option 1: Sử dụng file path**
```env
FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/serviceAccountKey.json
```

**Option 2: Sử dụng JSON string**
```env
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"..."}
```

### 4. Cấu hình User Model

User model đã được cập nhật với field `fcmToken`. Token sẽ được tự động cập nhật khi user đăng nhập hoặc refresh token.

### 5. API Endpoints

- **Update FCM Token**: `PUT /api/users/:id` với body `{ "fcmToken": "token" }`
- FCM notifications sẽ tự động được gửi khi:
  - Có friend request mới
  - Friend request được chấp nhận

## Flutter Setup

### 1. Cài đặt Packages

Packages đã được thêm vào `pubspec.yaml`:
- `firebase_messaging: ^15.1.3`
- `firebase_core: ^3.6.0`

### 2. Cấu hình Firebase

1. Thêm `google-services.json` (Android) vào `android/app/`
2. Thêm `GoogleService-Info.plist` (iOS) vào `ios/Runner/`
3. Cấu hình Firebase trong `main.dart` (đã được setup)

### 3. FCM Service

FCM Service đã được tích hợp và tự động:
- Request permission
- Get FCM token
- Update token lên server
- Handle foreground/background notifications
- Trigger FriendController reload khi có notification

### 4. Real-time Updates

FriendController tự động lắng nghe Socket.IO events:
- `friend:request:received` - Khi nhận friend request
- `friend:request:accepted` - Khi friend request được chấp nhận
- `friend:added` - Khi có bạn mới

## Testing

1. Đăng nhập với 2 tài khoản khác nhau
2. Gửi friend request từ account A đến account B
3. Account B sẽ nhận:
   - Push notification (FCM)
   - Real-time update qua Socket.IO (nếu app đang mở)
4. Chấp nhận friend request
5. Account A sẽ nhận notification và real-time update

## Notes

- FCM service sẽ tự động retry nếu token invalid
- Socket.IO events chỉ hoạt động khi app đang mở
- FCM notifications hoạt động cả khi app đóng
- Background message handler đã được setup trong `main.dart`

