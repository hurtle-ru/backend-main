import { dadataConfig } from "./dadata.config";
import axios from 'axios';
import BasicDadataCompany from './dadata.dto'

const BaseDadataURL = "http://suggestions.dadata.ru/suggestions/api/4_1/"


export default {
  async getBasicCompanyInfoByInn(inn: string): Promise<BasicDadataCompany | null> {
    axios.post(
      BaseDadataURL + "rs/suggest/party",
      JSON.stringify({query: "7724261610"}),
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
    .then(function (response) {
      const data = response.data["suggestions"][0]
      return {
        "name": data["value"],
        "ogrn": data["data"]["ogrn"],
      }
    })
    .catch(function (error) {
      console.log("Error: ", error);
    })
    return null
  },
}
