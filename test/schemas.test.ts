import { readdirSync, readFileSync, statSync } from "fs";
import { join, resolve } from "path";
import { Project, SyntaxKind, VariableDeclaration, PropertyAssignment, ObjectLiteralExpression } from "ts-morph";

const PRISMA_SCHEMA_PATH = resolve("./prisma/schema.prisma");
const SRC_PATH = resolve("./src/domain");

type PrismaModelField = {
  type: string;
  isOptional: boolean;
};

type PrismaModels = Record<string, Record<string, PrismaModelField>>;

// Parse the Prisma schema
function getPrismaSchemaModels(schemaPath: string): PrismaModels {
  const schemaContent = readFileSync(schemaPath, "utf8");
  const models: PrismaModels = {};

  const lines = schemaContent.split("\n");
  let currentModel: string | null = null;

  for (const line of lines) {
    if (line.startsWith("model ")) {
      const modelName = line.split(" ")[1];
      currentModel = modelName;
      models[currentModel] = {};
    } else if (currentModel && line.includes("}")) {
      currentModel = null;
    } else if (currentModel && line.trim().length > 0) {
      const [fieldName, fieldType] = line.trim().split(/\s+/);
      const isOptional = line.includes("?");
      models[currentModel][fieldName] = {
        type: fieldType.replace("?", ""),
        isOptional,
      };
    }
  }

  return models;
}

const prismaModels = getPrismaSchemaModels(PRISMA_SCHEMA_PATH);

// Debug: Print all Prisma models and their fields
// console.log("Prisma models and their fields:");
Object.keys(prismaModels).forEach(model => {
  // console.log(`Model: ${model}`);
  Object.keys(prismaModels[model]).forEach(field => {
    const { type, isOptional } = prismaModels[model][field];
    // console.log(`  Field: ${field}, Type: ${type}, Optional: ${isOptional}`);
  });
});

function getFilesRecursively(directory: string): string[] {
  const files: string[] = [];
  const items = readdirSync(directory);

  for (const item of items) {
    const fullPath = join(directory, item);
    if (statSync(fullPath).isDirectory()) {
      files.push(...getFilesRecursively(fullPath));
    } else if (fullPath.endsWith(".dto.ts")) {
      files.push(fullPath);
    }
  }

  return files;
}

const project = new Project();
const files = getFilesRecursively(SRC_PATH);
project.addSourceFilesAtPaths(files);

const issues: { file: string; issues: string[] }[] = [];
const checkedFiles: string[] = [];

project.getSourceFiles().forEach((sourceFile) => {
  const filePath = sourceFile.getFilePath();
  checkedFiles.push(filePath);

  sourceFile.getVariableDeclarations().forEach((variableDeclaration: VariableDeclaration) => {
    const name = variableDeclaration.getName();
    if (!name.startsWith("Basic") || !name.endsWith("Schema")) {
      return;
    }

    // console.log(`Found Basic schema: ${name} in file: ${filePath}`);

    const initializer = variableDeclaration.getInitializerIfKind(SyntaxKind.CallExpression);
    if (!initializer) {
      // console.log(`  - No initializer found for ${name} in file: ${filePath}`);
      return;
    }

    const argument = initializer.getArguments()[0];
    if (!argument || argument.getKind() !== SyntaxKind.ObjectLiteralExpression) {
      // console.log(`  - Argument is not an ObjectLiteralExpression for ${name} in file: ${filePath}`);
      return;
    }

    const properties = (argument as ObjectLiteralExpression).getProperties();
    if (properties.length === 0) {
      // console.log(`  - No properties found in ObjectLiteralExpression for ${name} in file: ${filePath}`);
      return;
    }

    const modelNameMatch = name.match(/Basic(\w+)Schema/);
    if (!modelNameMatch) {
      // console.log(`  - No model name match found for ${name} in file: ${filePath}`);
      return;
    }

    const modelName = modelNameMatch[1];
    if (!prismaModels[modelName]) {
      // console.log(`  - Model ${modelName} not found in Prisma schema for ${name} in file: ${filePath}`);
      return;
    }

    const modelFields = prismaModels[modelName];
    const schemaIssues: string[] = [];

    // console.log(`  Model: ${modelName}`);
    properties.forEach((property: any) => {
      if (property.getKind() !== SyntaxKind.PropertyAssignment) {
        // console.log(`    - Property ${property.getText()} is not a PropertyAssignment`);
        return;
      }

      const propertyAssignment = property as PropertyAssignment;
      const propertyName = propertyAssignment.getName();
      const propertyInitializer = propertyAssignment.getInitializer()?.getText();
      const isNullable = propertyInitializer?.includes(".nullable()");

      // console.log(`    Field: ${propertyName}, Nullable: ${isNullable}`);

      const prismaField = modelFields[propertyName];

      if (!prismaField) {
        schemaIssues.push(`${propertyName} does not exist in Prisma schema`);
        // console.log(`    - Field ${propertyName} does not exist in Prisma schema`);
        return;
      }

      if (prismaField.isOptional && !isNullable) {
        schemaIssues.push(`${propertyName} should be nullable`);
        // console.log(`    - Field ${propertyName} should be nullable but is not`);
      } else if (!prismaField.isOptional && isNullable) {
        schemaIssues.push(`${propertyName} should not be nullable`);
        // console.log(`    - Field ${propertyName} should not be nullable but is`);
      }
    });

    if (schemaIssues.length > 0) {
      issues.push({ file: filePath, issues: schemaIssues });
    }
  });
});

// console.log("\nChecked files:");
// checkedFiles.forEach(file => console.log(` - ${file}`));

if (issues.length > 0) {
  console.log("\nSchema validation issues found:");
  issues.forEach(({ file, issues }) => {
    console.log(`File: ${file}`);
    issues.forEach((issue) => console.log(`  - ${issue}`));
    console.log("");
  });
} else {
  console.log("\nAll schemas are consistent with Prisma schema.");
}