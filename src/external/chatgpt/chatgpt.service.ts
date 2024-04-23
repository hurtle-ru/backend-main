import OpenAI from "openai";
import { singleton } from "tsyringe";
import { chatGptConfig } from "./chatgpt.config";
import { SocksProxyAgent } from "socks-proxy-agent";
import { ChatCompletionMessageParam } from "openai/resources";
import { Uploadable } from "openai/src/uploads";
import { logger } from "../../infrastructure/logger/logger";
import { Assistants } from "openai/resources/beta";
import { MessageContent } from "openai/resources/beta/threads";
import { th } from "yup-locales";


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

    const completion = await this.openai.chat.completions.create({
      model: chatGptConfig.CHATGPT_MODEL,
      messages: updatedHistory,
    });

    logger.debug({
      usage: {
        promptTokens: completion.usage?.prompt_tokens,
        completionTokens: completion.usage?.completion_tokens,
        totalTokens: completion.usage?.total_tokens,
      },
    }, "ChatGPTService created ChatCompletion");

    return completion;
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
      tool_choice: { type: "file_search" },
      thread: {
        messages: [{
          role: "user",
          content: prompt,
          attachments: [{
            file_id: fileResponse.id,
            tools: [{ type: "file_search" }],
          }],
        }],
        tool_resources: {
          file_search: {
            vector_stores: [{
              file_ids: [fileResponse.id],
            }],
          },
        },
      },
      tools: [{ type: "file_search" }],
    });

    const terminatedRun = await this.openai.beta.threads.runs.poll(threadRun.thread_id, threadRun.id);
    const receivedThread = await this.openai.beta.threads.retrieve(threadRun.thread_id);

    const messages = await this.openai.beta.threads.messages.list(
      threadRun.thread_id, {
        order: "desc",
      },
    );

    await this.openai.files.del(fileResponse.id);
    await this.openai.beta.threads.del(threadRun.thread_id);

    logger.debug({
      usage: {
        promptTokens: terminatedRun.usage?.prompt_tokens,
        completionTokens: terminatedRun.usage?.completion_tokens,
        totalTokens: terminatedRun.usage?.total_tokens,
      },
    }, "ChatGPTService finished thread run");

    return messages.data[0].content;
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
