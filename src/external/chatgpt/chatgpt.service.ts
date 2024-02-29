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

  async generateChatCompletion(prompt: string, chatHistory: ChatCompletionMessageParam[]): Promise<OpenAI.ChatCompletion> {
    prompt = this.cleanUpPrompt(prompt);
    const updatedHistory: ChatCompletionMessageParam[] = [...chatHistory, { role: "user", content: prompt }];

    return this.openai.chat.completions.create({
      model: chatGptConfig.CHATGPT_MODEL,
      messages: updatedHistory,
    });
  }

  async generatePromptCompletion(prompt: string): Promise<OpenAI.ChatCompletion> {
    return this.generateChatCompletion(prompt, []);
  }

  cleanUpPrompt(prompt: string): string {
    while(prompt.includes("\n\n\n")) {
      prompt = prompt.replaceAll("\n\n\n", "\n\n");
    }

    while(prompt.includes("  ")) {
      prompt = prompt.replaceAll("  ", " ");
    }

    return prompt;
  }
}
