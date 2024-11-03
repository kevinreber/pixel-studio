import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID_AWS!,
    secretAccessKey: process.env.SECRET_ACCESS_KEY_AWS!,
  },
  region: process.env.REGION_AWS!,
});

/**
 * @description
 * This function returns the Blob an image from our AWS S3 Bucket
 *
 * @reference
 * - Setting up "@aws-sdk/client-s3": https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/
 * - Adding multiple "Action" policies in IAM: https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements_action.html
 */
export const getImageBlobFromS3 = async (imageId: string) => {
  // export const getImageURLBlob = async (imageId: string) => {
  const getObjectCommand = new GetObjectCommand({
    Key: imageId,
    Bucket: process.env.S3_BUCKET_NAME_AWS!,
  });

  try {
    const response = await s3Client.send(getObjectCommand);
    console.log("Get Image Blob from S3 ----------------");
    // console.log(response);

    const data = await response.Body?.transformToString();
    // console.log(stream);

    // const data = stream;
    // const data = Buffer.concat(await stream.toArray());

    // const data = stream.pipe(createWriteStream(`test_${imageId}`));
    // console.log(data);

    console.log("Get Image Blob from S3 ----------------");

    return {
      success: true,
      data: {
        imageId,
        message: `Successfuly fetched Blob for Image ID: ${imageId}`,
        imageBlob: data,
      },
    };
  } catch (error) {
    console.warn("Error removing image from AWS S3 Bucket");
    console.error(error);
    return {
      success: false,
      data: {
        imageId,
        message: `Error getting Blob for Image ID: ${imageId}`,
        error,
      },
    };
  }
};
