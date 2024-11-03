import { getS3BucketURL } from "~/utils";

export const getImageBase64 = async (imageId: string) => {
  const imageURL = getS3BucketURL(imageId);

  const data = await fetch(imageURL)
    .then((response) => response.arrayBuffer())
    .then((blob) => Buffer.from(blob).toString("base64"));

  return data;
};
