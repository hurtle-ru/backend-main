import { singleton } from "tsyringe"


abstract class TextFormatter {
    public abstract bold(text: string): string
    public abstract hyperLink(text: string, link: string): string
    public abstract code(text: string): string
}

@singleton()
export class HtmlFormatter extends TextFormatter {
    public bold = (text: string): string => `<b>${text}</b>`
    public hyperLink = (text: string, link: string): string => `<a href="${link}">${text}</a>`
    public code = (text: string): string => `<code>${text}</code>`
}
