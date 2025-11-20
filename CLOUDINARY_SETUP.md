# Hướng dẫn cấu hình Cloudinary

## Bước 1: Tạo tài khoản Cloudinary

1. Truy cập [Cloudinary](https://cloudinary.com/)
2. Click **Sign Up** để tạo tài khoản miễn phí
3. Điền thông tin và xác nhận email

## Bước 2: Lấy thông tin API

1. Sau khi đăng nhập, vào **Dashboard**
2. Bạn sẽ thấy 3 thông tin quan trọng:
   - **Cloud name**: Tên cloud của bạn (ví dụ: `my-cloud-name`)
   - **API Key**: API key (ví dụ: `123456789012345`)
   - **API Secret**: API secret (ví dụ: `abcdefghijklmnopqrstuvwxyz`)

## Bước 3: Cấu hình .env

Thêm các giá trị vào file `.env`:

```env
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
```

## Bước 4: Test upload

Sau khi cấu hình xong, khởi động server và test upload:

```bash
npm run dev
```

Test upload image qua Swagger UI tại `http://localhost:3000/api-docs`

## Tính năng Cloudinary

- ✅ **Auto optimization**: Tự động optimize images
- ✅ **Auto format**: Tự động chọn format tốt nhất (WebP, AVIF, etc.)
- ✅ **Auto resize**: Tự động resize images (max 1920x1920)
- ✅ **CDN**: Images được serve qua CDN toàn cầu
- ✅ **Transformations**: Có thể transform images on-the-fly
- ✅ **Free tier**: 25GB storage, 25GB bandwidth/tháng

## Folder Structure

Images được tổ chức theo folder:
- `gogo/` - Root folder
- `gogo/restaurants/{restaurantId}/` - Restaurant images
- `gogo/users/{userId}/` - User avatars

## Lưu ý

- **Free tier limits**: 
  - 25GB storage
  - 25GB bandwidth/tháng
  - 25M requests/tháng
- **Security**: API Secret phải được bảo mật, không commit vào Git
- **Image optimization**: Cloudinary tự động optimize images để giảm kích thước file

## Troubleshooting

### Lỗi "Invalid API credentials"
- Kiểm tra Cloud name, API Key, API Secret trong `.env`
- Đảm bảo không có khoảng trắng thừa
- Copy đầy đủ các giá trị từ Cloudinary dashboard

### Lỗi "Upload failed"
- Kiểm tra file size (Cloudinary free tier: max 10MB)
- Kiểm tra file format (chỉ hỗ trợ image files)
- Kiểm tra quota/limits trong dashboard

### Images không hiển thị
- Kiểm tra URL trả về từ API
- Kiểm tra CORS settings nếu cần
- Cloudinary URLs mặc định là HTTPS và public

