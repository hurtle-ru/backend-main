import fs from "fs/promises";
import * as path from "path";
import { HttpError } from "../../infrastructure/error/http.error";
import { BaseFileOptions } from "./artifact.dto"
import { promisify } from "util";
import { createReadStream, stat, unlinkSync} from "fs";
import {
  AVAILABLE_IMAGE_FILE_MIME_TYPES,
  AVAILABLE_DOCUMENT_FILE_MIME_TYPES,
  AVAILABLE_VIDEO_FILE_MIME_TYPES,
  FILE_EXTENSION_MIME_TYPES, artifactConfig,
} from "./artifact.config";
import { singleton } from "tsyringe";
import { Readable } from "stream";
import { logger } from "../../infrastructure/logger/logger";


export const ARTIFACT_ROOT_DIR = "data/";

const statPromisified = promisify(stat);

async function saveMulterFile(file: Express.Multer.File, filePath: string): Promise<string> {
  filePath = ARTIFACT_ROOT_DIR + filePath;
  const directory = path.dirname(filePath);

  try {
    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(filePath, file.buffer);

    logger.trace(`Succeed save file ${filePath}`, directory);
    return filePath;
  } catch (err) {
    throw new Error("saveMulterFile: Error while saving file", { cause: err });
  }
}

@singleton()
export class ArtifactService {
  async saveFile(
    file: Express.Multer.File,
    filePath: string,
    availableMimeTypes?: string[],
    maxSize?: number
  ): Promise<string> {
    await this.validateFileAttributes(file, availableMimeTypes, maxSize);
    return saveMulterFile(file, filePath)
  }
  async saveImageFile(file: Express.Multer.File, filePath: string): Promise<string> {
    return this.saveFile(file, filePath, AVAILABLE_IMAGE_FILE_MIME_TYPES, artifactConfig.MAX_IMAGE_FILE_SIZE)
  }
  async saveVideoFile(file: Express.Multer.File, filePath: string): Promise<string> {
    return this.saveFile(file, filePath, AVAILABLE_VIDEO_FILE_MIME_TYPES, artifactConfig.MAX_VIDEO_FILE_SIZE)
  }
  async saveDocumentFile(file: Express.Multer.File, filePath: string): Promise<string> {
    return this.saveFile(file, filePath, AVAILABLE_DOCUMENT_FILE_MIME_TYPES, artifactConfig.MAX_DOCUMENT_FILE_SIZE)
  }
  async loadFile(originFilePath: string): Promise<[Readable, BaseFileOptions]> {
    const filePath = ARTIFACT_ROOT_DIR + originFilePath;

    if(!await this.exists(originFilePath)) throw new HttpError(404, "File not found")

    try {
      const stat = await statPromisified(filePath);

      let fileType: string | null = null

      try {
        fileType = FILE_EXTENSION_MIME_TYPES[path.extname(filePath)];
      }
      catch {}

      const stream = createReadStream(path.join(process.cwd(), filePath), {highWaterMark: artifactConfig.READ_STREAM_HIGH_WATER_MARK});

      return [
        stream,
        {
          "mimeType": fileType,
          "size": stat.size,
        },
      ];
    }
    catch (err) {
      throw new Error("loadFile: Error while loading file", { cause: err });
    }
  }
  async exists(filePath: string): Promise<boolean> {
    filePath = ARTIFACT_ROOT_DIR + filePath;
    try {
      await fs.access(filePath);
      return true;
    }
    catch (e) {
      return false;
    }
  }
  deleteFile(filePath: string): void {
    filePath = ARTIFACT_ROOT_DIR + filePath;
    unlinkSync(filePath)
  }
  async getFullFileName(directory: string, fileName:string): Promise<string | null>{
    // find first file by name without extension
    if (! await this.exists(directory)) {
      return null
    }

    const filePath = ARTIFACT_ROOT_DIR + directory;

    const files = await fs.readdir(filePath);
    const matchedFiles = files.filter((file) => {
      const fileWithoutExtension = path.parse(file).name;
      return fileWithoutExtension === fileName;
    });

    if (matchedFiles.length > 0) {
      return matchedFiles[0];
    }
    return null
  }
  async validateFileAttributes(file: Express.Multer.File, availableMimeTypes?: string[],  maxSize?: number) {
    if (!!maxSize && file.size > maxSize) {
      throw new HttpError(413, "File is too large");
    }
    if (!!availableMimeTypes && !availableMimeTypes.includes(file.mimetype)) {
      throw new HttpError(415, `Invalid file mime type: "${file.mimetype}"`);
    }
  }
}
