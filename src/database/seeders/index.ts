import { logger } from '../../utils/logger';
import { User, Organization, Category, Post } from '../../models';
import { seedPermissions } from './permissions';

export const seedDatabase = async (): Promise<void> => {
  try {
    logger.info('🌱 Starte Database-Seeding...');

    // Seed permissions first
    await seedPermissions();

    // 1. Create PRASCO Organization
    const [prasco] = await Organization.findOrCreate({
      where: { slug: 'prasco' },
      defaults: {
        name: 'PRASCO GmbH',
        slug: 'prasco',
        logoUrl: 'https://www.prasco.net/content/files/images/Prasco/logo-small.png',
        primaryColor: '#c41e3a',
        isActive: true,
        maxUsers: 50,
        maxDisplays: 10,
      },
    });
    logger.info('✅ Organization PRASCO erstellt');

    // 2. Create Super Admin User
    const [superAdmin, superAdminCreated] = await User.findOrCreate({
      where: { email: 'superadmin@prasco.net' },
      defaults: {
        email: 'superadmin@prasco.net',
        password: 'superadmin123',
        firstName: 'Super',
        lastName: 'Admin',
        role: 'super_admin',
        organizationId: prasco.id,
        isActive: true,
      },
    });
    logger.info(
      superAdminCreated
        ? '✅ Super-Admin-User erstellt'
        : `✅ Super-Admin-User existiert bereits (ID: ${superAdmin.id})`
    );

    // 3. Create Admin User
    const [admin] = await User.findOrCreate({
      where: { email: 'admin@prasco.net' },
      defaults: {
        email: 'admin@prasco.net',
        password: 'admin123',
        firstName: 'Admin',
        lastName: 'PRASCO',
        role: 'admin',
        organizationId: prasco.id,
        isActive: true,
      },
    });
    logger.info('✅ Admin-User erstellt');

    // 4. Create Test Editor
    const [editor] = await User.findOrCreate({
      where: { email: 'editor@prasco.net' },
      defaults: {
        email: 'editor@prasco.net',
        password: 'editor123',
        firstName: 'Editor',
        lastName: 'Test',
        role: 'editor',
        organizationId: prasco.id,
        isActive: true,
      },
    });
    logger.info('✅ Editor-User erstellt');

    // 4. Create Categories
    const categories = [
      { name: 'Ankündigungen', color: '#c41e3a', icon: '◆' },
      { name: 'Veranstaltungen', color: '#1e90ff', icon: '◇' },
      { name: 'Wichtige Infos', color: '#ff6b6b', icon: '▲' },
      { name: 'Erfolge', color: '#4caf50', icon: '★' },
    ];

    for (const cat of categories) {
      await Category.findOrCreate({
        where: { name: cat.name, organizationId: prasco.id },
        defaults: {
          ...cat,
          organizationId: prasco.id,
          isActive: true,
        },
      });
    }
    logger.info('✅ Kategorien erstellt');

    // 5. Create Sample Posts - NUR wenn noch keine Posts existieren
    const existingPostCount = await Post.count();

    if (existingPostCount > 0) {
      logger.info(`⏭️  ${existingPostCount} Posts existieren bereits - Seeding übersprungen`);
      logger.info('🌱 Database-Seeding abgeschlossen (Posts beibehalten)');
      return;
    }

    logger.info('📝 Keine Posts gefunden - erstelle Demo-Posts...');

    const announcementCategory = await Category.findOne({
      where: { name: 'Ankündigungen', organizationId: prasco.id },
    });

    const eventCategory = await Category.findOne({
      where: { name: 'Veranstaltungen', organizationId: prasco.id },
    });

    if (announcementCategory && eventCategory) {
      await Post.findOrCreate({
        where: { title: 'Willkommen bei PRASCO!' },
        defaults: {
          title: 'Willkommen bei PRASCO!',
          content:
            'Herzlich willkommen auf unserem neuen digitalen Schwarzen Brett. Hier finden Sie alle wichtigen Informationen und Ankündigungen.',
          contentType: 'text',
          categoryId: announcementCategory.id,
          organizationId: prasco.id,
          createdBy: admin.id,
          duration: 10,
          priority: 5,
          isActive: true,
        },
      });

      await Post.findOrCreate({
        where: { title: 'Team-Meeting nächste Woche' },
        defaults: {
          title: 'Team-Meeting nächste Woche',
          content:
            'Unser nächstes Team-Meeting findet am Montag um 10:00 Uhr im Konferenzraum A statt. Bitte bereitet eure Präsentationen vor.',
          contentType: 'text',
          categoryId: eventCategory.id,
          organizationId: prasco.id,
          createdBy: editor.id,
          startDate: new Date(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          duration: 15,
          priority: 3,
          isActive: true,
        },
      });

      await Post.findOrCreate({
        where: { title: 'Neue Projekte starten!' },
        defaults: {
          title: 'Neue Projekte starten!',
          content:
            'Wir freuen uns, drei neue spannende Projekte anzukündigen. Weitere Details folgen in Kürze.',
          contentType: 'text',
          categoryId: announcementCategory.id,
          organizationId: prasco.id,
          createdBy: admin.id,
          duration: 12,
          priority: 4,
          isActive: true,
        },
      });

      // Software Presentation Posts
      const successCategory = await Category.findOne({
        where: { name: 'Erfolge', organizationId: prasco.id },
      });

      const infoCategory = await Category.findOne({
        where: { name: 'Wichtige Infos', organizationId: prasco.id },
      });

      // Slide 1: Welcome & Overview
      await Post.findOrCreate({
        where: { title: '🎯 Digitales Schwarzes Brett - PRASCO' },
        defaults: {
          title: '🎯 Digitales Schwarzes Brett - PRASCO',
          content: `
            <div style="text-align: center; padding: 60px 40px; background: linear-gradient(135deg, #c41e3a 0%, #8b1528 100%); color: white; border-radius: 20px; height: 100%;">
              <h1 style="font-size: 72px; margin-bottom: 30px; font-weight: 700; text-shadow: 3px 3px 6px rgba(0,0,0,0.3);">
                Digitales Schwarzes Brett
              </h1>
              <h2 style="font-size: 48px; margin-bottom: 60px; font-weight: 300; opacity: 0.95;">
                Moderne Kommunikation für PRASCO
              </h2>
              <div style="font-size: 32px; line-height: 1.8; opacity: 0.9;">
                <p>📱 Zentrale Informationsplattform</p>
                <p>🔄 Automatische Rotation</p>
                <p>⚡ Echtzeit-Updates</p>
                <p>🎨 Ansprechendes Design</p>
              </div>
            </div>
          `,
          contentType: 'html',
          categoryId: announcementCategory.id,
          organizationId: prasco.id,
          createdBy: admin.id,
          duration: 15,
          priority: 10,
          isActive: true,
        },
      });

      // Slide 2: Key Features
      await Post.findOrCreate({
        where: { title: '✨ Hauptfunktionen' },
        defaults: {
          title: '✨ Hauptfunktionen',
          content: `
            <div style="padding: 50px 60px; background: linear-gradient(to bottom, #f8f9fa 0%, #e9ecef 100%);">
              <h2 style="color: #c41e3a; font-size: 56px; margin-bottom: 50px; text-align: center; font-weight: 700;">
                Funktionen im Überblick
              </h2>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; font-size: 28px;">
                <div style="background: white; padding: 40px; border-radius: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                  <h3 style="color: #c41e3a; font-size: 36px; margin-bottom: 20px;">📢 Content-Management</h3>
                  <ul style="line-height: 2;">
                    <li>Text, Bilder & Videos</li>
                    <li>HTML-Unterstützung</li>
                    <li>Kategorisierung</li>
                    <li>Zeitplanung</li>
                  </ul>
                </div>
                <div style="background: white; padding: 40px; border-radius: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                  <h3 style="color: #c41e3a; font-size: 36px; margin-bottom: 20px;">⚙️ Administration</h3>
                  <ul style="line-height: 2;">
                    <li>Web-Interface</li>
                    <li>Benutzerverwaltung</li>
                    <li>Rollen & Rechte</li>
                    <li>REST API</li>
                  </ul>
                </div>
                <div style="background: white; padding: 40px; border-radius: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                  <h3 style="color: #c41e3a; font-size: 36px; margin-bottom: 20px;">🎨 Display</h3>
                  <ul style="line-height: 2;">
                    <li>Vollbild-Modus</li>
                    <li>Auto-Rotation</li>
                    <li>Responsive Design</li>
                    <li>Prioritäten</li>
                  </ul>
                </div>
                <div style="background: white; padding: 40px; border-radius: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                  <h3 style="color: #c41e3a; font-size: 36px; margin-bottom: 20px;">🔒 Sicherheit</h3>
                  <ul style="line-height: 2;">
                    <li>JWT Authentication</li>
                    <li>Rollen-System</li>
                    <li>Rate Limiting</li>
                    <li>CSP Protection</li>
                  </ul>
                </div>
              </div>
            </div>
          `,
          contentType: 'html',
          categoryId: infoCategory?.id || announcementCategory.id,
          organizationId: prasco.id,
          createdBy: admin.id,
          duration: 18,
          priority: 9,
          isActive: true,
        },
      });

      // Slide 3: Technology Stack
      await Post.findOrCreate({
        where: { title: '🛠️ Technologie-Stack' },
        defaults: {
          title: '🛠️ Technologie-Stack',
          content: `
            <div style="padding: 50px 60px; background: #1a1a2e; color: white;">
              <h2 style="color: #c41e3a; font-size: 56px; margin-bottom: 50px; text-align: center; font-weight: 700;">
                Moderne Technologien
              </h2>
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 40px; font-size: 24px;">
                <div style="text-align: center; padding: 30px; background: rgba(196, 30, 58, 0.1); border-radius: 15px; border: 2px solid #c41e3a;">
                  <div style="font-size: 72px; margin-bottom: 20px;">⚡</div>
                  <h3 style="color: #c41e3a; font-size: 32px; margin-bottom: 15px;">Backend</h3>
                  <p style="line-height: 1.8;">Node.js<br/>Express<br/>TypeScript<br/>PostgreSQL</p>
                </div>
                <div style="text-align: center; padding: 30px; background: rgba(196, 30, 58, 0.1); border-radius: 15px; border: 2px solid #c41e3a;">
                  <div style="font-size: 72px; margin-bottom: 20px;">🎨</div>
                  <h3 style="color: #c41e3a; font-size: 32px; margin-bottom: 15px;">Frontend</h3>
                  <p style="line-height: 1.8;">HTML5<br/>CSS3<br/>JavaScript ES6+<br/>Responsive</p>
                </div>
                <div style="text-align: center; padding: 30px; background: rgba(196, 30, 58, 0.1); border-radius: 15px; border: 2px solid #c41e3a;">
                  <div style="font-size: 72px; margin-bottom: 20px;">🔒</div>
                  <h3 style="color: #c41e3a; font-size: 32px; margin-bottom: 15px;">Security</h3>
                  <p style="line-height: 1.8;">JWT Auth<br/>Helmet.js<br/>Rate Limiting<br/>Permissions</p>
                </div>
                <div style="text-align: center; padding: 30px; background: rgba(196, 30, 58, 0.1); border-radius: 15px; border: 2px solid #c41e3a;">
                  <div style="font-size: 72px; margin-bottom: 20px;">📦</div>
                  <h3 style="color: #c41e3a; font-size: 32px; margin-bottom: 15px;">ORM</h3>
                  <p style="line-height: 1.8;">Sequelize<br/>Migrations<br/>Seeders<br/>Relations</p>
                </div>
                <div style="text-align: center; padding: 30px; background: rgba(196, 30, 58, 0.1); border-radius: 15px; border: 2px solid #c41e3a;">
                  <div style="font-size: 72px; margin-bottom: 20px;">📡</div>
                  <h3 style="color: #c41e3a; font-size: 32px; margin-bottom: 15px;">API</h3>
                  <p style="line-height: 1.8;">REST<br/>Swagger Docs<br/>JSON<br/>Validation</p>
                </div>
                <div style="text-align: center; padding: 30px; background: rgba(196, 30, 58, 0.1); border-radius: 15px; border: 2px solid #c41e3a;">
                  <div style="font-size: 72px; margin-bottom: 20px;">🚀</div>
                  <h3 style="color: #c41e3a; font-size: 32px; margin-bottom: 15px;">Deployment</h3>
                  <p style="line-height: 1.8;">Docker<br/>PM2<br/>Raspberry Pi<br/>Linux</p>
                </div>
              </div>
            </div>
          `,
          contentType: 'html',
          categoryId: infoCategory?.id || announcementCategory.id,
          organizationId: prasco.id,
          createdBy: admin.id,
          duration: 18,
          priority: 8,
          isActive: true,
        },
      });

      // Slide 4: Architecture
      await Post.findOrCreate({
        where: { title: '🏗️ System-Architektur' },
        defaults: {
          title: '🏗️ System-Architektur',
          content: `
            <div style="padding: 50px 60px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
              <h2 style="font-size: 56px; margin-bottom: 50px; text-align: center; font-weight: 700; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">
                Multi-Tenant Architektur
              </h2>
              <div style="display: flex; justify-content: space-around; align-items: center; font-size: 26px;">
                <div style="text-align: center;">
                  <div style="background: white; color: #667eea; padding: 40px; border-radius: 20px; margin-bottom: 20px; font-size: 48px; font-weight: bold; box-shadow: 0 8px 20px rgba(0,0,0,0.2);">
                    Display<br/>Layer
                  </div>
                  <p style="font-size: 22px;">Raspberry Pi<br/>Auto-Rotation<br/>Fullscreen</p>
                </div>
                <div style="font-size: 60px; opacity: 0.8;">→</div>
                <div style="text-align: center;">
                  <div style="background: white; color: #667eea; padding: 40px; border-radius: 20px; margin-bottom: 20px; font-size: 48px; font-weight: bold; box-shadow: 0 8px 20px rgba(0,0,0,0.2);">
                    Admin<br/>Interface
                  </div>
                  <p style="font-size: 22px;">Web Dashboard<br/>Content-Mgmt<br/>User-Mgmt</p>
                </div>
                <div style="font-size: 60px; opacity: 0.8;">→</div>
                <div style="text-align: center;">
                  <div style="background: white; color: #667eea; padding: 40px; border-radius: 20px; margin-bottom: 20px; font-size: 48px; font-weight: bold; box-shadow: 0 8px 20px rgba(0,0,0,0.2);">
                    REST<br/>API
                  </div>
                  <p style="font-size: 22px;">Express.js<br/>JWT Auth<br/>Validation</p>
                </div>
                <div style="font-size: 60px; opacity: 0.8;">→</div>
                <div style="text-align: center;">
                  <div style="background: white; color: #667eea; padding: 40px; border-radius: 20px; margin-bottom: 20px; font-size: 48px; font-weight: bold; box-shadow: 0 8px 20px rgba(0,0,0,0.2);">
                    Database
                  </div>
                  <p style="font-size: 22px;">PostgreSQL<br/>Sequelize<br/>Multi-Tenant</p>
                </div>
              </div>
              <div style="margin-top: 60px; text-align: center; font-size: 28px; background: rgba(255,255,255,0.1); padding: 30px; border-radius: 15px;">
                <strong>Multi-Tenant Features:</strong> Organization Isolation • Role-Based Permissions • Separate Displays • Scalable Architecture
              </div>
            </div>
          `,
          contentType: 'html',
          categoryId: infoCategory?.id || announcementCategory.id,
          organizationId: prasco.id,
          createdBy: admin.id,
          duration: 20,
          priority: 7,
          isActive: true,
        },
      });

      // Slide 5: Benefits
      await Post.findOrCreate({
        where: { title: '🎁 Vorteile für PRASCO' },
        defaults: {
          title: '🎁 Vorteile für PRASCO',
          content: `
            <div style="padding: 50px 60px; background: linear-gradient(to right, #43e97b 0%, #38f9d7 100%);">
              <h2 style="color: #1a1a2e; font-size: 56px; margin-bottom: 50px; text-align: center; font-weight: 700;">
                Mehrwert für das Unternehmen
              </h2>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; font-size: 26px; color: #1a1a2e;">
                <div style="background: rgba(255,255,255,0.9); padding: 40px; border-radius: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                  <h3 style="color: #c41e3a; font-size: 40px; margin-bottom: 25px;">💰 Kosteneffizienz</h3>
                  <ul style="line-height: 2.2;">
                    <li>Keine Papier-Kosten</li>
                    <li>Kein manueller Aufwand</li>
                    <li>Zentrale Verwaltung</li>
                    <li>Skalierbar</li>
                  </ul>
                </div>
                <div style="background: rgba(255,255,255,0.9); padding: 40px; border-radius: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                  <h3 style="color: #c41e3a; font-size: 40px; margin-bottom: 25px;">⏱️ Zeitersparnis</h3>
                  <ul style="line-height: 2.2;">
                    <li>Sofortige Updates</li>
                    <li>Automatische Rotation</li>
                    <li>Web-basiert</li>
                    <li>Keine Wartung</li>
                  </ul>
                </div>
                <div style="background: rgba(255,255,255,0.9); padding: 40px; border-radius: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                  <h3 style="color: #c41e3a; font-size: 40px; margin-bottom: 25px;">📊 Professionalität</h3>
                  <ul style="line-height: 2.2;">
                    <li>Modernes Design</li>
                    <li>Corporate Identity</li>
                    <li>Dynamische Inhalte</li>
                    <li>Multimedia-Support</li>
                  </ul>
                </div>
                <div style="background: rgba(255,255,255,0.9); padding: 40px; border-radius: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                  <h3 style="color: #c41e3a; font-size: 40px; margin-bottom: 25px;">🔄 Flexibilität</h3>
                  <ul style="line-height: 2.2;">
                    <li>Beliebig viele Displays</li>
                    <li>Remote-Verwaltung</li>
                    <li>Mehrere Kategorien</li>
                    <li>Zeitgesteuert</li>
                  </ul>
                </div>
              </div>
            </div>
          `,
          contentType: 'html',
          categoryId: successCategory?.id || announcementCategory.id,
          organizationId: prasco.id,
          createdBy: admin.id,
          duration: 18,
          priority: 6,
          isActive: true,
        },
      });

      // Slide 6: Use Cases
      await Post.findOrCreate({
        where: { title: '💼 Anwendungsfälle' },
        defaults: {
          title: '💼 Anwendungsfälle',
          content: `
            <div style="padding: 50px 60px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white;">
              <h2 style="font-size: 56px; margin-bottom: 50px; text-align: center; font-weight: 700; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">
                Einsatzmöglichkeiten
              </h2>
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px; font-size: 24px;">
                <div style="background: rgba(255,255,255,0.15); padding: 35px; border-radius: 15px; backdrop-filter: blur(10px);">
                  <div style="font-size: 56px; margin-bottom: 20px;">📢</div>
                  <h3 style="font-size: 32px; margin-bottom: 15px; font-weight: 600;">Ankündigungen</h3>
                  <p style="line-height: 1.8;">Wichtige Mitteilungen, News, Updates</p>
                </div>
                <div style="background: rgba(255,255,255,0.15); padding: 35px; border-radius: 15px; backdrop-filter: blur(10px);">
                  <div style="font-size: 56px; margin-bottom: 20px;">📅</div>
                  <h3 style="font-size: 32px; margin-bottom: 15px; font-weight: 600;">Events</h3>
                  <p style="line-height: 1.8;">Meetings, Termine, Veranstaltungen</p>
                </div>
                <div style="background: rgba(255,255,255,0.15); padding: 35px; border-radius: 15px; backdrop-filter: blur(10px);">
                  <div style="font-size: 56px; margin-bottom: 20px;">🎉</div>
                  <h3 style="font-size: 32px; margin-bottom: 15px; font-weight: 600;">Erfolge</h3>
                  <p style="line-height: 1.8;">Meilensteine, Achievements, Erfolge</p>
                </div>
                <div style="background: rgba(255,255,255,0.15); padding: 35px; border-radius: 15px; backdrop-filter: blur(10px);">
                  <div style="font-size: 56px; margin-bottom: 20px;">⚠️</div>
                  <h3 style="font-size: 32px; margin-bottom: 15px; font-weight: 600;">Wichtige Infos</h3>
                  <p style="line-height: 1.8;">Notfälle, Wartungen, Hinweise</p>
                </div>
                <div style="background: rgba(255,255,255,0.15); padding: 35px; border-radius: 15px; backdrop-filter: blur(10px);">
                  <div style="font-size: 56px; margin-bottom: 20px;">👥</div>
                  <h3 style="font-size: 32px; margin-bottom: 15px; font-weight: 600;">HR</h3>
                  <p style="line-height: 1.8;">Onboarding, Team-News, Benefits</p>
                </div>
                <div style="background: rgba(255,255,255,0.15); padding: 35px; border-radius: 15px; backdrop-filter: blur(10px);">
                  <div style="font-size: 56px; margin-bottom: 20px;">📊</div>
                  <h3 style="font-size: 32px; margin-bottom: 15px; font-weight: 600;">KPIs</h3>
                  <p style="line-height: 1.8;">Dashboards, Metriken, Reports</p>
                </div>
              </div>
            </div>
          `,
          contentType: 'html',
          categoryId: infoCategory?.id || announcementCategory.id,
          organizationId: prasco.id,
          createdBy: admin.id,
          duration: 16,
          priority: 5,
          isActive: true,
        },
      });

      // Slide 7: Feature - Dashboard Übersicht
      await Post.findOrCreate({
        where: { title: '📊 Dashboard - Zentrale Verwaltung' },
        defaults: {
          title: '📊 Dashboard - Zentrale Verwaltung',
          content: `
            <div style="padding: 60px; background: linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%); height: 100%;">
              <h1 style="font-size: 58px; margin-bottom: 40px; color: #c41e3a; font-weight: 700; border-left: 8px solid #c41e3a; padding-left: 30px;">
                📊 Dashboard - Zentrale Übersicht
              </h1>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px;">
                <div style="background: white; padding: 40px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); border-left: 6px solid #c41e3a;">
                  <h2 style="font-size: 38px; color: #c41e3a; margin-bottom: 20px;">✨ Auf einen Blick</h2>
                  <ul style="font-size: 28px; line-height: 2; color: #333; list-style: none; padding: 0;">
                    <li>📈 Aktive Beiträge & Statistiken</li>
                    <li>📅 Geplante Beiträge Timeline</li>
                    <li>🏷️ Kategorien-Übersicht</li>
                    <li>🖼️ Medien-Verwaltung</li>
                  </ul>
                </div>
                <div style="background: white; padding: 40px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); border-left: 6px solid #c41e3a;">
                  <h2 style="font-size: 38px; color: #c41e3a; margin-bottom: 20px;">🚀 Schnellaktionen</h2>
                  <ul style="font-size: 28px; line-height: 2; color: #333; list-style: none; padding: 0;">
                    <li>➕ Neuer Beitrag in Sekunden</li>
                    <li>🎨 Display sofort öffnen</li>
                    <li>📊 Echtzeit-Statistiken</li>
                    <li>⚡ Blitzschnelle Navigation</li>
                  </ul>
                </div>
              </div>
              <div style="background: linear-gradient(135deg, #c41e3a 0%, #8b1528 100%); padding: 30px; border-radius: 15px; text-align: center; color: white;">
                <p style="font-size: 32px; margin: 0;">💡 Intuitive Benutzeroberfläche • Modern & Übersichtlich • PRASCO Design</p>
              </div>
            </div>
          `,
          contentType: 'html',
          categoryId: infoCategory?.id || announcementCategory.id,
          organizationId: prasco.id,
          createdBy: admin.id,
          duration: 18,
          priority: 9,
          isActive: true,
        },
      });

      // Slide 8: Feature - Beiträge erstellen
      await Post.findOrCreate({
        where: { title: '✍️ Beiträge erstellen - Kinderleicht' },
        defaults: {
          title: '✍️ Beiträge erstellen - Kinderleicht',
          content: `
            <div style="padding: 60px; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); height: 100%;">
              <h1 style="font-size: 58px; margin-bottom: 40px; color: #c41e3a; font-weight: 700; border-left: 8px solid #c41e3a; padding-left: 30px;">
                ✍️ Beiträge erstellen
              </h1>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
                <div style="background: white; padding: 35px; border-radius: 15px; box-shadow: 0 8px 25px rgba(0,0,0,0.12);">
                  <h2 style="font-size: 42px; color: #c41e3a; margin-bottom: 25px;">📝 Content-Typen</h2>
                  <div style="font-size: 28px; line-height: 2; color: #333;">
                    <p style="margin: 15px 0; padding: 15px; background: #f8f9fa; border-radius: 10px;">📄 <strong>Text</strong> - Einfache Textnachrichten</p>
                    <p style="margin: 15px 0; padding: 15px; background: #f8f9fa; border-radius: 10px;">🖼️ <strong>Bilder</strong> - JPG, PNG, GIF Upload</p>
                    <p style="margin: 15px 0; padding: 15px; background: #f8f9fa; border-radius: 10px;">🎬 <strong>Videos</strong> - MP4, WebM, YouTube</p>
                    <p style="margin: 15px 0; padding: 15px; background: #f8f9fa; border-radius: 10px;">🎨 <strong>HTML</strong> - Individuelle Designs</p>
                  </div>
                </div>
                <div style="background: white; padding: 35px; border-radius: 15px; box-shadow: 0 8px 25px rgba(0,0,0,0.12);">
                  <h2 style="font-size: 42px; color: #c41e3a; margin-bottom: 25px;">⚙️ Einstellungen</h2>
                  <div style="font-size: 28px; line-height: 2; color: #333;">
                    <p style="margin: 15px 0;">📅 <strong>Zeitplanung</strong><br/><span style="font-size: 22px; color: #666;">Start- & End-Datum festlegen</span></p>
                    <p style="margin: 15px 0;">⏱️ <strong>Anzeigedauer</strong><br/><span style="font-size: 22px; color: #666;">Individuelle Sekunden (10-120s)</span></p>
                    <p style="margin: 15px 0;">🎯 <strong>Priorität</strong><br/><span style="font-size: 22px; color: #666;">0-10 für Rotation (10 = häufigste)</span></p>
                    <p style="margin: 15px 0;">🏷️ <strong>Kategorien</strong><br/><span style="font-size: 22px; color: #666;">Farbcodierte Organisation</span></p>
                  </div>
                </div>
              </div>
              <div style="background: linear-gradient(90deg, #c41e3a 0%, #8b1528 100%); padding: 25px; border-radius: 12px; text-align: center; color: white; margin-top: 30px;">
                <p style="font-size: 30px; margin: 0;">✅ Drag & Drop Upload • 📊 Live-Vorschau • 💾 Auto-Save Funktion</p>
              </div>
            </div>
          `,
          contentType: 'html',
          categoryId: infoCategory?.id || announcementCategory.id,
          organizationId: prasco.id,
          createdBy: admin.id,
          duration: 20,
          priority: 8,
          isActive: true,
        },
      });

      // Slide 9: Feature - Kategorien
      await Post.findOrCreate({
        where: { title: '🏷️ Kategorien - Farbcodiert & Organisiert' },
        defaults: {
          title: '🏷️ Kategorien - Farbcodiert & Organisiert',
          content: `
            <div style="padding: 60px; background: linear-gradient(135deg, #ffffff 0%, #f0f4f8 100%); height: 100%;">
              <h1 style="font-size: 58px; margin-bottom: 50px; color: #c41e3a; font-weight: 700; border-left: 8px solid #c41e3a; padding-left: 30px;">
                🏷️ Kategorien-System
              </h1>
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 35px; margin-bottom: 40px;">
                <div style="background: linear-gradient(135deg, #007dff 0%, #0056b3 100%); padding: 45px; border-radius: 20px; color: white; box-shadow: 0 12px 35px rgba(0,125,255,0.3);">
                  <div style="font-size: 60px; margin-bottom: 20px;">📢</div>
                  <h2 style="font-size: 42px; margin-bottom: 15px; font-weight: 700;">Ankündigungen</h2>
                  <p style="font-size: 26px; opacity: 0.95;">Wichtige Mitteilungen & News</p>
                </div>
                <div style="background: linear-gradient(135deg, #28a745 0%, #1e7e34 100%); padding: 45px; border-radius: 20px; color: white; box-shadow: 0 12px 35px rgba(40,167,69,0.3);">
                  <div style="font-size: 60px; margin-bottom: 20px;">🎉</div>
                  <h2 style="font-size: 42px; margin-bottom: 15px; font-weight: 700;">Veranstaltungen</h2>
                  <p style="font-size: 26px; opacity: 0.95;">Events, Termine & Feiern</p>
                </div>
                <div style="background: linear-gradient(135deg, #c41e3a 0%, #8b1528 100%); padding: 45px; border-radius: 20px; color: white; box-shadow: 0 12px 35px rgba(196,30,58,0.3);">
                  <div style="font-size: 60px; margin-bottom: 20px;">ℹ️</div>
                  <h2 style="font-size: 42px; margin-bottom: 15px; font-weight: 700;">Wichtige Infos</h2>
                  <p style="font-size: 26px; opacity: 0.95;">Richtlinien & Hinweise</p>
                </div>
                <div style="background: linear-gradient(135deg, #ffc107 0%, #e0a800 100%); padding: 45px; border-radius: 20px; color: white; box-shadow: 0 12px 35px rgba(255,193,7,0.3);">
                  <div style="font-size: 60px; margin-bottom: 20px;">🏆</div>
                  <h2 style="font-size: 42px; margin-bottom: 15px; font-weight: 700;">Erfolge</h2>
                  <p style="font-size: 26px; opacity: 0.95;">Meilensteine & Auszeichnungen</p>
                </div>
              </div>
              <div style="background: white; padding: 35px; border-radius: 15px; text-align: center; box-shadow: 0 8px 25px rgba(0,0,0,0.08);">
                <p style="font-size: 32px; margin: 0; color: #333;">🎨 <strong>Farbcodes</strong> für schnelle Orientierung • ➕ <strong>Beliebig erweiterbar</strong> • 🔧 <strong>Individuell anpassbar</strong></p>
              </div>
            </div>
          `,
          contentType: 'html',
          categoryId: successCategory?.id || announcementCategory.id,
          organizationId: prasco.id,
          createdBy: admin.id,
          duration: 18,
          priority: 7,
          isActive: true,
        },
      });

      // Slide 10: Feature - Display & Rotation
      await Post.findOrCreate({
        where: { title: '📺 Display - Professionelle Präsentation' },
        defaults: {
          title: '📺 Display - Professionelle Präsentation',
          content: `
            <div style="padding: 60px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; height: 100%;">
              <h1 style="font-size: 58px; margin-bottom: 50px; color: #ffffff; font-weight: 700; border-left: 8px solid #c41e3a; padding-left: 30px;">
                📺 Display-System
              </h1>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 35px; margin-bottom: 40px;">
                <div style="background: rgba(255,255,255,0.1); padding: 40px; border-radius: 20px; backdrop-filter: blur(10px); border: 2px solid rgba(255,255,255,0.2);">
                  <h2 style="font-size: 42px; color: #c41e3a; margin-bottom: 25px;">🔄 Smart Rotation</h2>
                  <ul style="font-size: 28px; line-height: 2; list-style: none; padding: 0;">
                    <li style="margin: 15px 0;">⚡ <strong>Prioritäts-basiert</strong><br/><span style="font-size: 22px; opacity: 0.8;">Wichtige Inhalte häufiger</span></li>
                    <li style="margin: 15px 0;">⏱️ <strong>Individuelle Dauer</strong><br/><span style="font-size: 22px; opacity: 0.8;">Pro Beitrag einstellbar</span></li>
                    <li style="margin: 15px 0;">🔀 <strong>Shuffle-Algorithmus</strong><br/><span style="font-size: 22px; opacity: 0.8;">Optimale Verteilung</span></li>
                    <li style="margin: 15px 0;">📅 <strong>Zeitgesteuert</strong><br/><span style="font-size: 22px; opacity: 0.8;">Start/End-Datum beachtet</span></li>
                  </ul>
                </div>
                <div style="background: rgba(255,255,255,0.1); padding: 40px; border-radius: 20px; backdrop-filter: blur(10px); border: 2px solid rgba(255,255,255,0.2);">
                  <h2 style="font-size: 42px; color: #c41e3a; margin-bottom: 25px;">✨ Features</h2>
                  <ul style="font-size: 28px; line-height: 2; list-style: none; padding: 0;">
                    <li style="margin: 15px 0;">🖥️ <strong>Fullscreen-Modus</strong><br/><span style="font-size: 22px; opacity: 0.8;">ESC zum Beenden</span></li>
                    <li style="margin: 15px 0;">🔄 <strong>Auto-Refresh</strong><br/><span style="font-size: 22px; opacity: 0.8;">Alle 5 Minuten neue Inhalte</span></li>
                    <li style="margin: 15px 0;">📱 <strong>Responsive</strong><br/><span style="font-size: 22px; opacity: 0.8;">Jede Bildschirmgröße</span></li>
                    <li style="margin: 15px 0;">🎯 <strong>Kategorie-Filter</strong><br/><span style="font-size: 22px; opacity: 0.8;">Schnellzugriff per Button</span></li>
                  </ul>
                </div>
              </div>
              <div style="background: linear-gradient(90deg, #c41e3a 0%, #8b1528 100%); padding: 35px; border-radius: 15px; text-align: center;">
                <h3 style="font-size: 36px; margin-bottom: 20px;">🚀 Perfekt für:</h3>
                <p style="font-size: 30px; margin: 10px 0; line-height: 1.8;">
                  🏢 Empfangsbereiche • 🍽️ Kantinen • 📚 Besprechungsräume • 🏭 Produktionshallen
                </p>
              </div>
            </div>
          `,
          contentType: 'html',
          categoryId: infoCategory?.id || announcementCategory.id,
          organizationId: prasco.id,
          createdBy: admin.id,
          duration: 20,
          priority: 6,
          isActive: true,
        },
      });

      // Slide 11: Call to Action
      await Post.findOrCreate({
        where: { title: '🚀 Jetzt loslegen!' },
        defaults: {
          title: '🚀 Jetzt loslegen!',
          content: `
            <div style="text-align: center; padding: 80px 60px; background: linear-gradient(135deg, #c41e3a 0%, #8b1528 100%); color: white; height: 100%;">
              <h1 style="font-size: 68px; margin-bottom: 40px; font-weight: 700; text-shadow: 3px 3px 6px rgba(0,0,0,0.3);">
                Bereit für die digitale Zukunft?
              </h1>
              <div style="font-size: 36px; line-height: 2; margin-bottom: 60px; opacity: 0.95;">
                <p>✅ Einfache Verwaltung</p>
                <p>✅ Moderne Technologie</p>
                <p>✅ Skalierbare Lösung</p>
                <p>✅ PRASCO Corporate Design</p>
              </div>
              <div style="background: rgba(255,255,255,0.15); padding: 40px; border-radius: 20px; margin: 40px auto; max-width: 800px; backdrop-filter: blur(10px);">
                <h3 style="font-size: 42px; margin-bottom: 20px;">Admin-Zugang</h3>
                <p style="font-size: 32px; opacity: 0.9; line-height: 1.8;">
                  🌐 http://localhost:3000/admin<br/>
                  👤 admin@prasco.net<br/>
                  🔑 admin123
                </p>
              </div>
              <div style="font-size: 28px; margin-top: 50px; opacity: 0.85;">
                Powered by Node.js, TypeScript & PostgreSQL
              </div>
            </div>
          `,
          contentType: 'html',
          categoryId: announcementCategory.id,
          organizationId: prasco.id,
          createdBy: admin.id,
          duration: 15,
          priority: 4,
          isActive: true,
        },
      });

      logger.info('✅ Sample-Posts & Feature-Präsentations-Slides erstellt');
    }

    logger.info('🎉 Database-Seeding erfolgreich abgeschlossen!');
  } catch (error) {
    logger.error('❌ Fehler beim Database-Seeding:', error);
    throw error;
  }
};

// Removed automatic execution block - seedDatabase is only called from server.ts startup
// If you need to run seeding manually, import and call seedDatabase() explicitly

export default seedDatabase;
