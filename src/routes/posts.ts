import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { validate } from '../middleware/validator';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import * as postController from '../controllers/postController';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @openapi
 * /api/posts:
 *   get:
 *     tags:
 *       - Posts
 *     summary: Alle Beiträge abrufen
 *     description: Listet alle Beiträge mit optionalen Filtern und Pagination. Erfordert 'posts.read' Permission.
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - $ref: '#/components/parameters/CategoryIdParam'
 *       - $ref: '#/components/parameters/ActiveParam'
 *     responses:
 *       200:
 *         description: Liste aller Beiträge
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     posts:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Post'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/',
  requirePermission('posts.read'),
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Seite muss eine positive Zahl sein'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit muss zwischen 1 und 100 liegen'),
    query('category').optional().isInt().withMessage('Kategorie-ID muss eine Zahl sein'),
    query('isActive').optional().isBoolean().withMessage('isActive muss boolean sein'),
    validate,
  ],
  postController.getAllPosts
);

/**
 * @openapi
 * /api/posts/reorder:
 *   put:
 *     tags:
 *       - Posts
 *     summary: Beiträge neu sortieren
 *     description: Aktualisiert die Reihenfolge/Priorität mehrerer Beiträge basierend auf Drag & Drop. Erfordert 'posts.update' Permission.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderedIds
 *             properties:
 *               orderedIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array von Post-IDs in der gewünschten Reihenfolge (erstes Element = höchste Priorität)
 *                 example: [3, 1, 5, 2, 4]
 *     responses:
 *       200:
 *         description: Reihenfolge erfolgreich aktualisiert
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *     security:
 *       - bearerAuth: []
 */
router.put(
  '/reorder',
  requirePermission('posts.update'),
  [
    body('orderedIds')
      .isArray({ min: 1 })
      .withMessage('orderedIds muss ein nicht-leeres Array sein'),
    body('orderedIds.*').isInt({ min: 1 }).withMessage('Alle IDs müssen positive Zahlen sein'),
    validate,
  ],
  postController.reorderPosts
);

/**
 * @openapi
 * /api/posts/{id}:
 *   get:
 *     tags:
 *       - Posts
 *     summary: Einzelnen Beitrag abrufen
 *     description: Holt einen spezifischen Beitrag anhand seiner ID. Erfordert 'posts.read' Permission.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Beitrags-ID
 *     responses:
 *       200:
 *         description: Beitrag erfolgreich abgerufen
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Post'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/:id',
  requirePermission('posts.read'),
  [param('id').isInt().withMessage('Ungültige Post-ID'), validate],
  postController.getPostById
);

/**
 * @openapi
 * /api/posts:
 *   post:
 *     tags:
 *       - Posts
 *     summary: Neuen Beitrag erstellen
 *     description: Erstellt einen neuen Bulletin Board Beitrag. Erfordert 'posts.create' Permission (Editor/Admin).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *               - contentType
 *             properties:
 *               title:
 *                 type: string
 *                 example: Wichtige Ankündigung
 *               content:
 *                 type: string
 *                 example: Das ist der Inhalt des Beitrags
 *               contentType:
 *                 type: string
 *                 enum: [text, image, video, html]
 *                 example: text
 *               categoryId:
 *                 type: integer
 *                 example: 1
 *               mediaId:
 *                 type: integer
 *                 nullable: true
 *                 example: 5
 *               duration:
 *                 type: integer
 *                 minimum: 1
 *                 example: 10
 *                 description: Anzeigedauer in Sekunden
 *               priority:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 10
 *                 example: 5
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Beitrag erfolgreich erstellt
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Beitrag erfolgreich erstellt
 *                 data:
 *                   $ref: '#/components/schemas/Post'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/',
  requirePermission('posts.create'),
  [
    body('title').notEmpty().trim().withMessage('Titel erforderlich'),
    body('content').optional(),
    body('contentType')
      .isIn(['text', 'image', 'video', 'html', 'presentation'])
      .withMessage('Ungültiger Content-Type'),
    body('categoryId').optional().isInt().withMessage('Kategorie-ID muss eine Zahl sein'),
    body('mediaId').optional().isInt().withMessage('Media-ID muss eine Zahl sein'),
    body('duration')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Dauer muss mindestens 1 Sekunde sein'),
    body('priority')
      .optional()
      .isInt({ min: 0, max: 10 })
      .withMessage('Priorität muss zwischen 0 und 10 liegen'),
    body('startDate').optional().isISO8601().withMessage('Ungültiges Start-Datum'),
    body('endDate').optional().isISO8601().withMessage('Ungültiges End-Datum'),
    body('isActive').optional().isBoolean().withMessage('isActive muss boolean sein'),
    validate,
  ],
  postController.createPost
);

/**
 * @openapi
 * /api/posts/{id}:
 *   put:
 *     tags:
 *       - Posts
 *     summary: Beitrag aktualisieren
 *     description: Aktualisiert einen existierenden Beitrag. Erfordert 'posts.update' Permission (Editor/Admin).
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Beitrags-ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               contentType:
 *                 type: string
 *                 enum: [text, image, video, html]
 *               categoryId:
 *                 type: integer
 *               mediaId:
 *                 type: integer
 *                 nullable: true
 *               duration:
 *                 type: integer
 *               priority:
 *                 type: integer
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Beitrag erfolgreich aktualisiert
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Post'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *     security:
 *       - bearerAuth: []
 */
router.put(
  '/:id',
  requirePermission('posts.update'),
  [
    param('id').isInt().withMessage('Ungültige Post-ID'),
    body('title').optional().trim().notEmpty().withMessage('Titel darf nicht leer sein'),
    body('content').optional(),
    body('contentType')
      .optional()
      .isIn(['text', 'image', 'video', 'html', 'presentation'])
      .withMessage('Ungültiger Content-Type'),
    body('categoryId').optional().isInt().withMessage('Kategorie-ID muss eine Zahl sein'),
    body('mediaId').optional().isInt().withMessage('Media-ID muss eine Zahl sein'),
    body('duration')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Dauer muss mindestens 1 Sekunde sein'),
    body('priority')
      .optional()
      .isInt({ min: 0, max: 10 })
      .withMessage('Priorität muss zwischen 0 und 10 liegen'),
    body('startDate').optional().isISO8601().withMessage('Ungültiges Start-Datum'),
    body('endDate').optional().isISO8601().withMessage('Ungültiges End-Datum'),
    body('isActive').optional().isBoolean().withMessage('isActive muss boolean sein'),
    validate,
  ],
  postController.updatePost
);

/**
 * @openapi
 * /api/posts/{id}:
 *   delete:
 *     tags:
 *       - Posts
 *     summary: Beitrag löschen
 *     description: Löscht einen Beitrag permanent. Erfordert 'posts.delete' Permission (Admin/Super-Admin).
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Beitrags-ID
 *     responses:
 *       200:
 *         description: Beitrag erfolgreich gelöscht
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/:id',
  requirePermission('posts.delete'),
  [param('id').isInt().withMessage('Ungültige Post-ID'), validate],
  postController.deletePost
);

/**
 * @openapi
 * /api/posts:
 *   delete:
 *     tags:
 *       - Posts
 *     summary: Alle Beiträge löschen
 *     description: Löscht alle Beiträge. Nur für Admins. Erfordert 'posts.manage' Permission.
 *     responses:
 *       200:
 *         description: Erfolgreich gelöscht
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 deletedCount:
 *                   type: number
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/',
  requirePermission('posts.manage'),
  postController.deleteAllPosts
);

export default router;
