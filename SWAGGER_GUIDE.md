# Hướng dẫn sử dụng Swagger API Documentation

## Truy cập Swagger UI

Sau khi khởi động server, truy cập Swagger UI tại:

```
http://localhost:3000/api-docs
```

## Cách sử dụng

### 1. Xem tất cả API endpoints

Swagger UI sẽ hiển thị tất cả các API endpoints được nhóm theo tags:
- **Auth**: Authentication endpoints
- **Users**: User management endpoints
- **Restaurants**: Restaurant CRUD endpoints
- **Images**: Image upload/delete endpoints

### 2. Test API với Swagger UI

#### Test Authentication

1. **Register** (POST `/api/auth/register`):
   - Click vào endpoint
   - Click "Try it out"
   - Điền thông tin:
     ```json
     {
       "email": "test@example.com",
       "password": "password123",
       "name": "Test User"
     }
     ```
   - Click "Execute"
   - Copy `token` từ response

2. **Login** (POST `/api/auth/login`):
   - Điền email và password
   - Click "Execute"
   - Copy `token` từ response

3. **Authorize với JWT Token**:
   - Click nút **"Authorize"** ở đầu trang (biểu tượng khóa)
   - Nhập token vào ô "Value": `Bearer <your-token>`
   - Click "Authorize"
   - Click "Close"
   - Bây giờ bạn có thể test các endpoints cần authentication

#### Test Restaurants API

1. **Get All Restaurants** (GET `/api/restaurants`):
   - Click "Try it out"
   - Có thể thêm query parameters:
     - `area`: Filter by area
     - `type`: Filter by type (food/coffee)
   - Click "Execute"

2. **Create Restaurant** (POST `/api/restaurants`):
   - Click "Try it out"
   - Điền thông tin:
     ```json
     {
       "name": "Test Restaurant",
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
   - Click "Execute"

3. **Get Distinct Areas** (GET `/api/restaurants/areas`):
   - Click "Try it out"
   - Click "Execute"

#### Test Image Upload

1. **Upload Single Image** (POST `/api/images/upload`):
   - Click "Try it out"
   - Click "Choose File" để chọn hình ảnh
   - (Optional) Điền `restaurantId` hoặc `userId`
   - Click "Execute"
   - Copy `url` từ response để sử dụng

2. **Upload Multiple Images** (POST `/api/images/upload-multiple`):
   - Click "Try it out"
   - Chọn nhiều file (tối đa 10)
   - Click "Execute"

### 3. Xem Response Schema

Mỗi endpoint có:
- **Parameters**: Các tham số cần thiết
- **Request body**: Schema của request body
- **Responses**: Các response codes và schemas

### 4. Download OpenAPI Spec

Bạn có thể download OpenAPI specification (JSON/YAML) từ Swagger UI để:
- Import vào Postman
- Generate client code
- Share với team

## Lưu ý

1. **JWT Token**: 
   - Token có thời hạn (mặc định 7 ngày)
   - Nếu token hết hạn, bạn cần login lại và authorize lại

2. **File Upload**:
   - Chỉ hỗ trợ image files: jpg, png, gif, webp
   - Max file size: 10MB
   - Max files (multiple upload): 10 files

3. **Error Responses**:
   - 400: Bad Request (thiếu thông tin, validation error)
   - 401: Unauthorized (chưa login hoặc token không hợp lệ)
   - 403: Forbidden (không có quyền)
   - 404: Not Found (resource không tồn tại)
   - 500: Server Error

## Troubleshooting

### Swagger UI không hiển thị
- Kiểm tra server đã chạy chưa: `npm run dev`
- Kiểm tra port: `http://localhost:3000/api-docs`
- Kiểm tra console log có lỗi không

### API không hoạt động
- Kiểm tra MongoDB đã kết nối chưa
- Kiểm tra `.env` file đã được cấu hình đúng chưa
- Kiểm tra JWT token còn hợp lệ không

### File upload không hoạt động
- Kiểm tra Google Drive API credentials
- Kiểm tra file size không vượt quá 10MB
- Kiểm tra file format (chỉ image files)

## Tips

1. **Bookmark Swagger UI**: Lưu `http://localhost:3000/api-docs` vào bookmark để dễ truy cập

2. **Test flow hoàn chỉnh**:
   - Register → Login → Get Me → Create Restaurant → Upload Image → Get Restaurants

3. **Copy cURL command**: Swagger UI có thể generate cURL command để test từ terminal

4. **Export to Postman**: Có thể import OpenAPI spec vào Postman để test nâng cao hơn

