import type { FileUIPart } from 'ai';

const toDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

export const toFilePart = async (file: File): Promise<FileUIPart> => {
  const url = await toDataURL(file);
  return {
    type: 'file' as const,
    mediaType: file.type,
    filename: file.name,
    url,
  };
};
