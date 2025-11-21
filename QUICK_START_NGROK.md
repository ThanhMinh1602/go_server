# 🚀 Quick Start - Ngrok

## Cách chạy ngrok

### Sử dụng npm script (Khuyến nghị)

```bash
cd go_server

# Chạy ngrok (server phải đang chạy trên port 3000)
npm run ngrok
```

### Sử dụng script trực tiếp

```bash
cd go_server

# Chạy ngrok
./scripts/start-ngrok.sh
```

---

## ⚠️ Lưu ý quan trọng

**Phải chạy từ thư mục `go_server/`:**

```bash
# ✅ ĐÚNG
cd go_server
npm run ngrok

# ❌ SAI (sẽ báo lỗi không tìm thấy package.json)
cd ..
npm run ngrok
```

**Server phải đang chạy trước:**
```bash
# Terminal 1: Chạy server
cd go_server
npm run dev

# Terminal 2: Chạy ngrok
cd go_server
npm run ngrok
```

---

## 📝 Setup lần đầu

1. **Cài đặt ngrok:**
   ```bash
   brew install ngrok/ngrok/ngrok
   ```

2. **Cấu hình authtoken:**
   - Đăng ký: https://dashboard.ngrok.com/signup
   - Lấy token: https://dashboard.ngrok.com/get-started/your-authtoken
   - Mở file `ngrok.yml`
   - Thay `YOUR_AUTH_TOKEN_HERE` bằng token của bạn

3. **Chạy server và ngrok riêng biệt:**
   ```bash
   # Terminal 1: Start server
   cd go_server
   npm run dev
   
   # Terminal 2: Start ngrok
   cd go_server
   npm run ngrok
   ```

---

## 📖 Xem thêm

- Hướng dẫn chi tiết: `NGROK_SETUP.md`
- Web interface: http://127.0.0.1:4040 (sau khi chạy ngrok)

