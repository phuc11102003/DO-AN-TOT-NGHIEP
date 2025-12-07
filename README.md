# 🛒 Thu Mua Đồ Cũ - Nền tảng Mua Bán & Trao Đổi Đồ Cũ

**Phiên bản:** 1.0.0  
**Ngày cập nhật:** Tháng 1, 2025

Nền tảng e-commerce hiện đại cho phép người dùng mua bán, trao đổi đồ cũ một cách dễ dàng và an toàn.

---

## 📋 Mục Lục

- [Tính năng chính](#-tính-năng-chính)
- [Công nghệ sử dụng](#-công-nghệ-sử-dụng)
- [Cài đặt](#-cài-đặt)
- [Cấu hình](#-cấu-hình)
- [Cấu trúc dự án](#-cấu-trúc-dự-án)
- [API Documentation](#-api-documentation)
- [Tính năng nâng cao](#-tính-năng-nâng-cao)
- [Quy trình hoạt động](#-quy-trình-hoạt-động)
- [Tính năng bảo mật](#-tính-năng-bảo-mật)
- [Tính năng tự động của hệ thống](#-tính-năng-tự-động-của-hệ-thống)
- [Tối ưu hóa](#-tối-ưu-hóa)
- [Đóng góp](#-đóng-góp)
- [License](#-license)

---

## ✨ Tính năng chính

### 👥 Người dùng
- ✅ **Đăng ký/Đăng nhập** với JWT Authentication
- ✅ **Quản lý hồ sơ** cá nhân
- ✅ **Quên mật khẩu** với email reset
- ✅ **Đăng sản phẩm** với upload hình ảnh
- ✅ **Tìm kiếm & Lọc** sản phẩm theo danh mục, giá
- ✅ **Giỏ hàng & Thanh toán** (COD & VNPay)
- ✅ **Trao đổi sản phẩm** với người dùng khác
- ✅ **Đánh giá sản phẩm** (rating & review)
- ✅ **Chat AI** tư vấn sản phẩm
- ✅ **Quản lý đơn hàng** chi tiết
- ✅ **Tin nhắn** với người dùng khác
- ✅ **Xem thông báo** và đánh dấu đã đọc

### 👨‍💼 Admin
- ✅ **Dashboard** thống kê tổng quan
- ✅ **Quản lý người dùng** (khóa/mở khóa tài khoản)
- ✅ **Duyệt/Từ chối sản phẩm**
- ✅ **Quản lý đơn hàng**
- ✅ **Kiểm duyệt đánh giá**
- ✅ **Quản lý danh mục sản phẩm**
- ✅ **Thống kê doanh thu**

---

## 🛠️ Công nghệ sử dụng

### Frontend
- **React 19** - UI Framework
- **Material-UI (MUI)** - Component Library
- **React Router** - Routing
- **Axios** - HTTP Client
- **Framer Motion** - Animations
- **SweetAlert2** - Alerts

### Backend
- **Node.js** - Runtime
- **Express.js** - Web Framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Multer** - File Upload
- **Nodemailer** - Email Service
- **OpenAI API** - AI Chat
- **VNPay** - Payment Gateway

---

## 🚀 Cài đặt

### Yêu cầu
- Node.js >= 16.x
- MongoDB >= 4.x
- npm hoặc yarn

### Bước 1: Clone repository
```bash
git clone https://github.com/yourusername/thu-mua-do-cu.git
cd thu-mua-do-cu
```

### Bước 2: Cài đặt dependencies

**Backend:**
```bash
cd server
npm install
```

**Frontend:**
```bash
cd client
npm install
```

**Admin Panel:**
```bash
cd admin
npm install
```

### Bước 3: Cấu hình môi trường

Tạo file `.env` trong thư mục `server/`:
```env
# Database
MONGODB_URI=mongodb://localhost:27017/thumua

# JWT
JWT_SECRET=your-secret-key-here

# Server
PORT=5000
NODE_ENV=development

# Client URL
CLIENT_URL=http://localhost:3000

# Email Service (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# OpenAI API (Optional)
OPENAI_API_KEY=sk-your-openai-api-key

# VNPay (Optional)
VNPAY_TMN_CODE=your_tmn_code
VNPAY_HASH_SECRET=your_hash_secret
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
```

### Bước 4: Khởi động

**Backend:**
```bash
cd server
npm start
```

**Frontend:**
```bash
cd client
npm start
```

**Admin Panel:**
```bash
cd admin
npm start
```

---

## ⚙️ Cấu hình

### Email Service (Gmail)

1. Bật **2-Step Verification** trên Google Account
2. Tạo **App Password** tại [Google App Passwords](https://myaccount.google.com/apppasswords)
3. Sử dụng App Password (16 ký tự) cho `SMTP_PASS`

### VNPay

1. Đăng ký tài khoản VNPay Merchant
2. Lấy `TMN_CODE` và `HASH_SECRET`
3. Cấu hình trong `.env`

### OpenAI API

1. Đăng ký tại [OpenAI Platform](https://platform.openai.com)
2. Tạo API Key
3. Thêm vào `.env` (không bắt buộc - hệ thống có fallback mode)

---

## 📁 Cấu trúc dự án

```
thu-mua-do-cu/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── utils/          # Utilities
│   └── package.json
│
├── server/                 # Express Backend
│   ├── models/             # Mongoose models
│   ├── routes/             # API routes
│   ├── controllers/        # Business logic
│   ├── middleware/         # Custom middleware
│   ├── utils/              # Utilities
│   ├── uploads/            # Uploaded files
│   └── server.js           # Entry point
│
├── admin/                  # Admin Panel
│   ├── src/
│   │   ├── pages/          # Admin pages
│   │   └── components/     # Admin components
│   └── package.json
│
└── README.md
```

---

## 📡 API Documentation

### Authentication
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/me` - Lấy thông tin user (Auth)
- `PUT /api/auth/profile` - Cập nhật profile (Auth)
- `POST /api/auth/forgot-password` - Quên mật khẩu
- `POST /api/auth/reset-password` - Reset mật khẩu

### Products
- `GET /api/products` - Lấy danh sách sản phẩm
- `GET /api/products/:id` - Chi tiết sản phẩm
- `GET /api/products/mine` - Lấy sản phẩm của tôi (Auth)
- `POST /api/products/add` - Tạo sản phẩm (Auth)
- `DELETE /api/products/:id/confirm-delete` - Xóa sản phẩm (Auth)

### Orders
- `GET /api/orders/my-orders` - Lấy đơn hàng của user (Auth)
- `POST /api/orders` - Tạo đơn hàng (Auth)
- `GET /api/orders/:id` - Chi tiết đơn hàng (Auth)

### Reviews
- `GET /api/reviews/product/:productId` - Lấy reviews sản phẩm
- `POST /api/reviews` - Tạo review (Auth)
- `PUT /api/reviews/:id` - Cập nhật review (Auth)
- `DELETE /api/reviews/:id` - Xóa review (Auth)
- `POST /api/reviews/:id/helpful` - Đánh dấu review hữu ích (Auth)

### Payments
- `POST /api/payments/create` - Tạo URL thanh toán VNPay (Auth)
- `GET /api/payments/return` - Xử lý kết quả thanh toán từ VNPay
- `POST /api/payments/ipn` - Webhook từ VNPay (IPN - Instant Payment Notification)

### AI Chat
- `POST /api/ai/chat` - Chat với AI (Auth)
- `POST /api/ai/chat/guest` - Chat với AI (Guest)
- `GET /api/ai/history` - Lịch sử chat (Auth)

### Notifications
- `GET /api/notifications` - Lấy danh sách thông báo (Auth)
- `PATCH /api/notifications/:id/read` - Đánh dấu đã đọc (Auth)
- `PATCH /api/notifications/read-all` - Đánh dấu tất cả đã đọc (Auth)
- `GET /api/notifications/unread-count` - Số lượng thông báo chưa đọc (Auth)

### Exchanges (Trao đổi sản phẩm)
- `POST /api/exchanges/propose` - Gửi đề xuất trao đổi (Auth)
- `GET /api/exchanges/my-offers` - Lấy đề xuất trao đổi của tôi (Auth)
- `PUT /api/exchanges/:id/respond` - Phản hồi đề xuất (chấp nhận/từ chối) (Auth)
- `GET /api/exchanges/available-products` - Lấy sản phẩm có thể trao đổi (Auth)

### Messages (Tin nhắn)
- `GET /api/messages/conversations` - Lấy danh sách conversations (Auth)
- `GET /api/messages/conversation/:userId` - Lấy hoặc tạo conversation (Auth)
- `GET /api/messages/conversation/:conversationId/messages` - Lấy messages của conversation (Auth)
- `POST /api/messages/conversation/:conversationId/messages` - Gửi message (Auth)
- `GET /api/messages/unread-count` - Số lượng tin nhắn chưa đọc (Auth)

### Admin APIs
- `GET /api/admin/stats` - Thống kê tổng quan (Admin)
- `GET /api/admin/users` - Danh sách users (Admin)
- `GET /api/admin/users/:id` - Chi tiết user (Admin)
- `POST /api/admin/users` - Tạo user mới (Admin)
- `PUT /api/admin/users/:id` - Cập nhật user (Admin) - Bao gồm khóa/mở khóa
- `DELETE /api/admin/users/:id` - Xóa user (Admin)
- `GET /api/admin/products` - Danh sách sản phẩm (Admin)
- `GET /api/admin/products/pending` - Sản phẩm chờ duyệt (Admin)
- `GET /api/admin/products/:id` - Chi tiết sản phẩm (Admin)
- `PATCH /api/admin/products/:id/approve` - Duyệt sản phẩm (Admin)
- `PATCH /api/admin/products/:id/reject` - Từ chối sản phẩm (Admin)
- `PUT /api/admin/products/:id` - Cập nhật sản phẩm (Admin)
- `DELETE /api/admin/products/:id` - Xóa sản phẩm (Admin)
- `GET /api/admin/products/stats` - Thống kê sản phẩm (Admin)
- `GET /api/admin/orders` - Danh sách đơn hàng (Admin)
- `GET /api/admin/orders/stats` - Thống kê đơn hàng (Admin)
- `GET /api/admin/orders/:id` - Chi tiết đơn hàng (Admin)
- `PATCH /api/admin/orders/:id/status` - Cập nhật trạng thái đơn hàng (Admin)

---

## 🎯 Tính năng nâng cao

### AI Chatbox
- Tư vấn sản phẩm tự động
- Tìm kiếm sản phẩm qua chat
- Hỗ trợ khách không đăng nhập
- Lưu lịch sử chat
- Hiển thị sản phẩm trong chat với khả năng click xem chi tiết

### Hệ thống tin nhắn
- Chat real-time với người dùng khác
- Tạo conversation tự động
- Đếm số tin nhắn chưa đọc
- Lịch sử tin nhắn
- Đánh dấu tin nhắn đã đọc

### Trao đổi sản phẩm
- Gửi đề xuất trao đổi sản phẩm
- Xem danh sách đề xuất (gửi đi và nhận về)
- Chấp nhận/từ chối đề xuất
- Tự động tạo thông báo khi có đề xuất mới
- Tự động cập nhật số lượng trao đổi của sản phẩm

### Hệ thống đánh giá
- Rating 1-5 sao
- Bình luận sản phẩm
- Tính rating trung bình tự động
- Đánh dấu review hữu ích

### Thanh toán trực tuyến
- Tích hợp VNPay
- Thanh toán COD
- Xác thực giao dịch bảo mật

### Email Service
- Email chào mừng đăng ký
- Email reset password
- Email xác nhận đơn hàng
- Email thông báo trao đổi

### Hệ thống thông báo
- Thông báo real-time cho người dùng
- Thông báo sản phẩm được duyệt/từ chối
- Thông báo trao đổi sản phẩm
- Thông báo đơn hàng
- Đếm số thông báo chưa đọc
- Đánh dấu đã đọc/đã đọc tất cả

### Lịch sử giao dịch
- Lưu trữ toàn bộ lịch sử đơn hàng
- Theo dõi trạng thái đơn hàng chi tiết
- Lịch sử thanh toán
- Lịch sử trao đổi sản phẩm
- Xem chi tiết từng giao dịch

### Quản lý danh mục (Admin)
- Xem danh sách danh mục sản phẩm
- Thống kê sản phẩm theo danh mục
- Lọc sản phẩm theo danh mục
- Quản lý danh mục trong quá trình duyệt sản phẩm

### Kiểm duyệt đánh giá (Admin)
- Xem tất cả đánh giá của người dùng
- Xóa đánh giá không phù hợp
- Quản lý đánh giá spam/giả mạo
- Kiểm soát chất lượng đánh giá

### Khóa/Mở khóa User (Admin)
- Khóa tài khoản người dùng vi phạm
- Mở khóa tài khoản
- Quản lý trạng thái hoạt động của user (isActive)
- Tự động từ chối đăng nhập khi tài khoản bị khóa
- Xem chi tiết user trước khi khóa

### Quản lý sản phẩm (Admin)
- Xem tất cả sản phẩm với bộ lọc
- Xem chi tiết sản phẩm
- Cập nhật thông tin sản phẩm
- Xóa sản phẩm
- Thống kê sản phẩm theo danh mục
- Xem trạng thái đổi trả của sản phẩm

### Quản lý đơn hàng (Admin)
- Xem tất cả đơn hàng với tìm kiếm và lọc
- Xem chi tiết đơn hàng
- Cập nhật trạng thái đơn hàng
- Thống kê đơn hàng và doanh thu
- Theo dõi thanh toán

---

## 🔄 Quy trình hoạt động

### Quy trình mua bán

1. **Tìm kiếm sản phẩm**
   - Người dùng tìm kiếm sản phẩm theo từ khóa, danh mục, giá
   - Xem danh sách sản phẩm với bộ lọc
   - Xem chi tiết sản phẩm, đánh giá, hình ảnh

2. **Thêm vào giỏ hàng**
   - Chọn sản phẩm và số lượng
   - Thêm vào giỏ hàng
   - Xem và chỉnh sửa giỏ hàng

3. **Thanh toán**
   - Chọn phương thức thanh toán (COD hoặc VNPay)
   - Nhập thông tin giao hàng
   - Xác nhận đơn hàng

4. **Xử lý đơn hàng**
   - Admin xác nhận đơn hàng
   - Cập nhật trạng thái: confirmed → shipping → completed
   - Gửi email thông báo cho khách hàng

5. **Hoàn tất**
   - Khách hàng nhận hàng
   - Đánh giá sản phẩm
   - Đơn hàng chuyển sang trạng thái "completed"

### Quy trình thanh toán

#### Thanh toán COD (Cash on Delivery)
1. Khách hàng chọn phương thức COD
2. Đơn hàng được tạo với trạng thái "pending"
3. Admin xác nhận đơn hàng
4. Giao hàng và thu tiền mặt
5. Cập nhật trạng thái đơn hàng

#### Thanh toán VNPay
1. Khách hàng chọn phương thức VNPay
2. Hệ thống tạo URL thanh toán VNPay
3. Khách hàng chuyển hướng đến cổng thanh toán
4. Thực hiện thanh toán trên VNPay
5. VNPay gửi kết quả về hệ thống (IPN)
6. Hệ thống xác thực và cập nhật trạng thái thanh toán
7. Tự động xác nhận đơn hàng nếu thanh toán thành công

### Quy trình đánh giá

1. **Điều kiện đánh giá**
   - Chỉ người đã mua sản phẩm mới có thể đánh giá (verified review)
   - Người chưa mua vẫn có thể đánh giá nhưng không có badge "Đã mua hàng"

2. **Tạo đánh giá**
   - Chọn số sao (1-5)
   - Viết nhận xét
   - Có thể thêm hình ảnh (tùy chọn)
   - Gửi đánh giá

3. **Kiểm duyệt (Admin)**
   - Admin có thể xem tất cả đánh giá
   - Xóa đánh giá không phù hợp
   - Quản lý chất lượng đánh giá

4. **Hiển thị**
   - Đánh giá được hiển thị công khai
   - Tính rating trung bình tự động
   - Người dùng khác có thể đánh dấu "Hữu ích"

5. **Cập nhật**
   - Rating trung bình tự động cập nhật khi có đánh giá mới
   - Số lượng đánh giá được cập nhật real-time

---

## 🔒 Tính năng bảo mật

### Authentication & Authorization
- **JWT Token**: Xác thực người dùng bằng JWT token
- **Password Hashing**: Mật khẩu được hash bằng bcrypt
- **Token Expiration**: Token có thời hạn 7 ngày
- **Role-based Access**: Phân quyền user/admin
- **Middleware Protection**: Tất cả API quan trọng đều được bảo vệ

### Data Protection
- **Input Validation**: Kiểm tra dữ liệu đầu vào
- **SQL Injection Prevention**: Sử dụng Mongoose ODM
- **XSS Protection**: Sanitize dữ liệu đầu vào
- **CORS Configuration**: Chỉ cho phép domain được phép
- **File Upload Security**: Giới hạn kích thước và loại file

### User Account Security
- **Account Lock**: Admin có thể khóa tài khoản vi phạm
- **Password Reset**: Reset mật khẩu qua email với token có thời hạn
- **Email Verification**: Xác thực email khi đăng ký (tùy chọn)
- **Session Management**: Quản lý phiên đăng nhập

### Payment Security
- **VNPay Integration**: Thanh toán qua cổng bảo mật VNPay
- **Transaction Verification**: Xác thực giao dịch từ VNPay
- **Payment Logging**: Ghi log tất cả giao dịch
- **Secure Hash**: Sử dụng hash để xác thực callback từ VNPay

---

## 🤖 Tính năng tự động của hệ thống

### Tự động hóa đơn hàng
- **Tự động tạo mã đơn hàng**: Mã đơn hàng duy nhất được tạo tự động
- **Tự động cập nhật trạng thái**: Khi thanh toán thành công, đơn hàng tự động chuyển sang "confirmed"
- **Tự động gửi email**: Email xác nhận đơn hàng được gửi tự động

### Tự động hóa sản phẩm
- **Tự động tính rating**: Rating trung bình được tính tự động khi có đánh giá mới
- **Tự động cập nhật số lượng review**: Số lượng đánh giá được cập nhật real-time
- **Tự động tạo thông báo**: Thông báo được tạo tự động khi sản phẩm được duyệt/từ chối

### Tự động hóa thông báo
- **Thông báo sản phẩm**: Tự động tạo thông báo khi sản phẩm được duyệt/từ chối
- **Thông báo trao đổi**: Tự động tạo thông báo khi có đề xuất trao đổi
- **Thông báo đơn hàng**: Tự động tạo thông báo khi đơn hàng thay đổi trạng thái

### Tự động hóa đánh giá
- **Xác thực đánh giá**: Tự động kiểm tra xem người dùng đã mua sản phẩm chưa
- **Cập nhật rating**: Tự động tính và cập nhật rating trung bình
- **Đánh dấu verified**: Tự động đánh dấu đánh giá từ người đã mua hàng

### Tự động hóa admin
- **Tạo admin mặc định**: Tự động tạo tài khoản admin khi khởi động server lần đầu
- **Thống kê tự động**: Dashboard tự động cập nhật thống kê
- **Logging**: Tự động ghi log các hoạt động quan trọng

---

## ⚡ Tối ưu hóa

### Đã thực hiện
- ✅ Lazy loading images
- ✅ Code splitting
- ✅ Image optimization
- ✅ ProductCard kích thước đồng đều
- ✅ Xóa unused imports
- ✅ Tối ưu useEffect dependencies

### Khuyến nghị
- React.memo cho components
- useMemo và useCallback
- Virtual scrolling
- Service Worker (PWA)
- CDN cho images

---

## 📊 Mức độ hoàn thành

| Phần | Hoàn thành |
|------|-----------|
| Frontend (Client) | 90% |
| Frontend (Admin) | 85% |
| Backend API | 90% |
| Database | 95% |
| AI Chat | 80% |
| Tối ưu hóa | 75% |
| **Tổng thể** | **85%** |

---

## 🤝 Đóng góp

Mọi đóng góp đều được chào đón! Vui lòng:

1. Fork dự án
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

---

## 📝 License

Dự án này được phân phối dưới giấy phép MIT. Xem file `LICENSE` để biết thêm chi tiết.

---

## 📞 Liên hệ

- **Email:** support@thumua.com
- **Website:** https://thumua.com
- **GitHub:** https://github.com/yourusername/thu-mua-do-cu

---

**Made with ❤️ by Thú Mua Đồ Cũ Team**

# DO-AN-TOT-NGHIEP
