# 🔒 Environment Variables Setup Guide

## ⚠️ QUAN TRỌNG - BẢO MẬT

**KHÔNG BAO GIỜ COMMIT FILE `.env` LÊN GIT!**

File `.env` chứa thông tin nhạy cảm như:
- Database passwords
- API keys
- JWT secrets
- Payment credentials

---

## 📁 Cấu trúc File .env

Dự án có 2 file `.env`:

```
KLTN_NH/
├── backend/.env          # Backend environment variables
└── frontend/.env         # Frontend environment variables
```

---

## 🚀 Hướng Dẫn Setup

### **1. Backend Setup**

```bash
# Di chuyển vào thư mục backend
cd backend

# Copy file template
cp .env.example .env

# Sửa file .env với thông tin thực tế
# Dùng VS Code hoặc text editor bất kỳ
code .env
```

**Cần điền:**
- `DB_PASSWORD`: Mật khẩu MySQL của bạn
- `JWT_SECRET`: Tạo chuỗi random (dùng https://randomkeygen.com/)
- `OPENAI_API_KEY`: Nếu dùng chatbot (không bắt buộc)
- `VIETQR_*`: Thông tin tài khoản ngân hàng (cho QR thanh toán)

### **2. Frontend Setup**

```bash
# Di chuyển vào thư mục frontend
cd frontend

# Copy file template
cp .env.example .env

# Kiểm tra URL có đúng không
code .env
```

**Cần kiểm tra:**
- `REACT_APP_API_URL`: Phải trỏ đúng backend server (default: http://localhost:8000/api)
- `FRONTEND_URL`: URL của frontend (default: http://localhost:3000)

---

## 🔧 Ví Dụ Cấu Hình

### **Backend .env**

```bash
PORT=8000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_actual_password    # ← Điền mật khẩu thật
DB_NAME=kltn_nhahang

JWT_SECRET=a1b2c3d4e5f6g7h8i9j0    # ← Tạo chuỗi random
OPENAI_API_KEY=sk-...               # ← API key OpenAI (optional)

VIETQR_ACCOUNT_NO=1234567890
VIETQR_ACCOUNT_NAME=NGUYEN VAN A
VIETQR_BANK_CODE=970415
```

### **Frontend .env**

```bash
REACT_APP_API_URL=http://localhost:8000/api
FRONTEND_URL=http://localhost:3000
```

---

## ✅ Verify Setup

### **1. Kiểm tra Backend**

```bash
cd backend
npm start
# Nếu thành công, sẽ thấy: "Server running on port 8000"
```

### **2. Kiểm tra Frontend**

```bash
cd frontend
npm start
# Nếu thành công, browser sẽ mở http://localhost:3000
```

---

## 🔐 Bảo Mật

### **File .gitignore đã được cấu hình:**

```gitignore
# Root .gitignore
.env
*.env

# Backend .gitignore
.env

# Frontend .gitignore
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
```

### **Kiểm tra file .env KHÔNG bị track:**

```bash
# Chạy lệnh này ở root project
git ls-files | Select-String ".env"

# Kết quả phải RỖNG (không có file .env nào)
# Nếu có, chạy:
git rm --cached backend/.env
git rm --cached frontend/.env
git commit -m "Remove .env files from git tracking"
```

---

## 🚨 Nếu Đã Commit .env Lên Git

### **Cách khắc phục:**

```bash
# 1. Xóa khỏi git tracking (file vẫn còn local)
git rm --cached backend/.env
git rm --cached frontend/.env

# 2. Commit thay đổi
git add .gitignore backend/.env.example frontend/.env.example
git commit -m "chore: Remove .env files and add .env.example templates"

# 3. Push lên remote
git push origin main

# 4. ⚠️ QUAN TRỌNG: Đổi lại tất cả secrets đã lộ
# - Đổi mật khẩu database
# - Tạo lại JWT_SECRET
# - Revoke và tạo lại API keys
# - Đổi thông tin thanh toán
```

### **Xóa khỏi Git History (nếu cần):**

```bash
# ⚠️ Nguy hiểm - làm thay đổi history
# Chỉ dùng nếu chưa ai pull code

# Option 1: BFG Repo-Cleaner (recommended)
java -jar bfg.jar --delete-files .env
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Option 2: git filter-branch
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch backend/.env frontend/.env' \
  --prune-empty --tag-name-filter cat -- --all
```

---

## 📚 Resources

- [dotenv Documentation](https://github.com/motdotla/dotenv)
- [Create React App Environment Variables](https://create-react-app.dev/docs/adding-custom-environment-variables/)
- [12-Factor App Config](https://12factor.net/config)
- [Git Secrets](https://github.com/awslabs/git-secrets)

---

## 🆘 Troubleshooting

### **Lỗi: "Cannot find module dotenv"**
```bash
cd backend
npm install dotenv
```

### **Lỗi: "REACT_APP_API_URL is undefined"**
- Đảm bảo biến bắt đầu với `REACT_APP_`
- Restart development server sau khi sửa .env
- Check file .env có trong thư mục `frontend/`

### **Lỗi: "Access denied for user"**
- Check `DB_PASSWORD` trong backend/.env
- Verify MySQL user có quyền truy cập database

---

## 📞 Liên Hệ

Nếu gặp vấn đề, liên hệ team leader hoặc tạo issue trên GitHub.

---

**Last Updated:** November 12, 2025  
**Version:** 1.0
