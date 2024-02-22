import { injectable, singleton } from "tsyringe";
import { render as renderTemplate } from "squirrelly";
import path from "path";
import fs from "fs";


@injectable()
@singleton()
export class TemplateRendererService {
  private templateCache: Map<string, string> = new Map();

  renderTemplate(templateType: string, templateName: string, context: any, shouldCacheTemplate: boolean = false): string {
    const cacheKey = `${templateType}/${templateName}`;
    let templateText: string;

    if(this.templateCache.has(cacheKey)) {
      templateText = this.templateCache.get(cacheKey)!;
    } else {
      templateText = this.loadTemplateText(templateType, templateName);
      if(shouldCacheTemplate) this.templateCache.set(cacheKey, templateText);
    }

    return renderTemplate(templateText, context);
  }

  private loadTemplateText(templateType: string, templateName: string): string {
    const templatePath = path.join(process.cwd(), `resources/${templateType}/${templateName}.template.html`);
    return fs.readFileSync(templatePath, "utf8");
  }
}
