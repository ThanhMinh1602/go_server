# Migration Scripts

## migrate-location-userId.js

Migration script để xử lý các location cũ không có `userId` sau khi thêm field này vào Location model.

### Cách sử dụng:

#### Option 1: Gán userId cho locations cũ (mặc định)
```bash
node scripts/migrate-location-userId.js
```

Script sẽ:
- Tìm tất cả locations không có `userId`
- Gán chúng cho user đầu tiên trong database (user được tạo sớm nhất)
- Log kết quả

#### Option 2: Xóa locations không có userId
```bash
node scripts/migrate-location-userId.js --delete
```

Script sẽ:
- Tìm tất cả locations không có `userId`
- Xóa chúng khỏi database
- Log kết quả

### Lưu ý:

1. **Backup database trước khi chạy migration** (đặc biệt nếu dùng `--delete`)
2. Script sẽ tự động kết nối MongoDB từ `MONGODB_URI` trong `.env`
3. Script sẽ log chi tiết quá trình migration
4. Sau khi migration, tất cả locations sẽ có `userId` hoặc bị xóa

### Bước sau migration:

Sau khi chạy migration thành công, cần cập nhật `models/Location.js`:

1. Đổi `userId.required` từ `false` thành `true`:
   ```javascript
   userId: {
     type: mongoose.Schema.Types.ObjectId,
     ref: 'User',
     required: true, // Set back to true after migration
   },
   ```

2. Restart server để áp dụng thay đổi

### Ví dụ output:

```
Connected to MongoDB
Found 15 locations without userId
Assigning locations to user: user@example.com (507f1f77bcf86cd799439011)
Updated 15 locations with userId: 507f1f77bcf86cd799439011
✅ Migration completed successfully!
Disconnected from MongoDB
```

