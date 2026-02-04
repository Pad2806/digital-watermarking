# Watermark Pad - Digital Watermarking Tool

**Watermark Pad** là một ứng dụng web hiện đại, hiệu suất cao giúp người dùng đóng dấu (watermark) văn bản hoặc logo lên hình ảnh một cách nhanh chóng và chuyên nghiệp. Ứng dụng tập trung vào trải nghiệm người dùng mượt mà, hỗ trợ xử lý hàng loạt và tích hợp lưu trữ đám mây.

---

## Tính năng nổi bật

- **Xử lý hình ảnh hàng loạt**: Tải lên nhiều ảnh và áp dụng watermark cho tất cả cùng lúc.
- **Hai chế độ xử lý**:
  - **Client-side (Canvas)**: Xử lý trực tiếp trên trình duyệt, đảm bảo quyền riêng tư và hiển thị Font chữ chính xác 100% như bản preview.
  - **Server-side (Sharp)**: Xử lý phía máy chủ cho các tác vụ cần hiệu năng cao (Legacy support).
- **Tùy biến đa dạng**:
  - Đóng dấu Văn bản: Chỉnh font, cỡ chữ, màu sắc, độ đậm nhạt, độ mờ.
  - Đóng dấu Logo: Tải logo cá nhân, thay đổi tỷ lệ (scale), tự động xóa nền trắng, đổi màu logo.
  - Chế độ hiển thị: Đóng dấu đơn (Single) hoặc lặp lại (Tile) trên toàn bộ ảnh.
  - Biến đổi: Xoay ảnh, điều chỉnh vị trí (offset) linh hoạt.
- **Tích hợp Đám mây**: Hỗ trợ nhập ảnh trực tiếp từ **Google Drive** và **Dropbox**.
- **Xuất file nhanh chóng**: Đóng gói tất cả ảnh đã xử lý vào một file ZIP duy nhất.

---

## Công nghệ sử dụng

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Ngôn ngữ**: [TypeScript](https://www.typescriptlang.org/)
- **Quản lý State**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/), [Shadcn/UI](https://ui.shadcn.com/)
- **Xử lý hình ảnh**: 
  - Browser HTML5 Canvas API (Client)
  - [Sharp](https://sharp.pixelplumbing.com/) (Server)
- **Tiện ích**: 
  - [JSZip](https://stuk.github.io/jszip/) & [FileSaver](https://github.com/eligrey/FileSaver.js/) (Nén và tải file)
  - [Lucide React](https://lucide.dev/) (Icons)

---

## Cấu trúc dự án

```text
digital_watermark/
├── app/                    # Next.js App Router
│   ├── api/                # Các route API (Watermark, Proxy ảnh)
│   ├── globals.css         # Cấu hình Tailwind và CSS toàn cục
│   ├── layout.tsx          # Root layout & cấu hình Google Fonts
│   └── page.tsx            # Trang chủ và giao diện chính
├── components/             # Reusable UI Components
│   ├── ui/                 # Các component nguyên tử từ Shadcn/UI
│   ├── upload-zone.tsx     # Khu vực tải ảnh (Local/Drive/Dropbox)
│   ├── watermark-canvas.tsx# Preview watermark trực quan
│   ├── watermark-controls.tsx # Bảng điều chỉnh thông số
│   └── watermark-tool.tsx  # Logic chính điều phối toàn bộ công cụ
├── lib/                    # Các hàm tiện ích và logic nghiệp vụ
│   ├── client-processor.ts # Xử lý đóng dấu phía trình duyệt (Khuyên dùng)
│   ├── watermark-service.ts# Dịch vụ xử lý ảnh phía server (Sharp)
│   ├── watermark-utils.ts  # Tính toán vị trí, lưới (grid) cho Tile mode
│   └── watermark-types.ts  # Định nghĩa Type cho cấu hình Watermark
├── store/                  # Quản lý trạng thái ứng dụng
│   └── watermark-store.ts  # Zustand store cho ảnh và config
└── public/                 # Tài nguyên tĩnh (Icons, Logos)
```

---

## Cách chạy dự án

### 1. Yêu cầu hệ thống
- **Node.js**: 18.x trở lên
- **Trình quản lý gói**: npm, yarn hoặc pnpm

### 2. Cài đặt

```bash
# Clone dự án
git clone https://github.com/Pad2806/digital-watermarking.git

# Di chuyển vào thư mục dự án
cd digital_watermark

# Cài đặt các thư viện
npm install
```

### 3. Chạy môi trường phát triển

```bash
npm run dev
```

Mở trình duyệt và truy cập: [http://localhost:3000](http://localhost:3000)

### 4. Build để triển khai (Production)

```bash
npm run build
npm run start
```

---

## Quyền riêng tư

Ứng dụng ưu tiên xử lý ảnh ngay tại trình duyệt của người dùng (Client-side). Hình ảnh sau khi tải lên không nhất thiết phải gửi về máy chủ, giúp bảo mật dữ liệu cá nhân tối đa và tăng tốc độ xử lý khi không phụ thuộc vào đường truyền internet.

---

Được phát triển bởi [**@Pad2806**](https://github.com/Pad2806)
