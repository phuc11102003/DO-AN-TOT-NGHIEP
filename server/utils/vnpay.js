// server/utils/vnpay.js
const crypto = require('crypto');
const querystring = require('querystring');

class VNPay {
  constructor() {
    this.tmnCode = process.env.VNPAY_TMN_CODE || '';
    this.hashSecret = process.env.VNPAY_HASH_SECRET || '';
    this.url = process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    this.returnUrl = process.env.VNPAY_RETURN_URL || 'http://localhost:3000/payment/return';
  }

  // Tạo URL thanh toán
  createPaymentUrl(orderInfo) {
    const {
      orderId,
      amount,
      orderDescription,
      orderType = 'other',
      locale = 'vn',
      ipAddr = '127.0.0.1'
    } = orderInfo;

    const date = new Date();
    const createDate = this.formatDate(date);
    const expireDate = this.formatDate(new Date(date.getTime() + 15 * 60 * 1000)); // 15 phút

    const vnp_Params = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: this.tmnCode,
      vnp_Locale: locale,
      vnp_CurrCode: 'VND',
      vnp_TxnRef: orderId,
      vnp_OrderInfo: orderDescription,
      vnp_OrderType: orderType,
      vnp_Amount: amount * 100, // VNPay yêu cầu số tiền nhân 100
      vnp_ReturnUrl: this.returnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate,
      vnp_ExpireDate: expireDate
    };

    // Sắp xếp params theo thứ tự alphabet
    const sortedParams = this.sortObject(vnp_Params);
    
    // Tạo query string
    const queryString = querystring.stringify(sortedParams, { encode: false });
    
    // Tạo secure hash
    const hmac = crypto.createHmac('sha512', this.hashSecret);
    const signed = hmac.update(new Buffer(queryString, 'utf-8')).digest('hex');
    
    // Thêm secure hash vào params
    vnp_Params['vnp_SecureHash'] = signed;
    
    // Tạo URL thanh toán
    const paymentUrl = this.url + '?' + querystring.stringify(vnp_Params, { encode: false });
    
    return paymentUrl;
  }

  // Xác thực kết quả thanh toán
  verifyReturnUrl(vnp_Params) {
    const secureHash = vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    // Sắp xếp params
    const sortedParams = this.sortObject(vnp_Params);
    
    // Tạo query string
    const queryString = querystring.stringify(sortedParams, { encode: false });
    
    // Tạo secure hash
    const hmac = crypto.createHmac('sha512', this.hashSecret);
    const signed = hmac.update(new Buffer(queryString, 'utf-8')).digest('hex');
    
    // So sánh hash
    return secureHash === signed;
  }

  // Format ngày theo định dạng VNPay
  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  // Sắp xếp object theo key
  sortObject(obj) {
    const sorted = {};
    const keys = Object.keys(obj).sort();
    
    keys.forEach(key => {
      sorted[key] = obj[key];
    });
    
    return sorted;
  }
}

module.exports = new VNPay();

