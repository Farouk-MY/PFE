import { ChatMessage } from './types'
import { products } from './data'

interface ChatResponse {
  content: string
  suggestions?: string[]
  productLinks?: { name: string; url: string }[]
}

const productCatalog = {
  categories: ['Computers', 'Accessories', 'Components', 'Smart Home'],
  priceRanges: {
    budget: { min: 0, max: 500 },
    midRange: { min: 500, max: 1500 },
    premium: { min: 1500, max: 3000 },
    luxury: { min: 3000, max: Infinity },
  },
}

const flattenedProducts = Object.values(products).flat()

// Common greetings and their variations
const greetings = [
  'hi', 'hello', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening',
  'howdy', 'what\'s up', 'sup', 'hola', 'yo'
]

// Farewell phrases
const farewells = [
  'bye', 'goodbye', 'see you', 'cya', 'farewell', 'take care', 'later',
  'have a good day', 'have a great day', 'until next time'
]

// Common courtesy phrases
const courtesyPhrases = {
  thanks: ['thank you', 'thanks', 'thx', 'appreciate it', 'grateful'],
  welcome: ['you\'re welcome', 'welcome', 'no problem', 'my pleasure', 'glad to help'],
  how_are_you: ['how are you', 'how\'s it going', 'how do you do', 'how are things', 'what\'s new'],
  positive: ['good', 'great', 'awesome', 'amazing', 'excellent', 'perfect', 'nice'],
  negative: ['bad', 'terrible', 'awful', 'horrible', 'poor', 'not good']
}

// Time-based greetings
const getTimeBasedGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

const chatbotResponses: Record<string, (input: string) => ChatResponse> = {
  greeting: (input: string) => {
    const timeGreeting = getTimeBasedGreeting()
    return {
      content: `${timeGreeting}! I'm your TechVerse AI assistant. How can I help you today?`,
      suggestions: [
        'Show me latest products',
        'Find gaming laptops',
        'Check product availability'
      ]
    }
  },

  farewell: (input: string) => {
    return {
      content: "Thank you for chatting with me! Have a great day. Feel free to come back if you need any assistance with our products.",
      suggestions: ['Start new chat', 'Browse products', 'Leave feedback']
    }
  },

  courtesy: (input: string) => {
    if (courtesyPhrases.thanks.some(phrase => input.toLowerCase().includes(phrase))) {
      return {
        content: "You're welcome! Is there anything else I can help you with?",
        suggestions: ['Find products', 'Check order status', 'Technical support']
      }
    }
    
    if (courtesyPhrases.how_are_you.some(phrase => input.toLowerCase().includes(phrase))) {
      return {
        content: "I'm doing great, thank you for asking! I'm ready to help you find the perfect tech products. What are you looking for today?",
        suggestions: ['Show new arrivals', 'Browse categories', 'Get recommendations']
      }
    }

    return {
      content: "I'm here to help! What would you like to know about our products?",
      suggestions: ['Product recommendations', 'Compare products', 'Check availability']
    }
  },

  products: (input: string) => {
    // Check stock availability
    if (input.includes('stock') || input.includes('available')) {
      const productMatches = flattenedProducts.filter(p => 
        input.toLowerCase().includes(p.name.toLowerCase())
      )
      
      if (productMatches.length > 0) {
        const productResponses = productMatches.map(p => 
          `${p.name} is ${p.stock > 0 ? `in stock (${p.stock} available)` : 'out of stock'}`
        )
        return {
          content: productResponses.join('\n'),
          productLinks: productMatches.map(p => ({
            name: p.name,
            url: `/product/${p.id}`
          }))
        }
      }
      
      return {
        content: 'Here are some products currently in stock:',
        productLinks: flattenedProducts.filter(p => p.stock > 0).slice(0, 3).map(p => ({
          name: p.name,
          url: `/product/${p.id}`
        }))
      }
    }

    // Search for products
    if (input.includes('find') || input.includes('search') || input.includes('looking for')) {
      const searchTerms = input.toLowerCase().split(' ')
      const matches = flattenedProducts.filter(p => 
        searchTerms.some(term => 
          p.name.toLowerCase().includes(term) ||
          p.category.toLowerCase().includes(term) ||
          Object.values(p.specs).some(spec => 
            (spec as string).toLowerCase().includes(term)
          )
        )
      )

      if (matches.length > 0) {
        return {
          content: 'I found these products that might interest you:',
          productLinks: matches.slice(0, 3).map(p => ({
            name: p.name,
            url: `/product/${p.id}`
          }))
        }
      }
      
      return {
        content: "I couldn't find any products matching your description. Would you like to browse our categories instead?",
        suggestions: ['Show all categories', 'Latest products', 'Best sellers']
      }
    }

    // Price inquiries
    if (input.includes('price') || input.includes('cost') || input.includes('expensive') || input.includes('cheap')) {
      const productMatches = flattenedProducts.filter(p => 
        input.toLowerCase().includes(p.name.toLowerCase())
      )

      if (productMatches.length > 0) {
        return {
          content: productMatches.map(p => 
            `${p.name} is priced at $${p.price}`
          ).join('\n'),
          productLinks: productMatches.map(p => ({
            name: p.name,
            url: `/product/${p.id}`
          }))
        }
      }

      return {
        content: 'We have products in various price ranges:\n- Budget: Under $500\n- Mid-range: $500-$1500\n- Premium: $1500-$3000\n- Luxury: $3000+\n\nWhat\'s your preferred price range?',
        suggestions: ['Show budget options', 'Show premium products', 'Best value products']
      }
    }

    // Specs and technical details
    if (input.includes('specs') || input.includes('specifications') || input.includes('details')) {
      const productMatches = flattenedProducts.filter(p => 
        input.toLowerCase().includes(p.name.toLowerCase())
      )

      if (productMatches.length > 0) {
        const product = productMatches[0]
        const specs = Object.entries(product.specs)
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n')

        return {
          content: `Here are the specifications for ${product.name}:\n${specs}`,
          productLinks: [{
            name: product.name,
            url: `/product/${product.id}`
          }]
        }
      }
    }

    return {
      content: 'I can help you find the perfect product. What are you looking for?',
      suggestions: ['Latest products', 'Check stock', 'Compare products']
    }
  },

  help: (input: string) => {
    return {
      content: "I can help you with:\n- Finding products\n- Checking stock availability\n- Product specifications\n- Price information\n- Technical support\n\nWhat would you like to know?",
      suggestions: [
        'Find a product',
        'Check availability',
        'Get support'
      ]
    }
  }
}

export function generateResponse(input: string): ChatResponse {
  const lowercaseInput = input.toLowerCase()

  // Handle greetings
  if (greetings.some(greeting => lowercaseInput.includes(greeting))) {
    return chatbotResponses.greeting(lowercaseInput)
  }

  // Handle farewells
  if (farewells.some(farewell => lowercaseInput.includes(farewell))) {
    return chatbotResponses.farewell(lowercaseInput)
  }

  // Handle courtesy phrases
  if (Object.values(courtesyPhrases).some(phrases => 
    phrases.some(phrase => lowercaseInput.includes(phrase))
  )) {
    return chatbotResponses.courtesy(lowercaseInput)
  }

  // Handle help requests
  if (lowercaseInput.includes('help') || lowercaseInput.includes('support') || lowercaseInput.includes('assist')) {
    return chatbotResponses.help(lowercaseInput)
  }

  // Default to product-related responses
  return chatbotResponses.products(lowercaseInput)
}