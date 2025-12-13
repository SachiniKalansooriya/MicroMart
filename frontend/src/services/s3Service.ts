// frontend/src/services/s3Service.ts
import { authService } from './authService';

const API_BASE_URL = 'https://kpk440vdkf.execute-api.eu-north-1.amazonaws.com/prod';

export interface PresignedUrlResponse {
  uploadUrl: string;
  fileUrl: string;
  key: string;
}

export const s3Service = {
  /**
   * Get a presigned URL from the backend to upload an image to S3
   */
  async getPresignedUrl(fileName: string, fileType: string): Promise<PresignedUrlResponse> {
    const token = authService.getToken();
    
    // DEBUG: Log what we're about to send
    console.log('🔍 [s3Service] getPresignedUrl called with:');
    console.log('  fileName:', fileName);
    console.log('  fileType:', fileType);
    console.log('  fileName type:', typeof fileName);
    console.log('  fileType type:', typeof fileType);
    
    const requestBody = {
      fileName,
      fileType
    };
    console.log(' [s3Service] Request body:', JSON.stringify(requestBody));
    
    const response = await fetch(`${API_BASE_URL}/upload/presigned-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(requestBody)
    });

    console.log('📡 [s3Service] Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [s3Service] Error response:', errorText);
      throw new Error(`Failed to get upload URL: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ [s3Service] Success response:', result);
    return result;
  },

  /**
   * Upload file directly to S3 using presigned URL
   */
  async uploadToS3(presignedUrl: string, file: File): Promise<void> {
    const response = await fetch(presignedUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type
      },
      body: file
    });

    if (!response.ok) {
      throw new Error('Failed to upload image to S3');
    }
  },

  /**
   * Complete upload process: get presigned URL and upload file
   */
  async uploadImage(file: File): Promise<string> {
    try {
      console.log('🚀 [s3Service] uploadImage started');
      console.log('📄 [s3Service] File object:', {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified
      });
      
      // Get presigned URL from backend
      const { uploadUrl, fileUrl } = await this.getPresignedUrl(file.name, file.type);
      
      console.log('📤 [s3Service] Starting S3 upload...');
      // Upload file to S3
      await this.uploadToS3(uploadUrl, file);
      
      console.log('✅ [s3Service] Upload complete! File URL:', fileUrl);
      // Return the public URL of the uploaded file
      return fileUrl;
    } catch (error) {
      console.error('❌ [s3Service] S3 upload error:', error);
      throw error;
    }
  }
};

export default s3Service;
