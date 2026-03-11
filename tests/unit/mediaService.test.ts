import path from 'path';

// ── Mocks ──────────────────────────────────────────────────────────────────────

// Must be mocked before `import … from 'sharp'`
jest.mock('sharp', () => {
  const sharpInstance = {
    metadata: jest.fn().mockResolvedValue({ width: 1920, height: 1080 }),
    resize: jest.fn().mockReturnThis(),
    jpeg: jest.fn().mockReturnThis(),
    toFile: jest.fn().mockResolvedValue(undefined),
  };
  // sharp(path) returns the instance
  const sharpFn = jest.fn(() => sharpInstance);
  // Expose instance for assertions via sharpFn.__instance
  (sharpFn as any).__instance = sharpInstance;
  return sharpFn;
});

// Mock fs — keep existsSync and mkdirSync controllable
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  promises: {
    rename: jest.fn().mockResolvedValue(undefined),
    stat: jest.fn().mockResolvedValue({ size: 12345 }),
    unlink: jest.fn().mockResolvedValue(undefined),
  },
  existsSync: jest.fn().mockReturnValue(true),
  mkdirSync: jest.fn(),
}));

// Stub upload config so tests don't depend on real filesystem paths
jest.mock('../../src/config/upload', () => ({
  UPLOAD_PATHS: {
    BASE: '/uploads',
    ORIGINALS: '/uploads/originals',
    THUMBNAILS: '/uploads/thumbnails',
    TEMP: '/uploads/temp',
  },
  isImage: jest.fn((mimeType: string) => (mimeType as string).startsWith('image/')),
}));

// Silence logger output
jest.mock('../../src/utils/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
  securityLogger: {
    logPermissionDenied: jest.fn(),
  },
}));

// ── Imports (after mocks) ──────────────────────────────────────────────────────
import fs from 'fs';
import sharp from 'sharp';
import {
  processMedia,
  generateThumbnail,
  deleteMediaFiles,
  ProcessedMedia,
} from '../../src/services/mediaService';

// Helper to get the stable sharp instance created in the mock factory
const getSharpInstance = () => (sharp as unknown as any).__instance;

