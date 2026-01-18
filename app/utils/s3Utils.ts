export const getS3BucketThumbnailURL = (id: string) => {
  return `${process.env.S3_BUCKET_THUMBNAIL_URL_AWS}/resized-${id}`;
};

export const getS3BucketBlurURL = (id: string) => {
  return `${process.env.S3_BUCKET_THUMBNAIL_URL_AWS}/blur-${id}`;
};

export const getS3BucketURL = (id: string) => {
  return `${process.env.S3_BUCKET_URL_AWS}/${id}`;
};

// Video-specific S3 utilities
export const getS3VideoURL = (id: string) => {
  return `${process.env.S3_BUCKET_URL_AWS}/videos/${id}`;
};

export const getS3VideoThumbnailURL = (id: string) => {
  return `${process.env.S3_BUCKET_THUMBNAIL_URL_AWS}/video-thumb-${id}`;
};

export const getS3VideoPreviewURL = (id: string) => {
  return `${process.env.S3_BUCKET_THUMBNAIL_URL_AWS}/video-preview-${id}`;
};
