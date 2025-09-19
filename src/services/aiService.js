import { GoogleGenerativeAI } from '@google/generative-ai';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

class AIService {
  constructor() {
    const API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
    if (!API_KEY) {
      throw new Error('REACT_APP_GEMINI_API_KEY not found in environment variables. Please check your .env file.');
    }

    try {
      this.genAI = new GoogleGenerativeAI(API_KEY);
      this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" }); // Changed to gemini-pro as it's more stable
      this.productCache = null;
      this.categoryCache = null;
      this.lastCacheUpdate = null;
      this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    } catch (error) {
      console.error('Error initializing AI service:', error);
      throw new Error('Failed to initialize AI service. Please check your API key and try again.');
    }
  }

  // Fetch and cache product data
  async updateProductCache() {
    try {
      const now = Date.now();
      if (this.productCache && this.lastCacheUpdate && (now - this.lastCacheUpdate < this.CACHE_DURATION)) {
        return; // Cache is still valid
      }

      console.log('Updating product cache...');
      
      // Fetch products
      const productsSnapshot = await getDocs(collection(db, 'products'));
      const products = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Fetch categories
      const categoriesSnapshot = await getDocs(collection(db, 'categories'));
      const categories = categoriesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      this.productCache = products;
      this.categoryCache = categories;
      this.lastCacheUpdate = now;
      
      console.log(`Cache updated with ${products.length} products and ${categories.length} categories`);
    } catch (error) {
      console.error('Error updating product cache:', error);
    }
  }

  // Get category name by ID
  getCategoryName(categoryId) {
    if (!this.categoryCache) return 'Unknown Category';
    const category = this.categoryCache.find(cat => cat.id === categoryId);
    return category ? category.name : 'Unknown Category';
  }

  // Generate product context for AI
  generateProductContext() {
    if (!this.productCache || !this.categoryCache) {
      return 'No product information available at the moment.';
    }

    const categoryMap = {};
    this.categoryCache.forEach(cat => {
      categoryMap[cat.id] = cat.name;
    });

    let context = `\n\nAVAILABLE PRODUCTS AT ANA GROUP SUPPLIES:\n\n`;
    
    // Group products by category
    const productsByCategory = {};
    this.productCache.forEach(product => {
      const categoryName = categoryMap[product.category] || 'Uncategorized';
      if (!productsByCategory[categoryName]) {
        productsByCategory[categoryName] = [];
      }
      productsByCategory[categoryName].push(product);
    });

    // Generate context by category
    Object.keys(productsByCategory).forEach(categoryName => {
      context += `${categoryName.toUpperCase()}:\n`;
      productsByCategory[categoryName].forEach(product => {
        context += `- ${product.name}: TZS ${product.price.toLocaleString()} - ${product.description}\n`;
      });
      context += '\n';
    });

    context += `\nTOTAL PRODUCTS: ${this.productCache.length}\n`;
    context += `CATEGORIES: ${Object.keys(productsByCategory).join(', ')}\n\n`;
    
    return context;
  }

  // Enhanced AI response with product awareness
  async generateResponse(userMessage, chatHistory = []) {
    try {
      // Update product cache
      await this.updateProductCache();

      // Generate product context
      const productContext = this.generateProductContext();

      // Build conversation history
      let conversationContext = '';
      if (chatHistory.length > 0) {
        conversationContext = '\n\nPREVIOUS CONVERSATION:\n';
        chatHistory.slice(-6).forEach((chat, index) => { // Last 6 messages for context
          conversationContext += `${chat.type === 'user' ? 'Customer' : 'Assistant'}: ${chat.message}\n`;
        });
        conversationContext += '\n';
      }

      // Enhanced system prompt with product awareness
      const systemPrompt = `You are an intelligent customer service assistant for AnA Group Supplies, a premium fashion retailer. You have access to real-time product inventory and comprehensive knowledge about all available items.

KEY RESPONSIBILITIES:
1. Provide detailed product recommendations based on customer preferences
2. Answer questions about specific products, prices, and availability
3. Help customers find products that match their style, budget, and needs
4. Offer fashion advice and styling suggestions
5. Assist with size recommendations and product comparisons
6. Handle customer inquiries professionally and helpfully

COMMUNICATION STYLE:
- Be friendly, professional, and knowledgeable
- Use natural, conversational language
- Provide specific product details when relevant
- Offer alternatives when requested items aren't available
- Be concise but comprehensive in your responses
- Always mention prices in TZS (Tanzanian Shillings)

PRODUCT KNOWLEDGE:
${productContext}

IMPORTANT GUIDELINES:
- Always reference actual products from our inventory when making recommendations
- Mention specific product names, prices, and categories when relevant
- If a customer asks about a product not in our inventory, politely explain and suggest similar alternatives
- For price inquiries, always use the exact prices from our database
- When recommending products, consider the customer's budget and preferences
- Encourage customers to visit our website or contact us for more details

${conversationContext}

Customer Message: ${userMessage}

Provide a helpful, informative response based on our current product inventory:`;

      const result = await this.model.generateContent(systemPrompt);
      const response = await result.response;
      return response.text();

    } catch (error) {
      console.error('Error generating AI response:', error);
      throw new Error('I apologize, but I\'m having trouble processing your request right now. Please try again in a moment, or contact our support team for immediate assistance.');
    }
  }

  // Search products by query
  searchProducts(query) {
    if (!this.productCache) return [];
    
    const searchTerm = query.toLowerCase();
    return this.productCache.filter(product => 
      product.name.toLowerCase().includes(searchTerm) ||
      product.description.toLowerCase().includes(searchTerm) ||
      this.getCategoryName(product.category).toLowerCase().includes(searchTerm)
    );
  }

  // Get products by category
  getProductsByCategory(categoryName) {
    if (!this.productCache || !this.categoryCache) return [];
    
    const category = this.categoryCache.find(cat => 
      cat.name.toLowerCase() === categoryName.toLowerCase()
    );
    
    if (!category) return [];
    
    return this.productCache.filter(product => product.category === category.id);
  }

  // Get product recommendations based on price range
  getProductsByPriceRange(minPrice, maxPrice) {
    if (!this.productCache) return [];
    
    return this.productCache.filter(product => 
      product.price >= minPrice && product.price <= maxPrice
    );
  }

  // Get product statistics
  getProductStats() {
    if (!this.productCache || !this.categoryCache) {
      return {
        totalProducts: 0,
        categories: 0,
        priceRange: { min: 0, max: 0 },
        averagePrice: 0
      };
    }

    const prices = this.productCache.map(p => p.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const averagePrice = prices.reduce((a, b) => a + b, 0) / prices.length;

    return {
      totalProducts: this.productCache.length,
      categories: this.categoryCache.length,
      priceRange: { min: minPrice, max: maxPrice },
      averagePrice: Math.round(averagePrice)
    };
  }

  // Force cache refresh
  async refreshCache() {
    this.lastCacheUpdate = null;
    await this.updateProductCache();
  }
}

// Create singleton instance
const aiService = new AIService();

export default aiService;