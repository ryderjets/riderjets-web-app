import { uploadData, getUrl, remove, list } from '@aws-amplify/storage';

/**
 * Upload a file to Amplify Storage (S3).
 * @param key - object key (e.g. `pods/orders/123.jpg`)
 * @param file - File | Blob | string (base64) to upload
 * @param accessLevel - access level: 'public' | 'protected' | 'private'
 */
export async function uploadFile(
  key: string,
  file: File | Blob | string,
  accessLevel: 'public' | 'protected' | 'private' = 'protected'
) {
  return uploadData({ key, body: file as any, accessLevel });
}

/**
 * Get a signed URL (or public path) for an object in Storage.
 * @param key - object key
 * @param expires - seconds until the signed URL expires
 * @param accessLevel - access level
 */
export async function getFileUrl(
  key: string,
  expires = 3600,
  accessLevel: 'public' | 'protected' | 'private' = 'protected'
) {
  return getUrl({ key, accessLevel, expires });
}

/**
 * Delete an object from Storage.
 */
export async function deleteFile(
  key: string,
  accessLevel: 'public' | 'protected' | 'private' = 'protected'
) {
  return remove({ key, accessLevel });
}

export async function listFiles(
  path = '',
  accessLevel: 'public' | 'protected' | 'private' = 'protected'
) {
  return list({ path, accessLevel });
}

export default {
  uploadFile,
  getFileUrl,
  deleteFile,
  listFiles,
};
