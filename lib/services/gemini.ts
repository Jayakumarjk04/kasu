import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Healthcare',
  'Education',
  'Travel',
  'Personal Care',
  'Groceries',
  'Subscriptions',
  'Investment',
  'Other',
] as const;

export type Category = typeof CATEGORIES[number];

export interface ParsedExpense {
  amount: number;
  category: Category;
  description: string;
  date: Date;
  paymentMethod?: string;
}

export interface AIResponse {
  intent: 'add_expense' | 'query' | 'delete' | 'update' | 'analytics' | 'help' | 'greeting' | 'unknown';
  expenses?: ParsedExpense[];
  query?: {
    type: string;
    category?: string;
    dateRange?: { start: Date; end: Date };
    limit?: number;
  };
  response: string;
  deleteTarget?: {
    description?: string;
    category?: string;
    amount?: number;
    dateRange?: { start: Date; end: Date };
  };
  updateTarget?: {
    id?: string;
    description?: string;
    newAmount?: number;
    newCategory?: string;
    newDescription?: string;
  };
}

function getSystemPrompt(userContext: string): string {
  return `You are saver, an intelligent AI assistant for expense tracking. You help users manage their finances through natural conversation.

CURRENT USER CONTEXT:
${userContext}

YOUR CAPABILITIES:
1. ADD EXPENSES: Parse natural language to extract expense details
2. QUERY EXPENSES: Help users find and analyze their spending
3. DELETE EXPENSES: Remove expenses by description, amount, or date
4. UPDATE EXPENSES: Modify existing expense details
5. ANALYTICS: Provide spending insights and summaries
6. BUDGETS: Help manage and track budgets

CATEGORIES AVAILABLE:
${CATEGORIES.join(', ')}

RESPONSE FORMAT:
Always respond with valid JSON in this structure:
{
  "intent": "add_expense" | "query" | "delete" | "update" | "analytics" | "help" | "greeting" | "unknown",
  "expenses": [{ "amount": number, "category": string, "description": string, "date": "ISO string", "paymentMethod": string }],
  "query": { "type": string, "category": string, "dateRange": { "start": "ISO", "end": "ISO" }, "limit": number },
  "deleteTarget": { "description": string, "category": string, "amount": number },
  "updateTarget": { "id": string, "description": string, "newAmount": number, "newCategory": string },
  "response": "Your friendly response to the user"
}

GUIDELINES:
- Be conversational and helpful
- When adding expenses, confirm the details
- For vague dates like "yesterday" or "last week", calculate the actual date
- If unsure about category, make a reasonable guess based on the description
- Always include a friendly response message
- Today's date is: ${new Date().toISOString().split('T')[0]}`;
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function callGeminiWithRetry(
  message: string,
  systemPrompt: string,
  historyFormatted: { role: string; parts: { text: string }[] }[],
  maxRetries = 3
): Promise<string> {
  // Use gemini-1.5-flash as it's stable and widely available
  const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const chat = model.startChat({
        history: [
          { role: 'user', parts: [{ text: systemPrompt }] },
          { role: 'model', parts: [{ text: 'I understand. I am saver, your expense tracking assistant. I will respond with JSON format as specified.' }] },
          ...historyFormatted,
        ],
      });

      const result = await chat.sendMessage(message);
      return result.response.text();
    } catch (error: unknown) {
      const err = error as { status?: number; message?: string };

      // Check if it's a retryable error (429 rate limit or 503 service unavailable)
      const isRetryable =
        err.status === 429 ||
        err.status === 503 ||
        (err.message && (err.message.includes('429') || err.message.includes('503') || err.message.includes('Service Unavailable')));

      if (isRetryable) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff: 1s, 2s, 4s
        console.log(`API error (${err.status}), retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);

        if (attempt < maxRetries - 1) {
          await sleep(delay);
          continue;
        }
      }

      throw error;
    }
  }

  throw new Error('Max retries exceeded');
}

export async function processUserMessage(
  message: string,
  chatHistory: { role: string; content: string }[],
  userContext: string
): Promise<AIResponse> {
  try {
    const systemPrompt = getSystemPrompt(userContext);

    const historyFormatted = chatHistory.slice(-10).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    const responseText = await callGeminiWithRetry(message, systemPrompt, historyFormatted);

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        intent: 'unknown',
        response: responseText,
      };
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Convert date strings to Date objects
    if (parsed.expenses) {
      parsed.expenses = parsed.expenses.map((exp: ParsedExpense & { date: string }) => ({
        ...exp,
        date: new Date(exp.date),
      }));
    }

    return parsed as AIResponse;
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string };
    console.error('Gemini API error:', error);

    // Provide specific error messages for API issues
    if (err.status === 429 || (err.message && err.message.includes('429'))) {
      return {
        intent: 'unknown',
        response: 'I\'m currently experiencing high demand. Your Gemini API quota may be exceeded. Please wait a moment and try again, or check your API plan at https://ai.google.dev/gemini-api/docs/rate-limits',
      };
    }

    if (err.status === 503 || (err.message && (err.message.includes('503') || err.message.includes('Service Unavailable')))) {
      return {
        intent: 'unknown',
        response: 'The AI service is temporarily unavailable due to high demand. Please try again in a few moments.',
      };
    }

    return {
      intent: 'unknown',
      response: 'I apologize, but I encountered an error processing your request. Please try again.',
    };
  }
}
