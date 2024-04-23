import { str, cleanEnv, bool, } from "envalid";
import axios from "axios";
import { SocksProxyAgent, } from "socks-proxy-agent";
import OpenAI from "openai";
import { Agent, } from "agent-base";
import { logger, } from "../../infrastructure/logger/logger";
export const chatGptConfig = cleanEnv(process.env, {
  CHATGPT_API_KEY: str(),
  CHATGPT_MODEL: str(),
  CHATGPT_USE_PROXY: bool(),
  CHATGPT_PROXY_URL: str(),
},);

export async function validateChatGptConfig() {
  const agent = new SocksProxyAgent(chatGptConfig.CHATGPT_PROXY_URL,);
  await validateProxy(agent,);
  await validateApiKey(agent,);
}

async function validateProxy(agent: SocksProxyAgent,) {
  if (!chatGptConfig.CHATGPT_USE_PROXY) return;
  const response = await axios.get("https://httpbin.org/ip", { httpsAgent: agent, },);
  if (response.data.origin !== chatGptConfig.CHATGPT_PROXY_URL.split("@",)[1].split(":",)[0]) {
    throw new Error("ChatGPT proxy doesnt work",);
  }

  logger.info("ChatGPT proxy is operational",);
}

async function validateApiKey(agent: SocksProxyAgent,) {
  const openai = new OpenAI({
    apiKey: chatGptConfig.CHATGPT_API_KEY,
    httpAgent: agent,
  },);
  const models = await openai.models.list();

  logger.info("OpenAI API key is valid.",);
}