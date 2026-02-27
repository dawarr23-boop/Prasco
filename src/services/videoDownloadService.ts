import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { logger } from '../utils/logger';

const execAsync = promisify(exec);

interface VideoDownloadResult {
  success: boolean;
  localPath?: string;
  error?: string;
}

/**
 * Video Download Service
 * Downloads YouTube videos using yt-dlp for offline playback (hotspot mode)
 */
export class VideoDownloadService {
  private readonly UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'videos');
  private readonly MAX_VIDEO_SIZE = '500M'; // Max video size
  private readonly TIMEOUT = 300000; // 5 minutes timeout

  constructor() {
    this.ensureUploadDir();
  }

  /**
   * Ensure upload directory exists
   */
  private async ensureUploadDir(): Promise<void> {
    try {
      await fs.mkdir(this.UPLOAD_DIR, { recursive: true });
      logger.info(`Video upload directory ready: ${this.UPLOAD_DIR}`);
    } catch (error) {
      logger.error('Failed to create video upload directory:', error);
    }
  }

  /**
   * Check if yt-dlp is installed
   */
  async isYtDlpAvailable(): Promise<boolean> {
    try {
      await execAsync('/usr/local/bin/yt-dlp --version', { timeout: 5000 });
      return true;
    } catch {
      logger.warn('yt-dlp not found. Video download will be skipped.');
      return false;
    }
  }

  /**
   * Extract video ID from YouTube URL
   */
  private extractYouTubeId(url: string): string | null {
    const match = url.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/|youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})/
    );
    return match ? match[1] : null;
  }

  /**
   * Download YouTube video for offline use
   */
  async downloadYouTubeVideo(url: string): Promise<VideoDownloadResult> {
    try {
      // Check if yt-dlp is available
      const isAvailable = await this.isYtDlpAvailable();
      if (!isAvailable) {
        return {
          success: false,
          error: 'yt-dlp not installed',
        };
      }

      // Extract video ID
      const videoId = this.extractYouTubeId(url);
      if (!videoId) {
        return {
          success: false,
          error: 'Invalid YouTube URL',
        };
      }

      // Check if already downloaded
      const existingFile = await this.findExistingVideo(videoId);
      if (existingFile) {
        logger.info(`Video already downloaded: ${existingFile}`);
        return {
          success: true,
          localPath: `/uploads/videos/${existingFile}`,
        };
      }

      // Output filename
      const outputTemplate = path.join(this.UPLOAD_DIR, `${videoId}.%(ext)s`);

      // Download command with options optimized for Raspberry Pi:
      // - Format: Best quality up to 720p (better performance on Pi)
      // - Max filesize to prevent huge downloads
      // - No thumbnail embedding for better compatibility
      const command = `/usr/local/bin/yt-dlp -f "bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720][ext=mp4]/best" \
        --merge-output-format mp4 \
        --max-filesize ${this.MAX_VIDEO_SIZE} \
        --no-playlist \
        -o "${outputTemplate}" \
        "${url}"`;

      logger.info(`Downloading YouTube video: ${videoId}`);
      logger.debug(`Command: ${command}`);

      await execAsync(command, { timeout: this.TIMEOUT });

      // Find downloaded file
      const downloadedFile = await this.findExistingVideo(videoId);
      if (!downloadedFile) {
        throw new Error('Video download completed but file not found');
      }

      const localPath = `/uploads/videos/${downloadedFile}`;
      logger.info(`Video downloaded successfully: ${localPath}`);

      return {
        success: true,
        localPath,
      };
    } catch (error: unknown) {
      logger.error('Video download failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Find existing video file by video ID
   */
  private async findExistingVideo(videoId: string): Promise<string | null> {
    try {
      const files = await fs.readdir(this.UPLOAD_DIR);
      const videoFile = files.find((file) => file.startsWith(videoId) && file.endsWith('.mp4'));
      return videoFile || null;
    } catch {
      return null;
    }
  }

  /**
   * Check if URL is a YouTube URL
   */
  isYouTubeUrl(url: string): boolean {
    return /(?:youtube\.com|youtu\.be)/.test(url);
  }

  /**
   * Check if URL is a Vimeo URL
   */
  isVimeoUrl(url: string): boolean {
    return /vimeo\.com/.test(url);
  }

  /**
   * Delete downloaded video file
   */
  async deleteVideo(localPath: string): Promise<void> {
    try {
      const filename = path.basename(localPath);
      const fullPath = path.join(this.UPLOAD_DIR, filename);
      await fs.unlink(fullPath);
      logger.info(`Deleted video file: ${filename}`);
    } catch (error) {
      logger.error('Failed to delete video file:', error);
    }
  }

  /**
   * Download video for a specific post
   */
  async downloadVideoForPost(postId: number): Promise<void> {
    const { Post, Media } = await import('../models');
    
    try {
      const post = await Post.findByPk(postId);
      if (!post) {
        throw new Error(`Post ${postId} not found`);
      }

      if (post.contentType !== 'video') {
        throw new Error(`Post ${postId} is not a video`);
      }

      if (post.mediaId) {
        logger.info(`[Video Download] Post ${postId} already has local media`);
        return;
      }

      const videoUrl = post.content;
      if (!videoUrl || !(this.isYouTubeUrl(videoUrl) || this.isVimeoUrl(videoUrl))) {
        throw new Error(`Post ${postId} has no external video URL`);
      }

      logger.info(`[Video Download] Starting download for post ${postId}: ${videoUrl}`);

      const result = await this.downloadYouTubeVideo(videoUrl);
      
      if (!result.success || !result.localPath) {
        throw new Error(result.error || 'Download failed');
      }

      // Get file stats
      const fsSync = require('fs');
      const fullPath = path.join(this.UPLOAD_DIR, path.basename(result.localPath));
      const stats = fsSync.statSync(fullPath);
      const filename = path.basename(result.localPath);

      // Create media entry
      const media = await Media.create({
        filename: filename,
        originalName: `${post.title}.mp4`,
        url: result.localPath,
        mimeType: 'video/mp4',
        size: stats.size,
        uploadedBy: post.createdBy || 1,
      } as any);

      logger.info(`[Video Download] Created media entry ${media.id} for post ${postId}`);

      // Update post
      await post.update({
        mediaId: media.id,
        content: `Downloaded from: ${videoUrl}`,
      });

      logger.info(`[Video Download] ✅ Successfully processed post ${postId}`);
    } catch (error: unknown) {
      logger.error(`[Video Download] ❌ Error processing post ${postId}:`, error);
      throw error;
    }
  }
}

export const videoDownloadService = new VideoDownloadService();
