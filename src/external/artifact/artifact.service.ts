import fs from 'fs/promises';
import * as path from 'path';
import { HttpError } from '../../infrastructure/error/httpError';
import { BaseFileOptions } from './artifact.dto'
import { promisify } from 'util';
import { stat } from 'fs'
import mime  from 'mime'


export const ARTIFACT_ROOT_DIR = "data/";

const statPromisified = promisify(stat);

const MB = 2**20

const MAX_IMAGE_FILE_SIZE = 5 * MB
const MAX_DOCUMENT_FILE_SIZE = 15 * MB
const MAX_VIDEO_FILE_SIZE = 800 * MB

const AVAILABLE_IMAGE_FILE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
]
const AVAILABLE_VIDEO_FILE_MIME_TYPES = [
  "video/mpeg",
  "video/mp4",
  "video/webm",
  "video/x-msvideo",
]
const AVAILABLE_DOCUMENT_FILE_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.template",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.template",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.presentationml.template",
  "application/vnd.openxmlformats-officedocument.presentationml.slideshow",
  "application/vnd.ms-access",
]

export const ArtifactService = {
  saveMulterFile: async function (file: Express.Multer.File, filePath: string): Promise<string> {
    filePath = ARTIFACT_ROOT_DIR + filePath;
    const directory = path.dirname(filePath);

    try {
      await fs.mkdir(directory, { recursive: true });
      await fs.writeFile(filePath, file.buffer);

      console.log(`succeed save save file ${filePath}`, directory)
      return filePath;
    } catch (err) {
      console.log(err);
      throw new Error(`Error while saving file: ${err}`);
    }
  },
  saveImageFile: async function (file: Express.Multer.File, filePath: string): Promise<string> {
    this.validateFileAttributes(file, AVAILABLE_IMAGE_FILE_MIME_TYPES, MAX_IMAGE_FILE_SIZE);
    return this.saveMulterFile(file, filePath)
  },
  saveVideoFile: async function (file: Express.Multer.File, filePath: string): Promise<string> {
    this.validateFileAttributes(file, AVAILABLE_VIDEO_FILE_MIME_TYPES, MAX_VIDEO_FILE_SIZE);
    return this.saveMulterFile(file, filePath)
  },
  saveDocumentFile: async function (file: Express.Multer.File, filePath: string): Promise<string> {
    this.validateFileAttributes(file, AVAILABLE_DOCUMENT_FILE_MIME_TYPES, MAX_DOCUMENT_FILE_SIZE);
    return this.saveMulterFile(file, filePath)
  },
  loadFile: async function(originFilePath: string): Promise<[string, BaseFileOptions]> {
    const filePath = ARTIFACT_ROOT_DIR + originFilePath;

    if(!await this.exists(originFilePath)) throw new HttpError(404, "File not found")

    try {
      const data = await fs.readFile(filePath);
      const stat = await statPromisified(filePath);

      return [
        data.toString(),
        {
          'mimeType': mime.getType(filePath),
          'size': stat.size,
        },
      ];
    }
    catch (err) {
      console.log(err);
      throw new Error(`Error while loading file: ${err}`);
    }
  },
  exists: async function(filePath: string): Promise<boolean> {
    filePath = ARTIFACT_ROOT_DIR + filePath;
    try {
      await fs.access(filePath);
      return true;
    }
    catch (e) {
      return false;
    }
  },
  deleteFile: async function(filePath: string): Promise<void> {
    filePath = ARTIFACT_ROOT_DIR + filePath;
    fs.unlink(filePath)
  },
  getFullFileName: async function(directory: string, fileName:string): Promise<string | null>{
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
  },
  validateFileAttributes: async function(file: Express.Multer.File, avalibleMimeTypes?: string[],  maxSize?: number) {
    if (!!maxSize && file.size > maxSize) {
      throw new HttpError(413, "File is too large")
    }
    if (!!avalibleMimeTypes && avalibleMimeTypes.includes(file.mimetype)) {
      throw new HttpError(415, `Invalid file mime type: ${file.mimetype}`)
    }
  },
}
