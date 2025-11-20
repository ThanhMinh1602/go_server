# Response Helper Guide

## Tổng quan

Response Helper là utility để standardize API responses, giúp code gọn gàng và dễ maintain hơn.

## Cài đặt

Response Helper đã được tích hợp vào tất cả controllers và middleware.

## Các methods có sẵn

### Success Responses

#### `ok(res, message, data)`
Trả về status 200 OK
```javascript
return ok(res, 'Operation successful', { user: userData });
// Response: { success: true, message: 'Operation successful', user: userData }
```

#### `created(res, message, data)`
Trả về status 201 Created
```javascript
return created(res, 'User created', { user: userData });
// Response: { success: true, message: 'User created', user: userData }
```

#### `success(res, statusCode, message, data)`
Trả về success với status code tùy chỉnh
```javascript
return success(res, 200, 'Custom message', { data: 'value' });
```

### Error Responses

#### `badRequest(res, message, errors)`
Trả về status 400 Bad Request
```javascript
return badRequest(res, 'Validation failed', ['Field is required']);
// Response: { success: false, message: 'Validation failed', errors: [...] }
```

#### `unauthorized(res, message)`
Trả về status 401 Unauthorized
```javascript
return unauthorized(res, 'Invalid credentials');
// Response: { success: false, message: 'Invalid credentials' }
```

#### `forbidden(res, message)`
Trả về status 403 Forbidden
```javascript
return forbidden(res, 'Not authorized');
// Response: { success: false, message: 'Not authorized' }
```

#### `notFound(res, message)`
Trả về status 404 Not Found
```javascript
return notFound(res, 'User not found');
// Response: { success: false, message: 'User not found' }
```

#### `serverError(res, message)`
Trả về status 500 Internal Server Error
```javascript
return serverError(res, 'Internal server error');
// Response: { success: false, message: 'Internal server error' }
```

#### `error(res, statusCode, message, errors)`
Trả về error với status code tùy chỉnh
```javascript
return error(res, 422, 'Unprocessable entity', { field: 'error' });
```

## Ví dụ sử dụng

### Trước khi dùng Response Helper

```javascript
// ❌ Cách cũ - dài dòng
if (!user) {
  return res.status(404).json({
    success: false,
    message: 'User not found',
  });
}

res.status(200).json({
  success: true,
  user: user.toJSON(),
});
```

### Sau khi dùng Response Helper

```javascript
// ✅ Cách mới - gọn gàng
if (!user) {
  return notFound(res, 'User not found');
}

return ok(res, null, {
  user: user.toJSON(),
});
```

## Best Practices

1. **Luôn return response**: Luôn dùng `return` khi gọi response helper
   ```javascript
   return ok(res, 'Success', data);
   ```

2. **Message là optional**: Có thể bỏ qua message nếu không cần
   ```javascript
   return ok(res, null, { data: value });
   // hoặc
   return ok(res, undefined, { data: value });
   ```

3. **Data là object**: Data sẽ được merge vào response
   ```javascript
   return ok(res, null, {
     user: userData,
     token: tokenData,
   });
   // Response: { success: true, user: ..., token: ... }
   ```

4. **Errors có thể là array hoặc object**:
   ```javascript
   // Array cho validation errors
   return badRequest(res, 'Validation failed', ['Field 1 required', 'Field 2 required']);
   
   // Object cho error details
   return badRequest(res, 'Validation failed', { field: 'error message' });
   ```

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Optional message",
  "data": "Merged into root level"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "errors": ["Array of errors"] // hoặc
  "error": { "Object error" }
}
```

## Migration Checklist

Tất cả controllers đã được cập nhật:
- ✅ AuthController
- ✅ UserController
- ✅ RestaurantController
- ✅ ImageController
- ✅ Auth Middleware
- ✅ Server.js (health check, 404 handler)

## Lợi ích

1. **Code gọn gàng hơn**: Giảm code duplication
2. **Consistent**: Tất cả responses có format giống nhau
3. **Dễ maintain**: Chỉ cần sửa một chỗ nếu muốn thay đổi format
4. **Type safety**: Dễ dàng thêm TypeScript sau này
5. **Readable**: Code dễ đọc và hiểu hơn

