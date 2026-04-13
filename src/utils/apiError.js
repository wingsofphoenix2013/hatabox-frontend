export const getApiErrorMessage = (responseData, fieldNames = []) => {
  if (!responseData) {
    return null;
  }

  if (responseData.detail) {
    return responseData.detail;
  }

  if (responseData.error) {
    return responseData.error;
  }

  if (responseData.message) {
    return responseData.message;
  }

  for (const fieldName of fieldNames) {
    const fieldError = responseData[fieldName];

    if (Array.isArray(fieldError) && fieldError.length > 0) {
      return fieldError[0];
    }
  }

  if (typeof responseData === 'string') {
    return responseData;
  }

  return null;
};
