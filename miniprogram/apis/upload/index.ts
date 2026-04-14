import { UploadResult } from "../type";
import { uploadFile, uploadFiles } from "../../utils/upload";

/**
 * 上传单张图片
 */
export function apiUploadImage(filePath: string) {
  return uploadFile<UploadResult>({
    url: "/common/upload/image",
    filePath,
    name: "file",
    loadingText: "上传中...",
  });
}

/**
 * 上传多张图片
 */
export function apiUploadImages(filePaths: string[]) {
  return uploadFiles<UploadResult>({
    url: "/common/upload/image",
    filePaths,
    name: "file",
    loadingText: "上传中...",
  });
}