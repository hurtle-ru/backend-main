import { dadataConfig } from "./dadata.config";
import axios from 'axios';
import BasicDadataCompany from './dadata.dto'

const BaseDadataURL = "http://suggestions.dadata.ru/suggestions/api/4_1/"


export default {
  async getBasicCompanyInfoByInn(inn: string): Promise<BasicDadataCompany | null> {
    const response = await axios.post(
      BaseDadataURL + "rs/suggest/party",
      JSON.stringify({query: inn}),
      {
        method: "POST",
        // mode: "cors",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": "Token " + dadataConfig.DADATA_TOKEN,
        },
      }
    )
    if (response.data["suggestions"].length == 0) {console.log("blyat");return null}

    const data = response.data["suggestions"][0]
    return {
      "name": data["value"],
      "ogrn": data["data"]["ogrn"],
    }
  },
}