import { DIGITS, ENGLISH_ALPHABET_LOWER, RUSSIAN_ALPHABET_LOWER } from "../../util/string.utils";
import _ from "lodash";


export default class SearchingUtils {
  public static getSearchWords(searchQuery: string): string[] {
    searchQuery = searchQuery
      .trim()
      .toLowerCase()
      .replaceAll("-", " ")
      .replace(/  +/g, " ")

    const allowedChars = ENGLISH_ALPHABET_LOWER + RUSSIAN_ALPHABET_LOWER + DIGITS + "@. ";
    searchQuery = _.filter(searchQuery, char => allowedChars.includes(char)).join("");

    return searchQuery
      .split(" ")
      .slice(0, 7);
  }

  public static prepareSearchQueryForFts(searchQuery: string): string {
    return this.getSearchWords(searchQuery)
      .join(" | ");
  }
}
