import sharp from "sharp";
import fs from "fs";
import path from "path";
import { UPLOAD_PATHS, isImage } from "../config/upload";
import logger from "../utils/logger";

export interface ProcessedMedia {
    originalPath: string;
    thumbnailPath?: string;
    width?: number;
    height?: number;
    size: number;
}

export interface ThumbnailOptions {
    width: number;
    height: number;
    fit: "cover" | "contain" | "fill" | "inside" | "outside";
    quality: number;
}

const DEFAULT_THUMBNAIL_OPTIONS: ThumbnailOptions = {
    width: 300,
    height: 300,
    fit: "cover",
    quality: 80,
};

// Max dimensions for stored originals (larger images are resized down)
const MAX_IMAGE_WIDTH  = 1920;
const MAX_IMAGE_HEIGHT = 1080;

export const processMedia = async (
    tempFilePath: string,
    filename: string,
    mimeType: string
): Promise<ProcessedMedia> => {
    const originalPath = path.join(UPLOAD_PATHS.ORIGINALS, filename);

    if (isImage(mimeType) && mimeType !== 'image/gif' && mimeType !== 'image/svg+xml') {
        // Resize and compress before moving to originals
        const meta = await sharp(tempFilePath).metadata();
        const needsResize = (meta.width ?? 0) > MAX_IMAGE_WIDTH || (meta.height ?? 0) > MAX_IMAGE_HEIGHT;

        let pipeline = sharp(tempFilePath).rotate(); // auto-rotate from EXIF

        if (needsResize) {
            pipeline = pipeline.resize(MAX_IMAGE_WIDTH, MAX_IMAGE_HEIGHT, {
                fit: 'inside',
                withoutEnlargement: true,
            });
        }

        // Re-encode: JPEG/WebP → high-quality JPEG, PNG → compressed PNG
        const ext = path.extname(filename).toLowerCase();
        if (ext === '.png') {
            pipeline = pipeline.png({ compressionLevel: 8, adaptiveFiltering: true });
        } else if (ext === '.webp') {
            pipeline = pipeline.webp({ quality: 85 });
        } else {
            pipeline = pipeline.jpeg({ quality: 85, mozjpeg: true });
        }

        await pipeline.toFile(originalPath);
        await fs.promises.unlink(tempFilePath);
    } else {
        // Videos, PDFs, GIFs, SVGs – unverändert speichern
        await fs.promises.rename(tempFilePath, originalPath);
    }

    const stats = await fs.promises.stat(originalPath);
    const result: ProcessedMedia = {
        originalPath,
        size: stats.size,
    };

    if (isImage(mimeType)) {
        const metadata = await sharp(originalPath).metadata();
        result.width = metadata.width;
        result.height = metadata.height;
        result.thumbnailPath = await generateThumbnail(originalPath, filename);
        logger.info(`Image processed: ${filename} (${result.width}x${result.height}, ${Math.round(result.size / 1024)} KB)`);
    }

    return result;
};

export const generateThumbnail = async (
    originalPath: string,
    filename: string,
    options: Partial<ThumbnailOptions> = {}
): Promise<string> => {
    const opts = { ...DEFAULT_THUMBNAIL_OPTIONS, ...options };
    const thumbnailFilename = `thumb_${filename}`;
    const thumbnailPath = path.join(UPLOAD_PATHS.THUMBNAILS, thumbnailFilename);

    await sharp(originalPath)
        .resize(opts.width, opts.height, {
            fit: opts.fit,
            position: "center",
            background: { r: 255, g: 255, b: 255, alpha: 1 },
        })
        .jpeg({ quality: opts.quality })
        .toFile(thumbnailPath);

    return thumbnailPath;
};

export const deleteMediaFiles = async (filename: string, hasThumbnail: boolean = false): Promise<void> => {
    const originalPath = path.join(UPLOAD_PATHS.ORIGINALS, filename);
    if (fs.existsSync(originalPath)) {
        await fs.promises.unlink(originalPath);
    }

    if (hasThumbnail) {
        const thumbnailPath = path.join(UPLOAD_PATHS.THUMBNAILS, `thumb_${filename}`);
        if (fs.existsSync(thumbnailPath)) {
            await fs.promises.unlink(thumbnailPath);
        }
    }
};
