const OpenAI = require('openai');
const Product = require('../models/Product');

// Khởi tạo OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '' // Sẽ lấy từ .env
});

// System prompt giới hạn ngữ cảnh trong chức năng của web
const SYSTEM_PROMPT = `Bạn là trợ lý AI thông minh của website Thu Mua Đồ Cũ - một nền tảng mua bán và trao đổi đồ cũ trực tuyến.

CHỨC NĂNG CỦA WEBSITE:
1. Mua bán đồ cũ: Người dùng có thể đăng sản phẩm để bán hoặc tìm kiếm sản phẩm để mua
2. Trao đổi sản phẩm: Người dùng có thể trao đổi sản phẩm của mình với sản phẩm của người khác
3. Quản lý đơn hàng: Theo dõi đơn hàng, trạng thái giao hàng
4. Chat với người bán: Liên hệ trực tiếp với người bán qua tin nhắn
5. Quản lý sản phẩm: Đăng, chỉnh sửa, xóa sản phẩm của mình

NHIỆM VỤ CỦA BẠN:
- Tư vấn về cách sử dụng website
- Hướng dẫn tìm kiếm sản phẩm
- Giải thích về tính năng trao đổi sản phẩm
- Hỗ trợ về quy trình mua bán
- Tư vấn về đăng sản phẩm
- Trả lời câu hỏi về đơn hàng và thanh toán

QUY TẮC:
- Chỉ trả lời các câu hỏi liên quan đến chức năng của website
- Nếu người dùng hỏi về chủ đề ngoài phạm vi website, hãy nhẹ nhàng hướng họ về các chức năng của website
- Luôn trả lời bằng tiếng Việt, thân thiện và chuyên nghiệp
- Đưa ra lời khuyên hữu ích và cụ thể`;

// Lưu trữ lịch sử chat theo session (có thể cải thiện bằng Redis sau)
const chatHistory = new Map();

// Hàm lấy lịch sử chat của user
const getChatHistory = (userId) => {
  if (!chatHistory.has(userId)) {
    chatHistory.set(userId, []);
  }
  return chatHistory.get(userId);
};

// Hàm thêm message vào lịch sử
const addToHistory = (userId, role, content) => {
  const history = getChatHistory(userId);
  history.push({ role, content });
  // Giới hạn lịch sử 20 tin nhắn gần nhất để tránh token quá nhiều
  if (history.length > 20) {
    history.shift();
  }
};

// Hàm xóa lịch sử chat
const clearHistory = (userId) => {
  chatHistory.delete(userId);
};

// Hàm tìm kiếm sản phẩm
const searchProducts = async (searchQuery, limit = 5) => {
  try {
    const query = {
      status: { $in: ['approved'] },
      quantity: { $gt: 0 },
      $or: [
        { title: { $regex: searchQuery, $options: 'i' } },
        { description: { $regex: searchQuery, $options: 'i' } },
        { category: { $regex: searchQuery, $options: 'i' } }
      ]
    };

    const products = await Product.find(query)
      .populate('seller', 'name email')
      .limit(limit)
      .sort({ createdAt: -1 });

    return products.map(product => ({
      _id: product._id,
      title: product.title,
      price: product.price,
      image: product.image,
      category: product.category,
      description: product.description,
      seller: {
        name: product.seller?.name || 'N/A'
      }
    }));
  } catch (error) {
    console.error('Search products error:', error);
    return [];
  }
};

// Hàm phát hiện intent tìm kiếm sản phẩm từ message
const detectSearchIntent = (message) => {
  const lowerMessage = message.toLowerCase();
  const searchKeywords = ['tìm', 'kiếm', 'search', 'có', 'bán', 'mua', 'sản phẩm', 'đồ', 'item'];
  const hasSearchKeyword = searchKeywords.some(keyword => lowerMessage.includes(keyword));
  
  // Loại bỏ các từ không phải tìm kiếm sản phẩm
  const excludeKeywords = ['tìm kiếm', 'cách tìm', 'hướng dẫn', 'làm sao'];
  const hasExcludeKeyword = excludeKeywords.some(keyword => lowerMessage.includes(keyword));
  
  return hasSearchKeyword && !hasExcludeKeyword;
};

