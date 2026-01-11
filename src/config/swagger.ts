import swaggerJsdoc, { Options } from 'swagger-jsdoc';

const options: Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Prasco Digital Bulletin Board API',
      version: '2.0.0',
      description:
        'REST API für das digitale schwarze Brett mit Enhanced RBAC, Media Upload und Security Features',
      contact: {
        name: 'Prasco Team',
        email: 'admin@prasco.net',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'https://192.168.2.47:3000',
        description: 'Raspberry Pi Production (HTTPS)',
      },
      {
        url: 'http://192.168.2.47:3000',
        description: 'Raspberry Pi Production (HTTP)',
      },
      {
        url: 'http://localhost:3000',
        description: 'Development Server',
      },
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and token management',
      },
      {
        name: 'Posts',
        description: 'Content management for bulletin board posts',
      },
      {
        name: 'Categories',
        description: 'Category management for organizing posts',
      },
      {
        name: 'Media',
        description: 'Image and video upload with thumbnail generation',
      },
      {
        name: 'Public',
        description: 'Public endpoints for display without authentication',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Access Token (erhalten via /api/auth/login)',
        },
      },
      schemas: {
        // User Schema
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            email: { type: 'string', format: 'email', example: 'admin@prasco.net' },
            firstName: { type: 'string', example: 'Max' },
            lastName: { type: 'string', example: 'Mustermann' },
            role: {
              type: 'string',
              enum: ['super_admin', 'admin', 'editor', 'viewer', 'display'],
              example: 'editor',
            },
            organizationId: { type: 'integer', nullable: true, example: 1 },
            isActive: { type: 'boolean', example: true },
            lastLogin: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },

        // Post Schema
        Post: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            title: { type: 'string', example: 'Wichtige Ankündigung' },
            content: { type: 'string', example: 'Das ist der Inhalt des Beitrags' },
            contentType: {
              type: 'string',
              enum: ['text', 'image', 'video', 'html'],
              example: 'text',
            },
            mediaUrl: { type: 'string', nullable: true, example: '/uploads/image.jpg' },
            categoryId: { type: 'integer', example: 1 },
            authorId: { type: 'integer', example: 5 },
            organizationId: { type: 'integer', example: 1 },
            startDate: { type: 'string', format: 'date-time', nullable: true },
            endDate: { type: 'string', format: 'date-time', nullable: true },
            isActive: { type: 'boolean', example: true },
            displayOrder: { type: 'integer', example: 0 },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },

        // Category Schema
        Category: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Ankündigungen' },
            description: { type: 'string', nullable: true, example: 'Wichtige Unternehmensnews' },
            color: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$', example: '#FF5733' },
            organizationId: { type: 'integer', example: 1 },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },

        // Media Schema
        Media: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            filename: { type: 'string', example: '1732360800000-a3b5c7d9.jpg' },
            originalName: { type: 'string', example: 'company-logo.jpg' },
            mimeType: { type: 'string', example: 'image/jpeg' },
            size: { type: 'integer', example: 1048576, description: 'File size in bytes' },
            path: { type: 'string', example: '/uploads/originals/1732360800000-a3b5c7d9.jpg' },
            thumbnailPath: {
              type: 'string',
              nullable: true,
              example: '/uploads/thumbnails/1732360800000-a3b5c7d9.jpg',
            },
            width: { type: 'integer', nullable: true, example: 1920 },
            height: { type: 'integer', nullable: true, example: 1080 },
            uploadedById: { type: 'integer', example: 5 },
            organizationId: { type: 'integer', example: 1 },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },

        // Permission Schema
        Permission: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'posts.create' },
            description: { type: 'string', example: 'Erlaubt das Erstellen neuer Beiträge' },
            resource: { type: 'string', example: 'posts' },
            action: { type: 'string', example: 'create' },
          },
        },

        // Error Response Schema
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            statusCode: { type: 'integer', example: 400 },
            message: { type: 'string', example: 'Validation error' },
            errors: {
              type: 'array',
              items: { type: 'string' },
              example: ['Email ist erforderlich', 'Passwort zu kurz'],
            },
          },
        },

        // Success Response Schema
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Operation successful' },
            data: { type: 'object' },
          },
        },

        // Pagination Schema
        Pagination: {
          type: 'object',
          properties: {
            total: { type: 'integer', example: 100 },
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 10 },
            totalPages: { type: 'integer', example: 10 },
          },
        },
      },
      responses: {
        Unauthorized: {
          description: 'Nicht autorisiert - Token fehlt oder ungültig',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                statusCode: 401,
                message: 'Kein Token gefunden. Authentifizierung erforderlich.',
              },
            },
          },
        },
        Forbidden: {
          description: 'Zugriff verweigert - Unzureichende Berechtigungen',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                statusCode: 403,
                message: 'Keine Berechtigung für diese Aktion',
              },
            },
          },
        },
        NotFound: {
          description: 'Ressource nicht gefunden',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                statusCode: 404,
                message: 'Ressource nicht gefunden',
              },
            },
          },
        },
        ValidationError: {
          description: 'Validierungsfehler - Ungültige Eingabedaten',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                statusCode: 400,
                message: 'Validation error',
                errors: ['Email ist erforderlich', 'Passwort muss mindestens 6 Zeichen lang sein'],
              },
            },
          },
        },
        RateLimitExceeded: {
          description: 'Rate Limit überschritten - Zu viele Anfragen',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                statusCode: 429,
                message: 'Zu viele Anfragen von dieser IP, bitte versuchen Sie es später erneut.',
              },
            },
          },
        },
      },
      parameters: {
        PageParam: {
          in: 'query',
          name: 'page',
          schema: { type: 'integer', minimum: 1, default: 1 },
          description: 'Seitennummer für Pagination',
        },
        LimitParam: {
          in: 'query',
          name: 'limit',
          schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
          description: 'Anzahl der Ergebnisse pro Seite',
        },
        CategoryIdParam: {
          in: 'query',
          name: 'categoryId',
          schema: { type: 'integer' },
          description: 'Filter nach Kategorie-ID',
        },
        ActiveParam: {
          in: 'query',
          name: 'active',
          schema: { type: 'boolean' },
          description: 'Filter nach aktiven/inaktiven Einträgen',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts'], // Path to route files for JSDoc comments
};

export const swaggerSpec = swaggerJsdoc(options);
