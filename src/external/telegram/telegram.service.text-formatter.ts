import { singleton } from "tsyringe"


abstract class TextFormatter {
    public abstract boldText(text: string): string
    public abstract hyperLink(text: string, link: string): string
}

@singleton()
export class HtmlFormatter extends TextFormatter {
    public boldText  = (text: string,): string => `<b>${text}</b>`
    public hyperLink = (text: string, link: string): string => `<a href="${link}">${text}</a>`
}