// ── Tests ──────────────────────────────────────────────────────────────────────
describe('mediaService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Restore defaults after clearAllMocks
    (fs.promises.rename as jest.Mock).mockResolvedValue(undefined);
    (fs.promises.stat as jest.Mock).mockResolvedValue({ size: 12345 });
    (fs.promises.unlink as jest.Mock).mockResolvedValue(undefined);
    (fs.existsSync as jest.Mock).mockReturnValue(true);

    const si = getSharpInstance();
    si.metadata.mockResolvedValue({ width: 1920, height: 1080 });
    si.resize.mockReturnThis();
    si.jpeg.mockReturnThis();
    si.toFile.mockResolvedValue(undefined);
  });

  // ----------------------------------------------------------------
  // processMedia
  // ----------------------------------------------------------------
  describe('processMedia', () => {
    it('should move the temp file to the originals directory', async () => {
      await processMedia('/tmp/img.jpg', 'img.jpg', 'image/jpeg');

      expect(fs.promises.rename).toHaveBeenCalledWith(
        '/tmp/img.jpg',
        path.join('/uploads/originals', 'img.jpg')
      );
    });

    it('should return the correct originalPath', async () => {
      const result = await processMedia('/tmp/doc.pdf', 'doc.pdf', 'application/pdf');
      expect(result.originalPath).toBe(path.join('/uploads/originals', 'doc.pdf'));
    });

    it('should return the file size from fs.stat', async () => {
      (fs.promises.stat as jest.Mock).mockResolvedValue({ size: 99999 });
      const result = await processMedia('/tmp/img.png', 'img.png', 'image/png');
      expect(result.size).toBe(99999);
    });

    describe('image processing', () => {
      it('should call sharp.metadata() for image files', async () => {
        const si = getSharpInstance();
        await processMedia('/tmp/photo.jpg', 'photo.jpg', 'image/jpeg');
        expect(si.metadata).toHaveBeenCalled();
      });

      it('should return width and height for images', async () => {
        const result = await processMedia('/tmp/photo.jpg', 'photo.jpg', 'image/jpeg');
        expect(result.width).toBe(1920);
        expect(result.height).toBe(1080);
      });

      it('should return a thumbnailPath for images', async () => {
        const result = await processMedia('/tmp/photo.jpg', 'photo.jpg', 'image/jpeg');
        expect(result.thumbnailPath).toBeDefined();
      });

      it('thumbnailPath should include "thumb_" prefix', async () => {
        const result = await processMedia('/tmp/photo.jpg', 'photo.jpg', 'image/jpeg');
        expect(result.thumbnailPath).toContain('thumb_');
      });
    });

    describe('non-image files', () => {
      const nonImageCases: [string, string, string][] = [
        ['doc.pdf', 'application/pdf', 'PDF'],
        ['video.mp4', 'video/mp4', 'video'],
        ['sheet.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'xlsx'],
        ['audio.mp3', 'audio/mpeg', 'audio'],
      ];

      nonImageCases.forEach(([filename, mimeType, label]) => {
        it(`should NOT generate thumbnail or dimensions for ${label}`, async () => {
          const result = await processMedia(`/tmp/${filename}`, filename, mimeType);
          expect(result.thumbnailPath).toBeUndefined();
          expect(result.width).toBeUndefined();
          expect(result.height).toBeUndefined();
        });
      });

      it('should NOT call sharp for non-images', async () => {
        await processMedia('/tmp/doc.pdf', 'doc.pdf', 'application/pdf');
        expect(sharp).not.toHaveBeenCalled();
      });
    });

    it('should return a ProcessedMedia object shape', async () => {
      const result: ProcessedMedia = await processMedia('/tmp/photo.png', 'photo.png', 'image/png');
      expect(result).toHaveProperty('originalPath');
      expect(result).toHaveProperty('size');
    });
  });

  // ----------------------------------------------------------------
  // generateThumbnail
  // ----------------------------------------------------------------
  describe('generateThumbnail', () => {
    it('should return a path containing "thumb_<filename>"', async () => {
      const thumbPath = await generateThumbnail('/uploads/originals/img.jpg', 'img.jpg');
      expect(thumbPath).toContain('thumb_img.jpg');
    });

    it('should place the thumbnail in the THUMBNAILS directory', async () => {
      const thumbPath = await generateThumbnail('/uploads/originals/img.jpg', 'img.jpg');
      expect(thumbPath.replace(/\\/g, '/')).toContain('/uploads/thumbnails');
    });

    it('should use default dimensions 300×300', async () => {
      const si = getSharpInstance();
      await generateThumbnail('/uploads/originals/img.jpg', 'img.jpg');
      expect(si.resize).toHaveBeenCalledWith(
        300,
        300,
        expect.objectContaining({ fit: 'cover' })
      );
    });

    it('should use default JPEG quality of 80', async () => {
      const si = getSharpInstance();
      await generateThumbnail('/uploads/originals/img.jpg', 'img.jpg');
      expect(si.jpeg).toHaveBeenCalledWith(expect.objectContaining({ quality: 80 }));
    });

    it('should accept custom width and height', async () => {
      const si = getSharpInstance();
      await generateThumbnail('/uploads/originals/img.jpg', 'img.jpg', { width: 200, height: 150 });
      expect(si.resize).toHaveBeenCalledWith(
        200,
        150,
        expect.objectContaining({})
      );
    });

    it('should accept custom fit option', async () => {
      const si = getSharpInstance();
      await generateThumbnail('/uploads/originals/img.jpg', 'img.jpg', { fit: 'contain' });
      expect(si.resize).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        expect.objectContaining({ fit: 'contain' })
      );
    });

    it('should accept custom JPEG quality', async () => {
      const si = getSharpInstance();
      await generateThumbnail('/uploads/originals/img.jpg', 'img.jpg', { quality: 95 });
      expect(si.jpeg).toHaveBeenCalledWith(expect.objectContaining({ quality: 95 }));
    });

    it('should call sharp.toFile() to write the thumbnail', async () => {
      const si = getSharpInstance();
      await generateThumbnail('/uploads/originals/img.jpg', 'img.jpg');
      expect(si.toFile).toHaveBeenCalled();
    });
  });

  // ----------------------------------------------------------------
  // deleteMediaFiles
  // ----------------------------------------------------------------
  describe('deleteMediaFiles', () => {
    it('should unlink the original file', async () => {
      await deleteMediaFiles('photo.jpg');
      expect(fs.promises.unlink).toHaveBeenCalledWith(
        path.join('/uploads/originals', 'photo.jpg')
      );
    });

    it('should also unlink the thumbnail when hasThumbnail=true', async () => {
      await deleteMediaFiles('photo.jpg', true);
      expect(fs.promises.unlink).toHaveBeenCalledWith(
        path.join('/uploads/thumbnails', 'thumb_photo.jpg')
      );
    });

    it('should NOT unlink thumbnail when hasThumbnail=false (default)', async () => {
      await deleteMediaFiles('photo.jpg', false);
      const calls = (fs.promises.unlink as jest.Mock).mock.calls as string[][];
      const thumbCall = calls.find((c) => c[0].includes('thumb_'));
      expect(thumbCall).toBeUndefined();
    });

    it('total of 2 unlink calls when hasThumbnail=true', async () => {
      await deleteMediaFiles('photo.jpg', true);
      expect(fs.promises.unlink).toHaveBeenCalledTimes(2);
    });

    it('total of 1 unlink call when hasThumbnail=false', async () => {
      await deleteMediaFiles('photo.jpg', false);
      expect(fs.promises.unlink).toHaveBeenCalledTimes(1);
    });

    it('should skip original deletion when file does not exist', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      await deleteMediaFiles('missing.jpg', false);
      expect(fs.promises.unlink).not.toHaveBeenCalled();
    });

    it('should skip thumbnail deletion when thumbnail does not exist', async () => {
      (fs.existsSync as jest.Mock)
        .mockReturnValueOnce(true)  // original exists
        .mockReturnValueOnce(false); // thumbnail does not

      await deleteMediaFiles('photo.jpg', true);
      // Only the original should have been deleted
      expect(fs.promises.unlink).toHaveBeenCalledTimes(1);
      expect(fs.promises.unlink).toHaveBeenCalledWith(
        path.join('/uploads/originals', 'photo.jpg')
      );
    });
  });
});
