import { uploadData, getUrl, remove, list } from '@aws-amplify/storage';

/**
 * Upload a file to Amplify Storage (S3).
 * @param path - object path (e.g. `pods/orders/123.jpg`)
 * @param file - File | Blob | string (base64) to upload
 * @param accessLevel - access level: 'public' | 'protected' | 'private'
 */
export async function uploadFile(
  path: string,
  file: File | Blob | string
) {
  const uploadTask = uploadData({
    path,
    data: file as any,
    options: {
      contentType: file instanceof File ? file.type : undefined,
    },
  });
  return uploadTask.result;
}

/**
 * Get a signed URL (or public path) for an object in Storage.
 * @param path - object path
 * @param expires - seconds until the signed URL expires
 */
export async function getFileUrl(
  path: string,
  expires = 3600
) {
  return getUrl({ path, options: { expiresIn: expires } });
}

/**
 * Delete an object from Storage.
 */
export async function deleteFile(
  path: string
) {
  return remove({ path });
}

export async function listFiles(
  path = ''
) {
  return list({ path });
}

export default {
  uploadFile,
  getFileUrl,
  deleteFile,
  listFiles,
};
