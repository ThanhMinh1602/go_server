# Hướng dẫn sử dụng Logging System

## Tổng quan

App sử dụng Winston để logging với các mức độ:
- **error**: Lỗi nghiêm trọng
- **warn**: Cảnh báo
- **info**: Thông tin quan trọng
- **http**: HTTP requests (qua Morgan)
- **debug**: Thông tin debug chi tiết

## Cấu hình

### Environment Variables

Thêm vào file `.env`:

```env
LOG_LEVEL=debug  # debug, info, warn, error
```

### Log Files

Logs được lưu trong thư mục `logs/`:
- `combined.log`: Tất cả logs
- `error.log`: Chỉ errors

## Sử dụng Logger

### Trong Controllers

```javascript
const logger = require('../services/logger');

// Debug log
logger.debug('Debug message', { data: 'value' });

// Info log
logger.info('Info message', { userId: '123' });

// Warning log
logger.warn('Warning message', { reason: 'something' });

// Error log
logger.error('Error message', error, { context: 'data' });
```

### Trong Services

```javascript
const logger = require('../services/logger');

logger.debug('Service operation started', { param: value });
logger.info('Service operation completed', { result: data });
logger.error('Service operation failed', error, { param: value });
```

## Log Levels

### Development
- **LOG_LEVEL=debug**: Hiển thị tất cả logs (recommended)

### Production
- **LOG_LEVEL=info**: Chỉ hiển thị info, warn, error
- **LOG_LEVEL=warn**: Chỉ hiển thị warn và error
- **LOG_LEVEL=error**: Chỉ hiển thị errors

## Log Format

### Console Output
```
2024-11-20 12:34:56 [info]: Server running on port 3000
2024-11-20 12:34:57 [debug]: Incoming request { method: 'GET', url: '/api/restaurants' }
2024-11-20 12:34:58 [error]: Error message { stack: '...' }
```

### File Output (JSON)
```json
{
  "timestamp": "2024-11-20 12:34:56",
  "level": "info",
  "message": "Server running on port 3000",
  "environment": "development"
}
```

## HTTP Request Logging

Tất cả HTTP requests được tự động log qua Morgan middleware:
- Method, URL, Status code
- Response time
- IP address
- User agent

## Best Practices

1. **Debug**: Dùng cho thông tin chi tiết, chỉ cần khi debug
2. **Info**: Dùng cho các events quan trọng (login, create, update)
3. **Warn**: Dùng cho các tình huống bất thường nhưng không phải lỗi
4. **Error**: Dùng cho tất cả errors, luôn kèm error object

## Log Rotation

Logs tự động rotate khi đạt 5MB, giữ tối đa 5 files.

## Xem Logs

### Real-time (console)
```bash
npm run dev
```

### Log files
```bash
# Xem tất cả logs
tail -f logs/combined.log

# Xem chỉ errors
tail -f logs/error.log
```

## Troubleshooting

### Logs không xuất hiện
- Kiểm tra `LOG_LEVEL` trong `.env`
- Kiểm tra thư mục `logs/` đã được tạo chưa
- Kiểm tra quyền ghi file

### Logs quá nhiều
- Tăng `LOG_LEVEL` lên `info` hoặc `warn`
- Filter logs trong production

### Log files quá lớn
- Logs tự động rotate khi đạt 5MB
- Có thể xóa logs cũ nếu cần

