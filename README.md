# Kho Văn bản QPPL

Web app (PWA) lưu trữ & tra cứu **văn bản quy phạm pháp luật**, dùng chung nhiều người. Cài được như ứng dụng trên Windows và điện thoại.

**Link:** https://neo-era.github.io/vbqppl/

## Tính năng
- Nạp PDF/DOCX → tự bóc toàn văn; nhập/sửa thông tin phân loại (số hiệu, loại, cơ quan, ngày, lĩnh vực, trạng thái hiệu lực)
- Tra cứu toàn văn tiếng Việt **có hoặc không dấu**, tìm theo từng phần số hiệu (vd `2023`, `NĐ-CP`), tô sáng chỗ khớp
- Lọc theo loại / trạng thái / cơ quan / lĩnh vực / khoảng ngày; xuất danh mục đã lọc ra Excel
- Theo dõi hiệu lực, liên kết văn bản thay thế / sửa đổi / dẫn chiếu
- Xem PDF ngay trong app; ghi chú + đánh dấu riêng từng người
- Phân quyền: **Quản trị** (người đăng ký đầu tiên) · **Biên tập** · **Xem**

## Kiến trúc
- Frontend: React + Vite + TypeScript, PWA (vite-plugin-pwa)
- Backend: Supabase project `vbqppl` (Postgres + full-text `tsvector` không dấu, Storage bucket `vanban`, Auth, RLS)
- Deploy: GitHub Actions → GitHub Pages (mỗi lần push `main` là tự build, test, deploy)

## Chạy & kiểm thử
```bash
npm ci
npm test          # unit test (vitest)
npm run dev       # chạy thử local
npm run build     # build ra dist/ (BASE_PATH=/vbqppl/ cho GitHub Pages)
```
