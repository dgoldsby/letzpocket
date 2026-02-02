export interface OpenAIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class OpenAIService {
  private apiUrl: string;

  constructor() {
    this.apiUrl = 'https://us-central1-letzpocket-site.cloudfunctions.net/chat';
  }

  async chatCompletion(messages: OpenAIMessage[]): Promise<string> {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          model: 'gpt-3.5-turbo',
          max_tokens: 500,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
      }

      const data: OpenAIResponse = await response.json();
      return data.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
    } catch (error) {
      console.error('OpenAI service error:', error);
      throw error;
    }
  }

  async askAboutLettings(question: string): Promise<string> {
    const systemMessage: OpenAIMessage = {
      role: 'system',
      content: 'You are an expert in lettings in the UK, and understand fully the new Renters Rights Act. You should only answer questions about UK lettings and properties. You should be concise, intelligent and friendly. You should close every response with the phrase "Of course, my responses cannot be considered legally binding and must be reviewed by your legal representative".'
    };

    const userMessage: OpenAIMessage = {
      role: 'user',
      content: question
    };

    return this.chatCompletion([systemMessage, userMessage]);
  }
}

export const openaiService = new OpenAIService();
