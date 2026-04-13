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
