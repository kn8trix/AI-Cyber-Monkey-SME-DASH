import AWS from 'aws-sdk';
import crypto from 'crypto';
import path from 'path';

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

export interface UploadOptions {
  tenantId: string;
  folder: 'banners' | 'images' | 'icons' | 'uploads';
  file: Express.Multer.File;
  public?: boolean;
}

export interface SignedUrlOptions {
  tenantId: string;
  folder: 'banners' | 'images' | 'icons' | 'uploads';
  expiresIn?: number; // seconds, default 3600
}

class AssetManager {
  private cdnDomain = process.env.CDN_DOMAIN || 'cdn.domain.com';
  private s3BucketBase = process.env.S3_BUCKET_BASE || 'sme-assets';

  /**
   * Generate S3 key for asset
   */
  private generateS3Key(tenantId: string, folder: string, filename: string): string {
    const timestamp = Date.now();
    const randomId = crypto.randomBytes(4).toString('hex');
    const ext = path.extname(filename);
    const name = path.basename(filename, ext);
    
    return `tenants/${tenantId}/${folder}/${timestamp}-${randomId}${ext}`;
  }

  /**
   * Upload file to S3
   */
  async uploadFile(options: UploadOptions): Promise<{ url: string; key: string }> {
    const { tenantId, folder, file, public: isPublic = true } = options;

    if (!file) {
      throw new Error('No file provided');
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('File size exceeds 5MB limit');
    }

    // Validate MIME type
    const allowedMimes = {
      banners: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      images: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      icons: ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'],
      uploads: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
    };

    if (!allowedMimes[folder as keyof typeof allowedMimes]?.includes(file.mimetype)) {
      throw new Error(`Invalid file type: ${file.mimetype}`);
    }

    const key = this.generateS3Key(tenantId, folder, file.originalname);

    try {
      const params = {
        Bucket: this.s3BucketBase,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: {
          'tenant-id': tenantId,
          'upload-timestamp': Date.now().toString()
        },
        ServerSideEncryption: 'AES256',
        ACL: isPublic ? 'public-read' : 'private'
      };

      const uploadResult = await s3.upload(params).promise();

      // Generate CDN URL
      const cdnUrl = `https://${this.cdnDomain}/${key}`;

      console.log(`✓ Uploaded ${file.originalname} → ${key}`);

      return {
        url: cdnUrl,
        key
      };
    } catch (error: any) {
      console.error('S3 upload error:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  /**
   * Upload from URL (fetch and upload to S3)
   */
  async uploadFromUrl(
    tenantId: string,
    url: string,
    folder: string
  ): Promise<{ url: string; key: string }> {
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.statusText}`);
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      const contentType = response.headers.get('content-type') || 'image/png';
      const filename = new URL(url).pathname.split('/').pop() || 'image.png';

      const key = this.generateS3Key(tenantId, folder, filename);

      const params = {
        Bucket: this.s3BucketBase,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        Metadata: {
          'tenant-id': tenantId,
          'upload-timestamp': Date.now().toString(),
          'source': 'url-upload'
        },
        ServerSideEncryption: 'AES256',
        ACL: 'public-read'
      };

      await s3.upload(params).promise();

      const cdnUrl = `https://${this.cdnDomain}/${key}`;

      console.log(`✓ Uploaded from URL → ${key}`);

      return {
        url: cdnUrl,
        key
      };
    } catch (error: any) {
      console.error('URL upload error:', error);
      throw new Error(`URL upload failed: ${error.message}`);
    }
  }

  /**
   * Delete file from S3
   */
  async deleteFile(key: string): Promise<void> {
    try {
      await s3.deleteObject({
        Bucket: this.s3BucketBase,
        Key: key
      }).promise();

      console.log(`✓ Deleted ${key}`);
    } catch (error: any) {
      console.error('S3 delete error:', error);
      throw new Error(`Delete failed: ${error.message}`);
    }
  }

  /**
   * Generate signed URL (for private content)
   */
  async getSignedUrl(
    key: string,
    options: { expiresIn?: number } = {}
  ): Promise<string> {
    const params = {
      Bucket: this.s3BucketBase,
      Key: key,
      Expires: options.expiresIn || 3600
    };

    return s3.getSignedUrl('getObject', params);
  }

  /**
   * Get public CDN URL
   */
  getPublicUrl(key: string): string {
    return `https://${this.cdnDomain}/${key}`;
  }

  /**
   * List files for tenant.
   *
   * S3's `listObjectsV2` returns at most 1000 keys per call. The previous
   * implementation only returned that first page, so tenants with more
   * than 1000 assets silently lost data. We now loop on
   * `ContinuationToken` until S3 stops paginating, with an optional
   * `maxKeys` cap (default 5000) to keep responses bounded.
   */
  async listFiles(
    tenantId: string,
    folder?: string,
    options: { maxKeys?: number } = {}
  ): Promise<any[]> {
    const maxKeys = options.maxKeys ?? 5000;
    const prefix = folder
      ? `tenants/${tenantId}/${folder}/`
      : `tenants/${tenantId}/`;

    const collected: any[] = [];
    let continuationToken: string | undefined;

    try {
      do {
        const result: AWS.S3.ListObjectsV2Output = await s3.listObjectsV2({
          Bucket: this.s3BucketBase,
          Prefix: prefix,
          ContinuationToken: continuationToken,
          MaxKeys: Math.min(1000, maxKeys - collected.length)
        }).promise();

        for (const item of result.Contents || []) {
          collected.push({
            key: item.Key,
            size: item.Size,
            lastModified: item.LastModified,
            url: this.getPublicUrl(item.Key!)
          });
          if (collected.length >= maxKeys) break;
        }

        // Only keep paginating if (a) S3 says there is more AND
        // (b) we haven't hit the caller's cap.
        continuationToken =
          result.IsTruncated && collected.length < maxKeys
            ? result.NextContinuationToken
            : undefined;
      } while (continuationToken);

      if (collected.length === maxKeys) {
        console.warn(
          `[asset-manager] listFiles for ${prefix} hit maxKeys=${maxKeys} cap; results may be truncated.`
        );
      }

      return collected;
    } catch (error: any) {
      console.error('List files error:', error);
      throw new Error(`List failed: ${error.message}`);
    }
  }

  /**
   * Invalidate CloudFront cache
   */
  async invalidateCDNCache(paths: string[]): Promise<string> {
    const cloudfront = new AWS.CloudFront({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1'
    });

    try {
      const distributionId = process.env.CLOUDFRONT_DISTRIBUTION_ID;
      if (!distributionId) {
        console.warn('CloudFront distribution ID not configured, skipping cache invalidation');
        return '';
      }

      const result = await cloudfront.createInvalidation({
        DistributionId: distributionId,
        InvalidationBatch: {
          CallerReference: Date.now().toString(),
          Paths: {
            Quantity: paths.length,
            Items: paths
          }
        }
      }).promise();

      console.log(`✓ CloudFront cache invalidation: ${result.Invalidation?.Id}`);
      return result.Invalidation?.Id || '';
    } catch (error: any) {
      console.error('CloudFront invalidation error:', error);
      // Don't throw - invalidation failures shouldn't block uploads
      return '';
    }
  }
}

export default new AssetManager();
