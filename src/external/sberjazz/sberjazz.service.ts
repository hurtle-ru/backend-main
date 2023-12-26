import { singleton } from "tsyringe";
import axios from "axios";


@singleton()
export class SberJazzService {
  constructor() {}

  /**
   * Создает конференцию в SberJazz и возвращает ссылку на неё.
   * @param {string} name - Название комнаты.
   * @returns Ссылка на созданную комнату.
   */
  async createRoom(name: string): Promise<string> {
    const url = "https://vc-backend.sberdevices.ru/room/create";
    const response = await axios.post(url, {
      roomType: "ANONYMOUS",
      roomTitle: name,
    }, {
      headers: {"Content-Type": "application/json"},
    });

    if(response.status === 200 && response.data && response.data.url) return response.data.url;

    throw new Error("Error creating room", response.data);
  }
}
