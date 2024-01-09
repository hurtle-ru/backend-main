const MB = 2**20

export const MAX_IMAGE_FILE_SIZE = 5 * MB
export const MAX_DOCUMENT_FILE_SIZE = 15 * MB
export const MAX_VIDEO_FILE_SIZE = 800 * MB
export const READ_STREAM_HIGH_WATER_MARK = 1000 * MB;

export const AVAILABLE_IMAGE_FILE_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/png",
  "image/webp",
]
export const AVAILABLE_VIDEO_FILE_MIME_TYPES = [
  "video/mpeg",
  "video/mp4",
  "video/webm",
  "video/x-msvideo",
]
export const AVAILABLE_DOCUMENT_FILE_MIME_TYPES = [
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

export const FILE_EXTENSION_MIME_TYPES: { [key: string]: string } = {
  ".png":  "image/png",
  ".webp": "image/webp",
  ".jpg":  "image/jpeg",
  ".mpga": "video/mpeg",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".avi": "video/x-msvideo",
  ".pdf": "application/pdf",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".doc": "application/msword",
  ".dotx": "application/vnd.openxmlformats-officedocument.wordprocessingml.template",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".xltx": "application/vnd.openxmlformats-officedocument.spreadsheetml.template",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".potx": "application/vnd.openxmlformats-officedocument.presentationml.template",
  ".ppsx": "application/vnd.openxmlformats-officedocument.presentationml.slideshow",
}
