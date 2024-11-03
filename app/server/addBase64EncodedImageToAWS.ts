import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID_AWS!,
    secretAccessKey: process.env.SECRET_ACCESS_KEY_AWS!,
  },
  region: process.env.REGION_AWS!,
});

/**
 * @description
 * This function stores an image to our AWS S3 bucket
 *
 * @reference
 * https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/
 *
 */
export const addBase64EncodedImageToAWS = async (
  base64EncodedImage: string,
  iconId: string
) => {
  const putObjectCommand = new PutObjectCommand({
    Key: iconId,
    Bucket: process.env.S3_BUCKET_NAME_AWS!,
    Body: Buffer.from(base64EncodedImage, "base64"),
    ContentType: "image/png",
    ContentEncoding: "base64",
  });

  try {
    const response = await s3Client.send(putObjectCommand);

    return response;
  } catch (error) {
    console.warn("Error Saving image to AWS S3 Bucket");
    console.error(error);
    throw new Error("Error Saving image to AWS S3 Bucket");
  }
};
