import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
})

export async function generateChatResponse(messages: { role: 'user' | 'assistant'; content: string }[]) {
  try {
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a helpful shopping assistant for a luxury e-commerce store called LuxeCart. 
          You help customers with:
          - Product recommendations
          - Sizing and fit questions
          - Style advice
          - Order and shipping inquiries
          - Returns and exchanges
          - General shopping assistance
          
          Be friendly, professional, and knowledgeable about luxury fashion and accessories.
          Keep responses concise but helpful.`,
        },
        ...messages,
      ],
      model: 'gpt-3.5-turbo',
    })

    return completion.choices[0].message.content
  } catch (error) {
    console.error('Error generating chat response:', error)
    return 'I apologize, but I am having trouble processing your request at the moment. Please try again later.'
  }
}