import {
  ALLOWED_MIME_TYPES,
  ALL_ALLOWED_MIME_TYPES,
  FILE_SIZE_LIMITS,
  UPLOAD_PATHS,
} from '../../src/config/upload';

describe('Upload Configuration', () => {
  // ----------------------------------------------------------------
  // ALLOWED_MIME_TYPES
  // ----------------------------------------------------------------
  describe('ALLOWED_MIME_TYPES.IMAGE', () => {
    it('should include jpeg', () => {
      expect(ALLOWED_MIME_TYPES.IMAGE).toContain('image/jpeg');
      expect(ALLOWED_MIME_TYPES.IMAGE).toContain('image/jpg');
    });

    it('should include png', () => {
      expect(ALLOWED_MIME_TYPES.IMAGE).toContain('image/png');
    });

    it('should include gif', () => {
      expect(ALLOWED_MIME_TYPES.IMAGE).toContain('image/gif');
    });

    it('should include webp', () => {
      expect(ALLOWED_MIME_TYPES.IMAGE).toContain('image/webp');
    });

    it('should include svg+xml', () => {
      expect(ALLOWED_MIME_TYPES.IMAGE).toContain('image/svg+xml');
    });

    it('should NOT include executable or script types (security)', () => {
      expect(ALLOWED_MIME_TYPES.IMAGE).not.toContain('application/javascript');
      expect(ALLOWED_MIME_TYPES.IMAGE).not.toContain('text/html');
      expect(ALLOWED_MIME_TYPES.IMAGE).not.toContain('application/x-executable');
    });
  });

  describe('ALLOWED_MIME_TYPES.VIDEO', () => {
    it('should include mp4', () => {
      expect(ALLOWED_MIME_TYPES.VIDEO).toContain('video/mp4');
    });

    it('should include webm', () => {
      expect(ALLOWED_MIME_TYPES.VIDEO).toContain('video/webm');
    });

    it('should include ogg video', () => {
      expect(ALLOWED_MIME_TYPES.VIDEO).toContain('video/ogg');
    });

    it('should include quicktime (MOV)', () => {
      expect(ALLOWED_MIME_TYPES.VIDEO).toContain('video/quicktime');
    });
  });

  describe('ALLOWED_MIME_TYPES.DOCUMENT', () => {
    it('should include PDF', () => {
      expect(ALLOWED_MIME_TYPES.DOCUMENT).toContain('application/pdf');
    });

    it('should include .doc (MSWord)', () => {
      expect(ALLOWED_MIME_TYPES.DOCUMENT).toContain('application/msword');
    });

    it('should include .docx (OOXML Word)', () => {
      expect(ALLOWED_MIME_TYPES.DOCUMENT).toContain(
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );
    });

    it('should include .xlsx (OOXML Excel)', () => {
      expect(ALLOWED_MIME_TYPES.DOCUMENT).toContain(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
    });

    it('should include .xls (legacy Excel)', () => {
      expect(ALLOWED_MIME_TYPES.DOCUMENT).toContain('application/vnd.ms-excel');
    });

    it('should include .ods (ODF Spreadsheet)', () => {
      expect(ALLOWED_MIME_TYPES.DOCUMENT).toContain(
        'application/vnd.oasis.opendocument.spreadsheet'
      );
    });

    it('should include .odt (ODF Text)', () => {
      expect(ALLOWED_MIME_TYPES.DOCUMENT).toContain(
        'application/vnd.oasis.opendocument.text'
      );
    });

    it('should have at least 7 document MIME types', () => {
      expect(ALLOWED_MIME_TYPES.DOCUMENT.length).toBeGreaterThanOrEqual(7);
    });
  });

  describe('ALLOWED_MIME_TYPES.PRESENTATION', () => {
    it('should include .ppt (MSPowerPoint)', () => {
      expect(ALLOWED_MIME_TYPES.PRESENTATION).toContain('application/vnd.ms-powerpoint');
    });

    it('should include .pptx (OOXML PowerPoint)', () => {
      expect(ALLOWED_MIME_TYPES.PRESENTATION).toContain(
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      );
    });

    it('should include .odp (ODF Presentation)', () => {
      expect(ALLOWED_MIME_TYPES.PRESENTATION).toContain(
        'application/vnd.oasis.opendocument.presentation'
      );
    });
  });

  describe('ALLOWED_MIME_TYPES.AUDIO', () => {
    it('should include MP3', () => {
      expect(ALLOWED_MIME_TYPES.AUDIO).toContain('audio/mpeg');
    });

    it('should include WAV', () => {
      expect(ALLOWED_MIME_TYPES.AUDIO).toContain('audio/wav');
    });

    it('should include AAC', () => {
      expect(ALLOWED_MIME_TYPES.AUDIO).toContain('audio/aac');
    });

    it('should include FLAC', () => {
      expect(ALLOWED_MIME_TYPES.AUDIO).toContain('audio/flac');
    });

    it('should include OGG audio', () => {
      expect(ALLOWED_MIME_TYPES.AUDIO).toContain('audio/ogg');
    });
  });

  // ----------------------------------------------------------------
  // ALL_ALLOWED_MIME_TYPES (combination)
  // ----------------------------------------------------------------
  describe('ALL_ALLOWED_MIME_TYPES', () => {
    it('should contain every IMAGE MIME type', () => {
      ALLOWED_MIME_TYPES.IMAGE.forEach((type) => {
        expect(ALL_ALLOWED_MIME_TYPES).toContain(type);
      });
    });

    it('should contain every VIDEO MIME type', () => {
      ALLOWED_MIME_TYPES.VIDEO.forEach((type) => {
        expect(ALL_ALLOWED_MIME_TYPES).toContain(type);
      });
    });

    it('should contain every DOCUMENT MIME type', () => {
      ALLOWED_MIME_TYPES.DOCUMENT.forEach((type) => {
        expect(ALL_ALLOWED_MIME_TYPES).toContain(type);
      });
    });

    it('should contain every PRESENTATION MIME type', () => {
      ALLOWED_MIME_TYPES.PRESENTATION.forEach((type) => {
        expect(ALL_ALLOWED_MIME_TYPES).toContain(type);
      });
    });

    it('should contain every AUDIO MIME type', () => {
      ALLOWED_MIME_TYPES.AUDIO.forEach((type) => {
        expect(ALL_ALLOWED_MIME_TYPES).toContain(type);
      });
    });

    it('should NOT contain dangerous MIME types (security check)', () => {
      const dangerous = [
        'text/html',
        'application/javascript',
        'text/javascript',
        'application/x-php',
        'application/x-sh',
        'application/x-executable',
        'text/x-script',
      ];
      dangerous.forEach((type) => {
        expect(ALL_ALLOWED_MIME_TYPES).not.toContain(type);
      });
    });

    it('should have no duplicate MIME types', () => {
      const unique = new Set(ALL_ALLOWED_MIME_TYPES);
      expect(unique.size).toBe(ALL_ALLOWED_MIME_TYPES.length);
    });
  });

  // ----------------------------------------------------------------
  // FILE_SIZE_LIMITS
  // ----------------------------------------------------------------
  describe('FILE_SIZE_LIMITS', () => {
    it('should set IMAGE limit to 50 MB', () => {
      expect(FILE_SIZE_LIMITS.IMAGE).toBe(50 * 1024 * 1024);
    });

    it('should set DOCUMENT limit to 20 MB', () => {
      expect(FILE_SIZE_LIMITS.DOCUMENT).toBe(20 * 1024 * 1024);
    });

    it('should set VIDEO limit to 2 GB', () => {
      expect(FILE_SIZE_LIMITS.VIDEO).toBe(2 * 1024 * 1024 * 1024);
    });

    it('should set PRESENTATION limit to 200 MB', () => {
      expect(FILE_SIZE_LIMITS.PRESENTATION).toBe(200 * 1024 * 1024);
    });

    it('all limits should be positive numbers', () => {
      Object.values(FILE_SIZE_LIMITS).forEach((limit) => {
        expect(limit).toBeGreaterThan(0);
      });
    });
  });

  // ----------------------------------------------------------------
  // UPLOAD_PATHS
  // ----------------------------------------------------------------
  describe('UPLOAD_PATHS', () => {
    it('should define BASE path as a string', () => {
      expect(typeof UPLOAD_PATHS.BASE).toBe('string');
      expect(UPLOAD_PATHS.BASE.length).toBeGreaterThan(0);
    });

    it('ORIGINALS path should contain "originals"', () => {
      expect(UPLOAD_PATHS.ORIGINALS).toContain('originals');
    });

    it('THUMBNAILS path should contain "thumbnails"', () => {
      expect(UPLOAD_PATHS.THUMBNAILS).toContain('thumbnails');
    });

    it('TEMP path should contain "temp"', () => {
      expect(UPLOAD_PATHS.TEMP).toContain('temp');
    });

    it('all paths should be sub-paths of BASE', () => {
      expect(UPLOAD_PATHS.ORIGINALS).toContain(UPLOAD_PATHS.BASE);
      expect(UPLOAD_PATHS.THUMBNAILS).toContain(UPLOAD_PATHS.BASE);
      expect(UPLOAD_PATHS.TEMP).toContain(UPLOAD_PATHS.BASE);
    });

    it('all paths should be distinct', () => {
      const paths = Object.values(UPLOAD_PATHS);
      const unique = new Set(paths);
      expect(unique.size).toBe(paths.length);
    });
  });
});
