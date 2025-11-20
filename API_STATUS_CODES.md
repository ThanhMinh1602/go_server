# API Status Codes Reference

Tài liệu này mô tả tất cả các HTTP status codes được sử dụng trong API.

## Success Status Codes

### 200 OK
- **GET** `/api/auth/me` - Get current user
- **POST** `/api/auth/login` - Login successful
- **POST** `/api/auth/logout` - Logout successful
- **POST** `/api/auth/forgot-password` - Password reset request sent
- **GET** `/api/users` - Get all users
- **GET** `/api/users/:id` - Get user by ID
- **PUT** `/api/users/:id` - Update user profile
- **GET** `/api/restaurants` - Get all restaurants
- **GET** `/api/restaurants/:id` - Get restaurant by ID
- **PUT** `/api/restaurants/:id` - Update restaurant
- **DELETE** `/api/restaurants/:id` - Delete restaurant
- **GET** `/api/restaurants/areas` - Get distinct areas
- **POST** `/api/images/upload` - Image uploaded successfully
- **POST** `/api/images/upload-multiple` - Images uploaded successfully
- **DELETE** `/api/images/:id` - Image deleted successfully
- **GET** `/health` - Health check

### 201 Created
- **POST** `/api/auth/register` - User created successfully
- **POST** `/api/restaurants` - Restaurant created successfully

## Client Error Status Codes

### 400 Bad Request
- **POST** `/api/auth/register` - Missing required fields (email, password, name)
- **POST** `/api/auth/login` - Missing email or password
- **POST** `/api/auth/register` - Email already exists
- **POST** `/api/auth/forgot-password` - Missing email
- **POST** `/api/restaurants` - Missing required fields (name, types)
- **POST** `/api/images/upload` - No file uploaded
- **POST** `/api/images/upload-multiple` - No files uploaded
- Validation errors (Mongoose)
- Duplicate key errors (Mongoose)

### 401 Unauthorized
- **POST** `/api/auth/login` - Invalid credentials
- **GET** `/api/auth/me` - No token provided
- **GET** `/api/auth/me` - Invalid token
- **GET** `/api/auth/me` - User not found
- **POST** `/api/auth/logout` - Authentication failed
- Any protected route without valid token

### 403 Forbidden
- **PUT** `/api/users/:id` - Not authorized to update this profile

### 404 Not Found
- **GET** `/api/users/:id` - User not found
- **POST** `/api/auth/forgot-password` - Email not found
- **GET** `/api/restaurants/:id` - Restaurant not found
- **PUT** `/api/restaurants/:id` - Restaurant not found
- **DELETE** `/api/restaurants/:id` - Restaurant not found
- **Any route** - Route not found (404 handler)

## Server Error Status Codes

### 500 Internal Server Error
- Database connection errors
- Unexpected server errors
- Unhandled exceptions

## Status Code Summary

| Status Code | Meaning | Usage |
|------------|---------|-------|
| 200 | OK | Successful GET, PUT, DELETE operations |
| 201 | Created | Successful POST operations (create new resources) |
| 400 | Bad Request | Invalid input, validation errors |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Authenticated but not authorized |
| 404 | Not Found | Resource not found |
| 500 | Internal Server Error | Server errors |

## Response Format

Tất cả responses đều có format:

```json
{
  "success": true/false,
  "message": "Optional message",
  "data": { ... }
}
```

### Success Response (200/201)
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response (400/401/403/404/500)
```json
{
  "success": false,
  "message": "Error message",
  "error": "Optional error details"
}
```

## Best Practices

1. **Always include status code**: Tất cả responses đều có status code rõ ràng
2. **Use appropriate codes**: 
   - 200 cho GET, PUT, DELETE thành công
   - 201 cho POST tạo mới thành công
   - 400 cho validation errors
   - 401 cho authentication errors
   - 403 cho authorization errors
   - 404 cho resource not found
   - 500 cho server errors
3. **Consistent format**: Tất cả responses đều có `success` field
4. **Error messages**: Error responses luôn có `message` field mô tả lỗi

