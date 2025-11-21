#!/bin/bash

# Script để khởi động ngrok với cấu hình nâng cao
# Usage: ./scripts/start-ngrok.sh [tunnel-name]

# Màu sắc cho output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Đường dẫn đến file config
CONFIG_FILE="$(dirname "$0")/../ngrok.yml"

echo -e "${GREEN}🚀 Starting ngrok tunnel...${NC}"

# Kiểm tra ngrok đã được cài đặt chưa
if ! command -v ngrok &> /dev/null; then
    echo -e "${RED}❌ ngrok is not installed!${NC}"
    echo -e "${YELLOW}Install ngrok: brew install ngrok/ngrok/ngrok${NC}"
    exit 1
fi

# Kiểm tra file config
if [ ! -f "$CONFIG_FILE" ]; then
    echo -e "${RED}❌ Config file not found: $CONFIG_FILE${NC}"
    exit 1
fi

# Kiểm tra authtoken đã được cấu hình chưa
if grep -q "YOUR_AUTH_TOKEN_HERE" "$CONFIG_FILE"; then
    echo -e "${YELLOW}⚠️  Warning: Please update YOUR_AUTH_TOKEN_HERE in ngrok.yml${NC}"
    echo -e "${YELLOW}Get your authtoken from: https://dashboard.ngrok.com/get-started/your-authtoken${NC}"
    read -p "Do you want to continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Kiểm tra server đang chạy chưa (chỉ cảnh báo, không bắt buộc)
if ! lsof -Pi :5001 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${YELLOW}⚠️  Warning: Server is not running on port 5001${NC}"
    echo -e "${YELLOW}Please start your server first: npm run dev${NC}"
    echo -e "${YELLOW}Continuing anyway...${NC}"
fi

# Lấy tunnel name từ argument hoặc dùng default
TUNNEL_NAME=${1:-go-server-api}

echo -e "${GREEN}📡 Starting tunnel: ${TUNNEL_NAME}${NC}"
echo -e "${GREEN}🌐 Web Interface: http://127.0.0.1:4040${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
echo ""

# Chạy ngrok với config file (log sẽ hiển thị trực tiếp trong terminal)
# Log debug sẽ được ghi vào file /tmp/ngrok.log theo config trong ngrok.yml
ngrok start --config "$CONFIG_FILE" "$TUNNEL_NAME"

