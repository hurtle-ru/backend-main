import OpenAI from "openai";
import { singleton } from "tsyringe";
import { chatGptConfig } from "./chatgpt.config";
import { SocksProxyAgent } from "socks-proxy-agent";
import { ChatCompletionMessageParam } from "openai/resources";
import { Uploadable } from "openai/src/uploads";
import { MessageContent } from "openai/src/resources/beta/threads/messages/messages";


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

  async generatePromptCompletionWithFile(prompt: string, file: Uploadable, assistantId: string): Promise<Array<MessageContent>> {
    const fileResponse = await this.openai.files.create({
      file,
      purpose: "assistants",
    });

    const threadRun = await this.openai.beta.threads.createAndRun({
      assistant_id: assistantId,
      thread: {
        messages: [{ role: "user", content: prompt, file_ids: [fileResponse.id] }],
      },
    });

    const terminatedRun = await this.openai.beta.threads.runs.poll(threadRun.thread_id, threadRun.id);
    await this.openai.files.del(fileResponse.id);

    const messages = await this.openai.beta.threads.messages.list(
      threadRun.thread_id, {
        order: "desc",
      },
    );

    return messages.data[0].content;
  }

  cleanUpPrompt(prompt: string): string {
    while (prompt.includes("\n\n\n")) {
      prompt = prompt.replaceAll("\n\n\n", "\n\n");
    }

    while (prompt.includes("  ")) {
      prompt = prompt.replaceAll("  ", " ");
    }

    return prompt;
  }
}