// Hàm trích xuất từ khóa tìm kiếm từ message
const extractSearchQuery = (message) => {
  // Loại bỏ các từ không cần thiết
  const stopWords = ['tìm', 'kiếm', 'cho', 'tôi', 'mình', 'bạn', 'có', 'bán', 'mua', 'sản phẩm', 'đồ', 'item', 'search', 'find'];
  const words = message.toLowerCase().split(/\s+/);
  const keywords = words.filter(word => 
    word.length > 2 && !stopWords.includes(word)
  );
  
  return keywords.join(' ').trim() || message;
};

// Chat với AI (có thể có hoặc không có auth)
exports.chatWithAI = async (req, res) => {
  try {
    const { message, clearChat } = req.body;
    // Lấy userId từ user nếu có, nếu không thì dùng 'anonymous'
    const userId = (req.user && (req.user._id?.toString() || req.user.id)) || 'anonymous';

    // Xóa lịch sử nếu người dùng yêu cầu
    if (clearChat) {
      clearHistory(userId);
      return res.json({
        success: true,
        message: 'Đã xóa lịch sử chat',
        response: 'Xin chào! Tôi là trợ lý AI của website Thu Mua Đồ Cũ. Tôi có thể giúp bạn tìm kiếm sản phẩm, tư vấn về giá cả, hướng dẫn trao đổi sản phẩm, hoặc hỗ trợ về các chức năng khác của website. Bạn cần hỗ trợ gì?'
      });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập câu hỏi'
      });
    }

    // Lấy lịch sử chat
    const history = getChatHistory(userId);

    // Nếu chưa có lịch sử, thêm system prompt
    if (history.length === 0) {
      history.push({
        role: 'system',
        content: SYSTEM_PROMPT
      });
    }

    // Thêm message của user vào lịch sử
    addToHistory(userId, 'user', message.trim());

    // Kiểm tra nếu người dùng muốn tìm sản phẩm
    const userMessage = message.trim();
    const isSearchIntent = detectSearchIntent(userMessage);
    let foundProducts = [];

    if (isSearchIntent) {
      const searchQuery = extractSearchQuery(userMessage);
      foundProducts = await searchProducts(searchQuery, 5);
    }

    // Nếu không có API key, trả về response mặc định
    if (!process.env.OPENAI_API_KEY) {
      const defaultResponse = getDefaultResponse(userMessage, foundProducts);
      addToHistory(userId, 'assistant', defaultResponse);
      return res.json({
        success: true,
        response: defaultResponse,
        products: foundProducts.length > 0 ? foundProducts : undefined
      });
    }

    try {
      // Nếu có sản phẩm tìm được, thêm thông tin vào context
      let enhancedHistory = [...history];
      if (foundProducts.length > 0) {
        const productsInfo = foundProducts.map(p => 
          `- ${p.title} (${p.price.toLocaleString('vi-VN')} ₫) - ${p.category}`
        ).join('\n');
        
        enhancedHistory.push({
          role: 'system',
          content: `Người dùng đang tìm kiếm sản phẩm. Đã tìm thấy ${foundProducts.length} sản phẩm:\n${productsInfo}\n\nHãy giới thiệu các sản phẩm này cho người dùng một cách tự nhiên và thân thiện.`
        });
      }

      // Gọi OpenAI API
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: enhancedHistory,
        temperature: 0.7,
        max_tokens: 500
      });

      const aiResponse = completion.choices[0].message.content;
      
      // Thêm response vào lịch sử (không thêm system message vào history)
      addToHistory(userId, 'assistant', aiResponse);

      res.json({
        success: true,
        response: aiResponse,
        products: foundProducts.length > 0 ? foundProducts : undefined
      });
    } catch (openaiError) {
      console.error('OpenAI API Error:', openaiError);
      
      // Fallback về response mặc định nếu API lỗi
      const defaultResponse = getDefaultResponse(userMessage, foundProducts);
      addToHistory(userId, 'assistant', defaultResponse);
      
      res.json({
        success: true,
        response: defaultResponse,
        products: foundProducts.length > 0 ? foundProducts : undefined
      });
    }

  } catch (error) {
    console.error('Chat AI Error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xử lý câu hỏi',
      error: error.message
    });
  }
};

