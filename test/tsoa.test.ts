import { readdirSync, statSync } from "fs";
import { join, resolve } from "path";
import { Project, SyntaxKind, Decorator } from "ts-morph";

const SRC_PATH = resolve("./src");

function getFilesRecursively(directory: string): string[] {
  const files: string[] = [];
  const items = readdirSync(directory);

  for (const item of items) {
    const fullPath = join(directory, item);
    if (statSync(fullPath).isDirectory()) {
      files.push(...getFilesRecursively(fullPath));
    } else if (fullPath.endsWith(".controller.ts")) {
      files.push(fullPath);
    }
  }

  return files;
}

function log(message: string) {
  console.log(message);
}

function findDuplicateResponses(file: string, project: Project) {
  const sourceFile = project.getSourceFile(file);
  if (!sourceFile) return;

  const classes = sourceFile.getClasses();
  classes.forEach(cls => {
    const methods = cls.getMethods();
    let hasDuplicates = false;
    const duplicateLog: string[] = [];

    methods.forEach(method => {
      const responses: Record<number, string[]> = {};
      const decorators = method.getDecorators();

      decorators.forEach((decorator: Decorator) => {
        if (decorator.getName() === "Response") {
          const args = decorator.getArguments();
          if (args.length < 1) return;

          const statusCode = decorator.getArguments().slice(-1)[0];
          const code = parseInt(statusCode.getText(), 10);

          if (!responses[code]) {
            responses[code] = [];
          }

          const message = args[0].getText();
          responses[code].push(message);
        }
      });

      Object.keys(responses).forEach(code => {
        if (responses[parseInt(code, 10)].length > 1) {
          hasDuplicates = true;
          duplicateLog.push(`    Method: ${method.getName()}`);
          duplicateLog.push(`      Duplicate response codes found: ${code}`);
          responses[parseInt(code, 10)].forEach(response => {
            duplicateLog.push(`        Response: ${response}`);
          });
        }
      });
    });

    if (hasDuplicates) {
      log(`Checking file: ${file}`);
      log(`  Class: ${cls.getName()}`);
      duplicateLog.forEach(message => log(message));
    }
  });
}

function main() {
  const files = getFilesRecursively(SRC_PATH);
  log(`Total controller files found: ${files.length}`);

  const project = new Project();
  project.addSourceFilesAtPaths(files);

  files.forEach(file => findDuplicateResponses(file, project));
}

main();
