# Expense Tracker

Ứng dụng theo dõi chi tiêu cá nhân (vanilla JS) — thêm, phân loại, chỉnh sửa, xóa, lọc và biểu đồ.

## Tính năng
- Thêm chi tiêu (mô tả + số tiền + loại).
- Chỉnh sửa / xóa từng khoản.
- Xóa toàn bộ.
- Lọc theo loại / thời gian (hôm nay, tháng này).
- Biểu đồ (Chart.js) hiển thị tỷ lệ theo loại.
- Export CSV (dữ liệu theo bộ lọc).
- Lưu dữ liệu bằng **localStorage** → hỗ trợ offline.
- (Tùy chọn) PWA: manifest + service worker để cache assets, có thể thêm vào màn hình chính.

## Cấu trúc project
expense-tracker/
├── index.html
├── style.css
├── app.js
├── manifest.json
├── service-worker.js
└── README.md
## Chạy local
1. Mở `index.html` trực tiếp hoặc dùng HTTP server:
```bash
# trong thư mục project
python -m http.server 8000
# rồi vào http://localhost:8000
2. Hoặc dùng VS Code + Live Server.