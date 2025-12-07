// server/utils/emailService.js
const nodemailer = require('nodemailer');

// Tạo transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

// Email templates
const emailTemplates = {
  // Email xác nhận đăng ký
  welcome: (name) => ({
    subject: 'Chào mừng đến với Thú Mua Đồ Cũ!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Chào mừng đến với Thú Mua Đồ Cũ!</h1>
          </div>
          <div class="content">
            <p>Xin chào <strong>${name}</strong>,</p>
            <p>Cảm ơn bạn đã đăng ký tài khoản tại <strong>Thú Mua Đồ Cũ</strong>!</p>
            <p>Bây giờ bạn có thể:</p>
            <ul>
              <li>✅ Mua sắm các sản phẩm đồ cũ chất lượng</li>
              <li>✅ Đăng bán sản phẩm của bạn</li>
              <li>✅ Trao đổi sản phẩm với người khác</li>
              <li>✅ Nhận thông báo về đơn hàng và trao đổi</li>
            </ul>
            <p>Chúc bạn có trải nghiệm mua sắm tuyệt vời!</p>
            <div style="text-align: center;">
              <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}" class="button">Truy cập website</a>
            </div>
          </div>
          <div class="footer">
            <p>© 2025 Thú Mua Đồ Cũ. All rights reserved.</p>
            <p>Email này được gửi tự động, vui lòng không trả lời.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  // Email reset password
  resetPassword: (name, resetToken) => ({
    subject: 'Đặt lại mật khẩu - Thú Mua Đồ Cũ',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #f5576c; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Đặt lại mật khẩu</h1>
          </div>
          <div class="content">
            <p>Xin chào <strong>${name}</strong>,</p>
            <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
            <p>Nhấp vào nút bên dưới để đặt lại mật khẩu:</p>
            <div style="text-align: center;">
              <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}" class="button">Đặt lại mật khẩu</a>
            </div>
            <div class="warning">
              <p><strong>⚠️ Lưu ý:</strong></p>
              <ul>
                <li>Link này chỉ có hiệu lực trong 1 giờ</li>
                <li>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này</li>
                <li>Để bảo mật, không chia sẻ link này với bất kỳ ai</li>
              </ul>
            </div>
            <p>Nếu nút không hoạt động, bạn có thể copy và paste link sau vào trình duyệt:</p>
            <p style="word-break: break-all; color: #667eea;">${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}</p>
          </div>
          <div class="footer">
            <p>© 2025 Thú Mua Đồ Cũ. All rights reserved.</p>
            <p>Email này được gửi tự động, vui lòng không trả lời.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  // Email xác nhận đơn hàng
  orderConfirmation: (name, orderNumber, orderDetails) => ({
    subject: `Xác nhận đơn hàng #${orderNumber} - Thú Mua Đồ Cũ`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .order-info { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .order-item { padding: 10px; border-bottom: 1px solid #eee; }
          .total { font-size: 18px; font-weight: bold; color: #11998e; margin-top: 20px; }
          .button { display: inline-block; padding: 12px 30px; background: #11998e; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Đơn hàng của bạn đã được xác nhận!</h1>
            <p>Mã đơn hàng: <strong>#${orderNumber}</strong></p>
          </div>
          <div class="content">
            <p>Xin chào <strong>${name}</strong>,</p>
            <p>Cảm ơn bạn đã đặt hàng tại <strong>Thú Mua Đồ Cũ</strong>!</p>
            <div class="order-info">
              <h3>Chi tiết đơn hàng:</h3>
              ${orderDetails.items.map(item => `
                <div class="order-item">
                  <strong>${item.title}</strong><br>
                  Số lượng: ${item.quantity} x ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}
                </div>
              `).join('')}
              <div class="total">
                Tổng cộng: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(orderDetails.totalAmount)}
              </div>
            </div>
            <p>Chúng tôi sẽ xử lý đơn hàng của bạn trong thời gian sớm nhất.</p>
            <p>Bạn có thể theo dõi trạng thái đơn hàng trong tài khoản của mình.</p>
            <div style="text-align: center;">
              <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/my-orders" class="button">Xem đơn hàng</a>
            </div>
          </div>
          <div class="footer">
            <p>© 2025 Thú Mua Đồ Cũ. All rights reserved.</p>
            <p>Email này được gửi tự động, vui lòng không trả lời.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  // Email thông báo trao đổi
  exchangeNotification: (name, exchangeDetails) => ({
    subject: `Thông báo trao đổi sản phẩm - Thú Mua Đồ Cũ`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #fa709a; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔄 Thông báo trao đổi sản phẩm</h1>
          </div>
          <div class="content">
            <p>Xin chào <strong>${name}</strong>,</p>
            <p>${exchangeDetails.message}</p>
            <div style="text-align: center;">
              <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/exchange" class="button">Xem chi tiết</a>
            </div>
          </div>
          <div class="footer">
            <p>© 2025 Thú Mua Đồ Cũ. All rights reserved.</p>
            <p>Email này được gửi tự động, vui lòng không trả lời.</p>
          </div>
        </div>
      </body>
      </html>
    `
  })
};

// Hàm gửi email
const sendEmail = async (to, templateName, data) => {
  try {
    // Kiểm tra nếu không có cấu hình email, bỏ qua (development mode)
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return { success: true, message: 'Email service chưa được cấu hình' };
    }

    const transporter = createTransporter();
    const template = emailTemplates[templateName](...data);

    const mailOptions = {
      from: `"Thú Mua Đồ Cũ" <${process.env.SMTP_USER}>`,
      to: to,
      subject: template.subject,
      html: template.html
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Lỗi gửi email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendEmail,
  emailTemplates
};

