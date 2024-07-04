import { singleton } from "tsyringe";

@singleton()
export class HtmlFormatter {
  public bold = (text: string): string => `<b>${text}</b>`;

  public hyperLink = (text: string, link: string): string => `<a href="${link}">${text}</a>`;

  public code = (text: string): string => `<code>${text}</code>`;
}
