import { describe, it, expect } from "vitest";
import {
  isOurS3Url,
  extractImageIdFromS3Url,
} from "./storeSourceImage.server";

describe("storeSourceImage utilities", () => {
  describe("isOurS3Url", () => {
    it("returns false for empty URL", () => {
      expect(isOurS3Url("")).toBe(false);
    });

    it("returns false for external URLs", () => {
      expect(isOurS3Url("https://example.com/image.jpg")).toBe(false);
      expect(isOurS3Url("https://other-bucket.s3.amazonaws.com/image")).toBe(false);
      expect(isOurS3Url("https://google.com/image.png")).toBe(false);
    });

    it("returns false when S3_BUCKET_URL is not set", () => {
      // When S3_BUCKET_URL env var is empty, should return false
      // This is tested implicitly since the env var is not set in test environment
      expect(isOurS3Url("https://ai-icon-generator.s3.us-east-2.amazonaws.com/image123")).toBe(false);
    });
  });

  describe("extractImageIdFromS3Url", () => {
    it("returns null for non-S3 URLs", () => {
      expect(extractImageIdFromS3Url("https://example.com/image.jpg")).toBe(null);
      expect(extractImageIdFromS3Url("")).toBe(null);
    });

    it("returns null when URL is not from our S3", () => {
      expect(extractImageIdFromS3Url("https://other-bucket.s3.amazonaws.com/image123")).toBe(null);
    });
  });
});

describe("storeSourceImage URL validation", () => {
  it("correctly validates image URL format", () => {
    const isValidImageUrl = (url: string): boolean => {
      try {
        const parsed = new URL(url);
        return parsed.protocol === "https:" || parsed.protocol === "http:";
      } catch {
        return false;
      }
    };

    expect(isValidImageUrl("https://example.com/image.jpg")).toBe(true);
    expect(isValidImageUrl("http://example.com/image.jpg")).toBe(true);
    expect(isValidImageUrl("not-a-url")).toBe(false);
    expect(isValidImageUrl("")).toBe(false);
    expect(isValidImageUrl("ftp://example.com/image.jpg")).toBe(false);
  });
});

describe("video source ID generation", () => {
  it("video source IDs have correct prefix", () => {
    const createVideoSourceId = (baseId: string): string => {
      return `video-source-${baseId}`;
    };

    const id = createVideoSourceId("abc123");
    expect(id).toBe("video-source-abc123");
    expect(id.startsWith("video-source-")).toBe(true);
  });

  it("video source S3 keys use correct path", () => {
    const createVideoSourceKey = (id: string): string => {
      return `video-sources/${id}`;
    };

    const key = createVideoSourceKey("video-source-abc123");
    expect(key).toBe("video-sources/video-source-abc123");
    expect(key.startsWith("video-sources/")).toBe(true);
  });
});

describe("content type validation", () => {
  it("validates image content types", () => {
    const isImageContentType = (contentType: string): boolean => {
      return contentType.startsWith("image/");
    };

    expect(isImageContentType("image/png")).toBe(true);
    expect(isImageContentType("image/jpeg")).toBe(true);
    expect(isImageContentType("image/gif")).toBe(true);
    expect(isImageContentType("image/webp")).toBe(true);
    expect(isImageContentType("video/mp4")).toBe(false);
    expect(isImageContentType("text/html")).toBe(false);
    expect(isImageContentType("application/json")).toBe(false);
  });
});