// Hàm trả về response mặc định (fallback khi không có API key hoặc API lỗi)
const getDefaultResponse = (userMessage, products = []) => {
  const lowerMessage = userMessage.toLowerCase();

  // Nếu có sản phẩm tìm được, trả về thông tin sản phẩm
  if (products.length > 0) {
    const productList = products.map(p => 
      `• ${p.title} - ${p.price.toLocaleString('vi-VN')} ₫`
    ).join('\n');
    return `Tôi đã tìm thấy ${products.length} sản phẩm phù hợp:\n\n${productList}\n\nBạn có thể click vào sản phẩm để xem chi tiết!`;
  }

  // Tư vấn về tìm kiếm
  if (lowerMessage.includes('tìm') || lowerMessage.includes('search') || lowerMessage.includes('kiếm')) {
    return 'Bạn có thể sử dụng thanh tìm kiếm ở đầu trang để tìm sản phẩm theo tên, mô tả. Hoặc bạn có thể lọc theo danh mục và khoảng giá để tìm sản phẩm phù hợp.';
  }

  // Tư vấn về giá
  if (lowerMessage.includes('giá') || lowerMessage.includes('price') || lowerMessage.includes('rẻ')) {
    return 'Giá sản phẩm được người bán tự đặt. Bạn có thể thương lượng giá với người bán thông qua tính năng chat. Ngoài ra, bạn cũng có thể trao đổi sản phẩm thay vì mua bằng tiền.';
  }

  // Tư vấn về trao đổi
  if (lowerMessage.includes('trao đổi') || lowerMessage.includes('đổi') || lowerMessage.includes('exchange')) {
    return 'Bạn có thể trao đổi sản phẩm của mình với sản phẩm của người khác. Vào trang "Trao Đổi", chọn sản phẩm của bạn và sản phẩm muốn đổi, sau đó gửi đề xuất trao đổi.';
  }

  // Tư vấn về đăng sản phẩm
  if (lowerMessage.includes('đăng') || lowerMessage.includes('bán') || lowerMessage.includes('post')) {
    return 'Để đăng sản phẩm, bạn cần đăng nhập, sau đó click vào "Đăng sản phẩm" hoặc "Đăng bán". Điền đầy đủ thông tin sản phẩm, upload ảnh, và chờ admin duyệt. Sản phẩm sẽ hiển thị sau khi được duyệt.';
  }

  // Tư vấn về thanh toán
  if (lowerMessage.includes('thanh toán') || lowerMessage.includes('mua') || lowerMessage.includes('payment')) {
    return 'Bạn có thể thêm sản phẩm vào giỏ hàng và thanh toán. Hoặc liên hệ trực tiếp với người bán qua tin nhắn để thương lượng và giao dịch.';
  }

  // Tư vấn về đăng ký/đăng nhập
  if (lowerMessage.includes('đăng ký') || lowerMessage.includes('đăng nhập') || lowerMessage.includes('login') || lowerMessage.includes('register')) {
    return 'Bạn có thể đăng ký tài khoản mới hoặc đăng nhập bằng email và mật khẩu. Sau khi đăng nhập, bạn có thể đăng sản phẩm, chat với người khác, và sử dụng đầy đủ các tính năng.';
  }

  // Câu trả lời mặc định
  return 'Cảm ơn bạn đã hỏi! Tôi có thể giúp bạn về: tìm kiếm sản phẩm, trao đổi sản phẩm, đăng sản phẩm, quản lý đơn hàng, hoặc các chức năng khác của website. Bạn muốn biết thêm về điều gì cụ thể?';
};

// Lấy lịch sử chat
exports.getChatHistory = async (req, res) => {
  try {
    const userId = req.user?._id?.toString() || req.user?.id || 'anonymous';
    const history = getChatHistory(userId);
    
    // Loại bỏ system message khi trả về
    const userHistory = history.filter(msg => msg.role !== 'system');
    
    res.json({
      success: true,
      history: userHistory
    });
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy lịch sử chat'
    });
  }
};

