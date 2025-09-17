import AWS from 'aws-sdk';

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1',
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'your-default-bucket';

export class S3Service {
  /**
   * Upload a file buffer to S3
   * @param buffer - File buffer to upload
   * @param fileName - Name of the file in S3
   * @param contentType - MIME type of the file
   * @returns Promise<string> - URL of the uploaded file
   */
  static async uploadFile(
    buffer: Buffer,
    fileName: string,
    contentType: string
  ): Promise<string> {
    try {
      const params = {
        Bucket: BUCKET_NAME,
        Key: fileName,
        Body: buffer,
        ContentType: contentType,
        ACL: 'public-read', // Make the file publicly accessible
      };

      const result = await s3.upload(params).promise();
      return result.Location;
    } catch (error) {
      console.error('Error uploading to S3:', error);
      throw new Error('Failed to upload file to S3');
    }
  }

  /**
   * Delete a file from S3
   * @param fileName - Name of the file to delete
   * @returns Promise<void>
   */
  static async deleteFile(fileName: string): Promise<void> {
    try {
      const params = {
        Bucket: BUCKET_NAME,
        Key: fileName,
      };

      await s3.deleteObject(params).promise();
    } catch (error) {
      console.error('Error deleting from S3:', error);
      throw new Error('Failed to delete file from S3');
    }
  }
}
