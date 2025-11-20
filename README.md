# Go Server

Backend server cho ứng dụng GoGo - thay thế cho Firebase. Sử dụng Express.js, MongoDB và Cloudinary.

## Tính năng

- ✅ Authentication (Đăng ký, Đăng nhập, Quên mật khẩu)
- ✅ User Management (Quản lý người dùng)
- ✅ Restaurant CRUD (Thêm, Sửa, Xóa, Lấy danh sách nhà hàng)
- ✅ Image Upload/Delete (Upload và xóa hình ảnh qua Cloudinary)
- ✅ Filtering (Lọc nhà hàng theo khu vực và loại)
- ✅ JWT Authentication

## Yêu cầu

- Node.js >= 14.x
- MongoDB >= 4.x
- Cloudinary account

## Cài đặt

1. Clone repository và di chuyển vào thư mục:
```bash
cd go_server
```

2. Cài đặt dependencies:
```bash
npm install
```

3. Tạo file `.env` từ `.env.example`:
```bash
cp .env.example .env
```

4. Cấu hình các biến môi trường trong file `.env`:
```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/gogo_db
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
CORS_ORIGIN=http://localhost:3000
```

## Cấu hình Cloudinary

1. Truy cập [Cloudinary](https://cloudinary.com/) và tạo tài khoản miễn phí
2. Vào **Dashboard** để lấy thông tin:
   - **Cloud name**: Tên cloud của bạn
   - **API Key**: API key từ dashboard
   - **API Secret**: API secret từ dashboard
3. Thêm các giá trị này vào file `.env`

## Chạy ứng dụng

### Development mode:
```bash
npm run dev
```

### Production mode:
```bash
npm start
```

Server sẽ chạy tại `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Đăng ký tài khoản mới
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/forgot-password` - Quên mật khẩu
- `GET /api/auth/me` - Lấy thông tin user hiện tại (cần auth)
- `POST /api/auth/logout` - Đăng xuất (cần auth)

### Users
- `GET /api/users` - Lấy danh sách tất cả users (cần auth)
- `GET /api/users/:id` - Lấy thông tin user theo ID (cần auth)
- `PUT /api/users/:id` - Cập nhật thông tin user (cần auth)

### Restaurants
- `GET /api/restaurants` - Lấy danh sách nhà hàng (có thể filter: ?area=xxx&type=xxx)
- `GET /api/restaurants/:id` - Lấy thông tin nhà hàng theo ID
- `POST /api/restaurants` - Tạo nhà hàng mới
- `PUT /api/restaurants/:id` - Cập nhật nhà hàng
- `DELETE /api/restaurants/:id` - Xóa nhà hàng
- `GET /api/restaurants/areas` - Lấy danh sách các khu vực

### Images
- `POST /api/images/upload` - Upload một hình ảnh
- `POST /api/images/upload-multiple` - Upload nhiều hình ảnh
- `DELETE /api/images/:id` - Xóa hình ảnh

### Location
- `GET /api/location/address?lat={lat}&lng={lng}` - Lấy địa chỉ (area/town name) từ lat/lng
- `GET /api/location/full-address?lat={lat}&lng={lng}` - Lấy địa chỉ đầy đủ (area, address, name) từ lat/lng

## Ví dụ Request/Response

### Đăng ký
```json
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}

Response:
{
  "success": true,
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "John Doe",
    "phone": null,
    "avatar": null
  }
}
```

### Tạo nhà hàng
```json
POST /api/restaurants
{
  "name": "Restaurant Name",
  "types": ["food", "coffee"],
  "imageUrls": [],
  "location": {
    "latitude": 10.762622,
    "longitude": 106.660172,
    "address": "123 Main Street",
    "area": "District 1"
  }
}
```

### Upload hình ảnh
```bash
POST /api/images/upload
Content-Type: multipart/form-data
Body:
  - image: (file)
  - restaurantId: "restaurant-id" (optional)
  - userId: "user-id" (optional)
```

## Cấu trúc thư mục

```
go_server/
├── config/          # Cấu hình database
├── controllers/     # Business logic
├── middleware/      # Middleware (auth, error handling, upload)
├── models/          # Mongoose models
├── routes/          # API routes
├── services/        # Services (JWT, Google Drive)
├── uploads/         # Temporary upload folder (tự động xóa sau khi upload lên Drive)
├── server.js        # Entry point
└── package.json
```

## Lưu ý

- File upload sẽ được lưu tạm trong thư mục `uploads/` và tự động xóa sau khi upload lên Cloudinary
- JWT token có thời hạn 7 ngày (có thể cấu hình trong `.env`)
- Cloudinary tự động optimize và transform images
- MongoDB connection string mặc định: `mongodb://localhost:27017/gogo_db`

## Troubleshooting

### Lỗi kết nối MongoDB
- Đảm bảo MongoDB đang chạy
- Kiểm tra `MONGODB_URI` trong file `.env`

### Lỗi Cloudinary
- Kiểm tra Cloudinary credentials (Cloud name, API Key, API Secret)
- Đảm bảo các giá trị trong `.env` đúng
- Kiểm tra quota/limits trong Cloudinary dashboard

### Lỗi JWT
- Đảm bảo `JWT_SECRET` đã được set trong `.env`
- Token phải được gửi trong header: `Authorization: Bearer <token>`

## License

ISC

# go_server
