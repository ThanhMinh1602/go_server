# Troubleshooting

## Lỗi kết nối MongoDB

### Vấn đề: Cannot connect to MongoDB

**Giải pháp:**
1. Đảm bảo MongoDB đang chạy
2. Kiểm tra `MONGODB_URI` trong file `.env`
3. Kiểm tra network/firewall settings
4. Nếu dùng MongoDB Atlas, kiểm tra IP whitelist

## Lỗi Authentication

### Vấn đề: JWT token không hợp lệ

**Giải pháp:**
1. Kiểm tra `JWT_SECRET` trong `.env`
2. Đảm bảo token được gửi đúng format: `Bearer <token>`
3. Token có thể đã hết hạn, cần login lại

### Vấn đề: Password không đúng

**Giải pháp:**
1. Kiểm tra password đã được hash đúng chưa
2. Đảm bảo password không có khoảng trắng thừa
3. Thử reset password

## Lỗi Image Upload (Cloudinary)

### Vấn đề: Invalid API credentials

**Giải pháp:**
1. Kiểm tra Cloud name, API Key, API Secret trong `.env`
2. Đảm bảo không có khoảng trắng thừa
3. Copy đầy đủ các giá trị từ Cloudinary dashboard

### Vấn đề: Upload failed

**Giải pháp:**
1. Kiểm tra file size (Cloudinary free tier: max 10MB)
2. Kiểm tra file format (chỉ hỗ trợ image files: jpg, png, gif, webp)
3. Kiểm tra quota/limits trong Cloudinary dashboard
4. Kiểm tra network connection

### Vấn đề: Images không hiển thị

**Giải pháp:**
1. Kiểm tra URL trả về từ API
2. Kiểm tra CORS settings nếu cần
3. Cloudinary URLs mặc định là HTTPS và public
4. Kiểm tra image URL trong browser

## Lỗi Server

### Vấn đề: Port đã được sử dụng

**Giải pháp:**
1. Thay đổi PORT trong `.env`
2. Hoặc kill process đang sử dụng port:
   ```bash
   # macOS/Linux
   lsof -ti:3000 | xargs kill
   
   # Windows
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   ```

### Vấn đề: Module not found

**Giải pháp:**
1. Chạy `npm install` để cài đặt dependencies
2. Kiểm tra `package.json` có đúng dependencies chưa
3. Xóa `node_modules` và `package-lock.json`, sau đó chạy `npm install` lại

## Lỗi API

### Vấn đề: 404 Not Found

**Giải pháp:**
1. Kiểm tra route đúng chưa
2. Kiểm tra HTTP method (GET, POST, PUT, DELETE)
3. Kiểm tra base URL: `http://localhost:3000/api/...`

### Vấn đề: 401 Unauthorized

**Giải pháp:**
1. Kiểm tra đã gửi JWT token chưa
2. Token format: `Authorization: Bearer <token>`
3. Token có thể đã hết hạn
4. Đăng nhập lại để lấy token mới

### Vấn đề: 400 Bad Request

**Giải pháp:**
1. Kiểm tra request body format (JSON)
2. Kiểm tra required fields
3. Kiểm tra data types
4. Xem error message chi tiết trong response

## Các bước kiểm tra chung

1. ✅ MongoDB đang chạy và kết nối được
2. ✅ File `.env` đã được cấu hình đúng
3. ✅ Dependencies đã được cài đặt (`npm install`)
4. ✅ Port không bị conflict
5. ✅ Cloudinary credentials đúng
6. ✅ JWT secret đã được set

## Debug Tips

1. **Check logs**: Xem console logs để biết lỗi chi tiết
2. **Test với Swagger**: Sử dụng Swagger UI tại `/api-docs` để test API
3. **Check network**: Sử dụng Postman hoặc curl để test API
4. **Check database**: Kiểm tra MongoDB để xem data có được lưu không
