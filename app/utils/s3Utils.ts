export const getS3BucketThumbnailURL = (id: string) => {
  return `${process.env.S3_BUCKET_THUMBNAIL_URL_AWS}/resized-${id}`;
};

export const getS3BucketBlurURL = (id: string) => {
  return `${process.env.S3_BUCKET_THUMBNAIL_URL_AWS}/blur-${id}`;
};

export const getS3BucketURL = (id: string) => {
  return `${process.env.S3_BUCKET_URL_AWS}/${id}`;
};
