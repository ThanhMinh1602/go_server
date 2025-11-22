# FCM Configuration - Đã hoàn thành

## ✅ Đã cấu hình

1. **Service Account Key**: File `go-go-56276-firebase-adminsdk-fbsvc-3ffca03fd1.json` đã có trong `go_server/`
2. **Environment Variable**: Đã thêm vào `.env`:
   ```
   FIREBASE_SERVICE_ACCOUNT_PATH=./go-go-56276-firebase-adminsdk-fbsvc-3ffca03fd1.json
   ```
3. **Security**: File service account key đã được thêm vào `.gitignore`

## 🔍 Kiểm tra FCM đã hoạt động

### 1. Restart server

```bash
cd go_server
npm run dev
```

### 2. Kiểm tra logs

Khi server khởi động, bạn sẽ thấy trong logs:
- ✅ `Firebase Admin SDK initialized for FCM` - FCM đã sẵn sàng
- ⚠️ `FCM not initialized: No Firebase credentials provided` - Chưa cấu hình đúng

### 3. Test FCM

1. Đăng nhập vào app với 2 tài khoản khác nhau
2. Từ account A, gửi friend request đến account B
3. Account B sẽ nhận:
   - Push notification (FCM)
   - Real-time update qua Socket.IO (nếu app đang mở)

## 📝 Lưu ý

- File service account key **KHÔNG** được commit lên git (đã có trong .gitignore)
- Nếu thay đổi file service account, chỉ cần cập nhật đường dẫn trong `.env`
- FCM sẽ tự động gửi notification khi có friend request hoặc friend request được chấp nhận

## 🐛 Troubleshooting

### FCM không khởi tạo

1. Kiểm tra file service account có tồn tại:
   ```bash
   ls -la go-go-56276-firebase-adminsdk-fbsvc-3ffca03fd1.json
   ```

2. Kiểm tra .env có đúng đường dẫn:
   ```bash
   cat .env | grep FIREBASE
   ```

3. Kiểm tra logs khi server khởi động để xem lỗi cụ thể

### Notification không đến

1. Đảm bảo user đã đăng nhập và FCM token đã được lưu
2. Kiểm tra FCM token trong database (field `fcmToken` trong User collection)
3. Kiểm tra logs khi gửi friend request để xem có lỗi gửi notification không

