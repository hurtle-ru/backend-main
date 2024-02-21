import OpenAI from "openai";
import { singleton } from "tsyringe";
import { chatGPTConfig } from "./chatgpt.config";
import { ChatCompletionMessageParam } from "openai/src/resources/chat/completions";


@singleton()
export class ChatGPTService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: chatGPTConfig.CHATGPT_API_KEY,
    });
  }

  async generateChatCompletion(chatHistory: ChatCompletionMessageParam[], newPrompt: string): Promise<OpenAI.ChatCompletion> {
    const updatedHistory: ChatCompletionMessageParam[] = [...chatHistory, { role: "user", content: newPrompt }];

    return this.openai.chat.completions.create({
      model: chatGPTConfig.CHATGPT_MODEL,
      messages: updatedHistory,
    });
  }

  async generatePromptCompletion(prompt: string): Promise<OpenAI.ChatCompletion> {
    return this.generateChatCompletion([], prompt);
  }
}
