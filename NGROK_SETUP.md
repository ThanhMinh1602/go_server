# Ngrok Setup Guide

Hướng dẫn cài đặt và sử dụng ngrok để expose local server ra internet.

## 📋 Mục lục

1. [Cài đặt ngrok](#cài-đặt-ngrok)
2. [Cấu hình authtoken](#cấu-hình-authtoken)
3. [Sử dụng cơ bản](#sử-dụng-cơ-bản)
4. [Sử dụng cấu hình nâng cao](#sử-dụng-cấu-hình-nâng-cao)
5. [Troubleshooting](#troubleshooting)

---

## 🚀 Cài đặt ngrok

### Cách 1: Homebrew (Khuyến nghị)

```bash
brew install ngrok/ngrok/ngrok
```

### Cách 2: Download trực tiếp

1. Truy cập: https://ngrok.com/download
2. Tải file cho macOS
3. Giải nén và di chuyển vào `/usr/local/bin/`:

```bash
sudo mv ~/Downloads/ngrok /usr/local/bin/
sudo chmod +x /usr/local/bin/ngrok
```

---

## 🔑 Cấu hình authtoken

1. **Đăng ký tài khoản miễn phí:**
   - Truy cập: https://dashboard.ngrok.com/signup
   - Đăng ký bằng email hoặc GitHub

2. **Lấy authtoken:**
   - Vào: https://dashboard.ngrok.com/get-started/your-authtoken
   - Copy authtoken của bạn

3. **Cấu hình authtoken:**

   **Cách 1: Sử dụng command (khuyến nghị)**
   ```bash
   ngrok config add-authtoken YOUR_AUTH_TOKEN
   ```

   **Cách 2: Cập nhật file config**
   - Mở file `ngrok.yml`
   - Thay `YOUR_AUTH_TOKEN_HERE` bằng authtoken của bạn

---

## 📖 Sử dụng cơ bản

### Chạy ngrok đơn giản

```bash
# Expose port 3000
ngrok http 3000
```

### Xem web interface

Sau khi chạy ngrok, truy cập: http://127.0.0.1:4040

Tại đây bạn có thể:
- Xem public URL
- Xem tất cả requests/responses
- Inspect traffic

---

## ⚙️ Sử dụng cấu hình nâng cao

### Cách 1: Sử dụng npm script

```bash
cd go_server
npm run ngrok
```

### Cách 2: Sử dụng script trực tiếp

```bash
cd go_server
./scripts/start-ngrok.sh
```

### Cách 3: Sử dụng config file trực tiếp

```bash
cd go_server
ngrok start --config ngrok.yml go-server-api
```

**Lưu ý:** Server phải đang chạy trên port 3000 trước khi chạy ngrok.

---

## 📝 Cấu hình file ngrok.yml

File `ngrok.yml` đã được cấu hình sẵn với:

- **Tunnel name:** `go-server-api`
- **Port:** 3000
- **Protocol:** HTTP/HTTPS
- **Inspect:** Enabled (xem traffic tại http://127.0.0.1:4040)
- **Region:** ap (Asia Pacific)

### Tùy chỉnh config

Mở file `ngrok.yml` và chỉnh sửa:

```yaml
tunnels:
  go-server-api:
    addr: 3000              # Port của server
    proto: http             # Protocol
    inspect: true           # Enable web interface
    bind_tls: true          # Force HTTPS
    # domain: your-domain.ngrok.io  # Custom domain (paid account)
    # subdomain: go-server          # Custom subdomain (paid account)
```

### Multiple tunnels

Bạn có thể tạo nhiều tunnels:

```yaml
tunnels:
  api:
    addr: 3000
    proto: http
  websocket:
    addr: 3000
    proto: http
```

Chạy:
```bash
ngrok start --config ngrok.yml api websocket
```

---

## 🔧 Cập nhật BASE_URL trong Flutter app

Sau khi có public URL từ ngrok:

1. **Lấy public URL:**
   - Từ terminal output
   - Hoặc từ web interface: http://127.0.0.1:4040

2. **Cập nhật file `.env` trong Flutter app:**
   ```env
   BASE_URL=https://xxxx-xx-xx-xx-xx.ngrok-free.app
   ```

3. **Restart Flutter app**

---

## 🐛 Troubleshooting

### Lỗi: "authtoken is required"

```bash
# Cấu hình lại authtoken
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

### Lỗi: "port already in use"

```bash
# Kiểm tra port đang được sử dụng
lsof -i :3000

# Kill process nếu cần
kill -9 <PID>
```

### Lỗi: "tunnel session failed"

- Kiểm tra internet connection
- Kiểm tra server đang chạy: `curl http://localhost:3000/health`
- Thử restart ngrok

### URL thay đổi mỗi lần restart

- **Free account:** URL sẽ thay đổi mỗi lần restart
- **Paid account:** Có thể dùng custom domain/subdomain

### CORS errors

Ngrok config đã có sẵn CORS headers. Nếu vẫn gặp lỗi, kiểm tra:

1. Server CORS config trong `server.js`
2. Ngrok response headers trong `ngrok.yml`

---

## 📚 Tài liệu tham khảo

- **Ngrok Dashboard:** https://dashboard.ngrok.com
- **Ngrok Docs:** https://ngrok.com/docs
- **API Reference:** https://ngrok.com/docs/api

---

## 💡 Tips

1. **Sử dụng ngrok web interface** để debug requests/responses
2. **Lưu public URL** vào file `.env` để dễ dàng cập nhật
3. **Sử dụng script tự động** để tiết kiệm thời gian
4. **Kiểm tra logs** tại `/tmp/ngrok.log` nếu có vấn đề

---

## ⚠️ Lưu ý bảo mật

- **Chỉ dùng cho development/testing**
- **Không expose production server** qua ngrok
- **URL công khai** - ai có link đều truy cập được
- **Free account có rate limits**

---

## 🎯 Quick Start

```bash
# 1. Cài đặt ngrok
brew install ngrok/ngrok/ngrok

# 2. Cấu hình authtoken
ngrok config add-authtoken YOUR_AUTH_TOKEN

# 3. Cập nhật ngrok.yml với authtoken

# 4. Chạy server + ngrok
./scripts/start-ngrok-with-server.sh

# 5. Copy public URL và cập nhật Flutter app .env
```

---

**Happy tunneling! 🚇**

