import { singleton } from "tsyringe";
import axios from "axios";
import { sberjazzConfig } from "./sberjazz.config";


@singleton()
export class SberJazzService {
  constructor() {}

  /**
   * Создает конференцию в SberJazz и возвращает ссылку на неё.
   * @param {string} name - Название комнаты.
   * @returns Ссылка на созданную комнату.
   */
  async createRoom(name: string): Promise<string> {
    const url = `${sberjazzConfig.API_BASE}/room/create`;

    const response = await axios.post(url, {
      roomTitle: name,
    }, {
      headers: {
        "Authorization": `Bearer ${sberjazzConfig.SALUTE_JAZZ_API_KEY}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
    });

    if (response.status === 200 && response.data?.roomUrl) return response.data.roomUrl;

    throw new Error("Error creating room", response.data);
  }
}
