export const getFileNameFromUrl = (fileUrl) => {
  if (!fileUrl) return '';

  try {
    const cleanUrl = fileUrl.split('?')[0];
    const parts = cleanUrl.split('/');
    return decodeURIComponent(parts[parts.length - 1] || '');
  } catch {
    return '';
  }
};

export const isImageFile = (fileNameOrUrl = '', mimeType = '') => {
  const normalizedName = String(fileNameOrUrl).toLowerCase();
  const normalizedType = String(mimeType).toLowerCase();

  return (
    normalizedType === 'image/jpeg' ||
    normalizedType === 'image/png' ||
    normalizedName.endsWith('.jpg') ||
    normalizedName.endsWith('.jpeg') ||
    normalizedName.endsWith('.png')
  );
};

export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'application/pdf',
];

export const validateFileType = (file, allowedTypes = ALLOWED_FILE_TYPES) => {
  if (!file) return { valid: false };

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Дозволено завантажувати лише JPG, JPEG, PNG або PDF.',
    };
  }

  return { valid: true };
};

export const extractFileFromUploadEvent = (fileList) => {
  return fileList?.[0]?.originFileObj || null;
};
