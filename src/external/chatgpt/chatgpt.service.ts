import OpenAI from "openai";
import { singleton } from "tsyringe";
import { chatGptConfig } from "./chatgpt.config";
import { SocksProxyAgent } from "socks-proxy-agent";
import { ChatCompletionMessageParam } from "openai/resources";



@singleton()
export class ChatGPTService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: chatGptConfig.CHATGPT_API_KEY,
      httpAgent: new SocksProxyAgent(chatGptConfig.CHATGPT_PROXY_URL),
    });
  }

  async generateChatCompletion(chatHistory: ChatCompletionMessageParam[], newPrompt: string): Promise<OpenAI.ChatCompletion> {
    const updatedHistory: ChatCompletionMessageParam[] = [...chatHistory, { role: "user", content: newPrompt }];

    return this.openai.chat.completions.create({
      model: chatGptConfig.CHATGPT_MODEL,
      messages: updatedHistory,
    });
  }

  async generatePromptCompletion(prompt: string): Promise<OpenAI.ChatCompletion> {
    return this.generateChatCompletion([], prompt);
  }
}
