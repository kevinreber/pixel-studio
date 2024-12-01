/**
 * Converts an image URL to a base64 encoded string
 * @param imageUrl - The URL of the image to convert
 * @returns A base64 encoded string of the image
 */
export const convertImageUrlToBase64 = async (
  imageUrl: string
): Promise<string> => {
  try {
    const response = await fetch(imageUrl);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return buffer.toString("base64");
  } catch (error) {
    console.error("Error converting image to base64:", error);
    throw new Error("Failed to convert image to base64");
  }
};
