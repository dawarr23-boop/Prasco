#!/usr/bin/env node
/**
 * PRASCO Video Downloader
 * Downloads external videos (YouTube, Vimeo, etc.) and stores them locally
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');

// Database connection
const sequelize = new Sequelize(
  process.env.DB_NAME || 'prasco',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'postgres',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'postgres',
    logging: false
  }
);

// Define Models (simplified)
const Post = sequelize.define('Post', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: DataTypes.STRING,
  content: DataTypes.TEXT,
  contentType: DataTypes.ENUM('text', 'image', 'video', 'html', 'presentation'),
  mediaId: DataTypes.INTEGER,
  createdBy: DataTypes.INTEGER
}, { tableName: 'posts', timestamps: true, underscored: true });

const Media = sequelize.define('Media', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  filename: DataTypes.STRING,
  originalName: DataTypes.STRING,
  url: DataTypes.STRING,
  thumbnailUrl: DataTypes.STRING,
  mimeType: DataTypes.STRING,
  fileSize: DataTypes.BIGINT,
  organizationId: DataTypes.INTEGER,
  uploadedBy: DataTypes.INTEGER
}, { tableName: 'media', timestamps: true, underscored: true });

const UPLOAD_DIR = path.join(__dirname, '../uploads/downloaded-videos');
const LOG_FILE = '/var/log/prasco-video-downloader.log';

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(logMessage.trim());
  try {
    fs.appendFileSync(LOG_FILE, logMessage);
  } catch (err) {
    // Ignore log errors
  }
}

function isExternalVideoUrl(url) {
  if (!url) return false;
  const patterns = [
    /youtube\.com\/watch/i,
    /youtu\.be\//i,
    /youtube\.com\/embed/i,
    /youtube\.com\/shorts/i,
    /vimeo\.com\//i,
    /dailymotion\.com\//i,
    /twitch\.tv\//i
  ];
  return patterns.some(pattern => pattern.test(url));
}

async function downloadVideo(url, outputPath) {
  log(`Downloading video from: ${url}`);

  try {
    // Check if yt-dlp is installed
    try {
      execSync('which yt-dlp', { stdio: 'pipe' });
    } catch {
      log('ERROR: yt-dlp not found. Installing...');
      try {
        execSync('sudo pip3 install yt-dlp', { stdio: 'inherit' });
      } catch (installError) {
        log('ERROR: Failed to install yt-dlp. Please install manually: sudo pip3 install yt-dlp');
        return false;
      }
    }

    // Use yt-dlp to download video
    // -f 'best[height<=1080]' - max 1080p quality
    // --no-playlist - don't download playlists
    // -o outputPath - output filename
    const command = `yt-dlp -f 'best[height<=1080]' --no-playlist --no-mtime -o "${outputPath}" "${url}"`;

    execSync(command, { stdio: 'inherit', maxBuffer: 1024 * 1024 * 100 });

    log(`Successfully downloaded: ${path.basename(outputPath)}`);
    return true;
  } catch (error) {
    log(`ERROR downloading video: ${error.message}`);
    return false;
  }
}

async function processPost(post) {
  try {
    // Check if post has external video URL in content
    let videoUrl = null;

    // For video posts, check if content contains external URL
    if (post.contentType === 'video' && post.content) {
      // Extract URL from content (might be just URL or text with URL)
      const urlMatch = post.content.match(/(https?:\/\/[^\s<>"]+)/);
      if (urlMatch && isExternalVideoUrl(urlMatch[1])) {
        videoUrl = urlMatch[1];
      } else if (isExternalVideoUrl(post.content.trim())) {
        // Content itself is the URL
        videoUrl = post.content.trim();
      }
    }

    if (!videoUrl) {
      log(`Post ${post.id} has no external video URL`);
      return false;
    }

    // Skip if already has local media
    if (post.mediaId) {
      log(`Post ${post.id} already has local media (mediaId: ${post.mediaId})`);
      return false;
    }

    log(`Processing post ${post.id}: ${post.title}`);

    // Create output directory if it doesn't exist
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }

    // Generate filename
    const sanitizedTitle = post.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const timestamp = Date.now();
    const outputFilename = `post_${post.id}_${sanitizedTitle}_${timestamp}.mp4`;
    const outputPath = path.join(UPLOAD_DIR, outputFilename);

    // Download video
    const success = await downloadVideo(videoUrl, outputPath);

    if (!success) {
      log(`Failed to download video for post ${post.id}`);
      return false;
    }

    // Get file stats
    const stats = fs.statSync(outputPath);
    const relativeUrl = `/uploads/downloaded-videos/${outputFilename}`;

    // Create media entry
    const media = await Media.create({
      filename: outputFilename,
      originalName: `${post.title}.mp4`,
      url: relativeUrl,
      thumbnailUrl: null,
      mimeType: 'video/mp4',
      fileSize: stats.size,
      organizationId: null,
      uploadedBy: post.createdBy || 1
    });

    log(`Created media entry ${media.id} for post ${post.id}`);

    // Update post to use local media and add note about source
    await post.update({
      mediaId: media.id,
      content: `Downloaded from: ${videoUrl}`
    });

    log(`✅ Successfully processed post ${post.id}`);
    return true;

  } catch (error) {
    log(`ERROR processing post ${post.id}: ${error.message}`);
    log(`Stack: ${error.stack}`);
    return false;
  }
}

async function main() {
  try {
    log('=== PRASCO Video Downloader Started ===');

    // Connect to database
    await sequelize.authenticate();
    log('Database connected');

    // Find posts with external video URLs and no local media
    const posts = await Post.findAll({
      where: {
        contentType: 'video',
        mediaId: null
      }
    });

    log(`Found ${posts.length} video posts without local media`);

    if (posts.length === 0) {
      log('No posts to process');
      await sequelize.close();
      return;
    }

    let processed = 0;
    let failed = 0;
    let skipped = 0;

    for (const post of posts) {
      // Check if post has external video URL
      const hasExternalUrl = post.content && 
        (post.content.includes('youtube.com') || 
         post.content.includes('youtu.be') || 
         post.content.includes('vimeo.com'));
      
      if (!hasExternalUrl) {
        log(`Post ${post.id} has no external URL, skipping`);
        skipped++;
        continue;
      }

      const success = await processPost(post);
      if (success) {
        processed++;
      } else {
        failed++;
      }
    }

    log(`=== Processing Complete ===`);
    log(`Processed: ${processed} | Failed: ${failed} | Skipped: ${skipped} | Total: ${posts.length}`);

    await sequelize.close();

  } catch (error) {
    log(`FATAL ERROR: ${error.message}`);
    log(`Stack: ${error.stack}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { processPost, isExternalVideoUrl };
