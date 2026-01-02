/**
 * HTML Example Posts Seeder
 * Demonstriert alle HTML-Funktionen und Content-Typen des Digital Bulletin Boards
 */

import { Post, User, Category, Organization } from '../../models';
import { logger } from '../../utils/logger';

export const seedHtmlExamples = async (): Promise<void> => {
  try {
    logger.info('🎨 Erstelle HTML-Beispielposts...');

    // Hole Admin-User und Organisation
    const admin = await User.findOne({ where: { role: 'admin' } });
    const prasco = await Organization.findOne({ where: { slug: 'prasco' } });
    const category = await Category.findOne({ where: { name: 'Ankündigungen' } });

    if (!admin || !prasco || !category) {
      logger.warn('⚠️  Basis-Daten fehlen. Bitte zuerst Haupt-Seed ausführen.');
      return;
    }

    const examples = [
      // 1. HTML - Gradient Background
      {
        title: '🎨 HTML - Gradient Background',
        content: `
          <div style="
            height: 80vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 20px;
            color: white;
            text-align: center;
            padding: 60px;
          ">
            <div>
              <div style="font-size: 100px; margin-bottom: 30px;">🚀</div>
              <h1 style="font-size: 64px; margin-bottom: 20px; text-shadow: 2px 2px 8px rgba(0,0,0,0.3);">
                Willkommen bei PRASCO
              </h1>
              <p style="font-size: 32px; opacity: 0.9; max-width: 800px; margin: 0 auto;">
                Ihr Partner für innovative Lösungen
              </p>
            </div>
          </div>
        `,
        contentType: 'html' as const,
        duration: 15,
        priority: 100,
      },

      // 2. HTML - Multi-Column Layout
      {
        title: '📊 HTML - Mehrspaltiges Layout',
        content: `
          <div style="padding: 40px; background: #f8f9fa; border-radius: 15px; height: 75vh;">
            <h1 style="font-size: 52px; color: #c41e3a; margin-bottom: 40px; border-left: 8px solid #009640; padding-left: 20px;">
              Unsere Services
            </h1>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px; margin-top: 40px;">
              <div style="background: white; padding: 35px; border-radius: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                <div style="font-size: 60px; margin-bottom: 20px;">💡</div>
                <h3 style="font-size: 32px; color: #1a1a1a; margin-bottom: 15px;">Beratung</h3>
                <p style="font-size: 22px; line-height: 1.6; color: #666;">
                  Professionelle Beratung für Ihre Projekte
                </p>
              </div>
              <div style="background: white; padding: 35px; border-radius: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                <div style="font-size: 60px; margin-bottom: 20px;">⚙️</div>
                <h3 style="font-size: 32px; color: #1a1a1a; margin-bottom: 15px;">Entwicklung</h3>
                <p style="font-size: 22px; line-height: 1.6; color: #666;">
                  Maßgeschneiderte Software-Lösungen
                </p>
              </div>
              <div style="background: white; padding: 35px; border-radius: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                <div style="font-size: 60px; margin-bottom: 20px;">🎯</div>
                <h3 style="font-size: 32px; color: #1a1a1a; margin-bottom: 15px;">Support</h3>
                <p style="font-size: 22px; line-height: 1.6; color: #666;">
                  24/7 Unterstützung für Ihre Systeme
                </p>
              </div>
            </div>
          </div>
        `,
        contentType: 'html' as const,
        duration: 18,
        priority: 95,
      },

      // 3. HTML - Timeline
      {
        title: '📅 HTML - Timeline Design',
        content: `
          <div style="padding: 50px; background: linear-gradient(to bottom, #1a1a2e, #16213e); color: white; height: 80vh; border-radius: 15px;">
            <h1 style="font-size: 56px; margin-bottom: 50px; text-align: center;">Projekt Timeline</h1>
            <div style="position: relative; padding-left: 60px; max-width: 1000px; margin: 0 auto;">
              <div style="position: absolute; left: 30px; top: 0; bottom: 0; width: 4px; background: linear-gradient(to bottom, #c41e3a, #009640);"></div>
              
              <div style="position: relative; margin-bottom: 50px;">
                <div style="position: absolute; left: -44px; width: 30px; height: 30px; border-radius: 50%; background: #c41e3a; border: 4px solid white;"></div>
                <div style="background: rgba(255,255,255,0.1); padding: 25px; border-radius: 10px; backdrop-filter: blur(10px);">
                  <h3 style="font-size: 32px; margin-bottom: 10px;">✅ Phase 1 - Planung</h3>
                  <p style="font-size: 20px; opacity: 0.9;">Abgeschlossen - Januar 2026</p>
                </div>
              </div>
              
              <div style="position: relative; margin-bottom: 50px;">
                <div style="position: absolute; left: -44px; width: 30px; height: 30px; border-radius: 50%; background: #009640; border: 4px solid white;"></div>
                <div style="background: rgba(255,255,255,0.1); padding: 25px; border-radius: 10px; backdrop-filter: blur(10px);">
                  <h3 style="font-size: 32px; margin-bottom: 10px;">⚙️ Phase 2 - Entwicklung</h3>
                  <p style="font-size: 20px; opacity: 0.9;">In Bearbeitung - Februar 2026</p>
                </div>
              </div>
              
              <div style="position: relative;">
                <div style="position: absolute; left: -44px; width: 30px; height: 30px; border-radius: 50%; background: #666; border: 4px solid white;"></div>
                <div style="background: rgba(255,255,255,0.1); padding: 25px; border-radius: 10px; backdrop-filter: blur(10px);">
                  <h3 style="font-size: 32px; margin-bottom: 10px;">🚀 Phase 3 - Launch</h3>
                  <p style="font-size: 20px; opacity: 0.9;">Geplant - März 2026</p>
                </div>
              </div>
            </div>
          </div>
        `,
        contentType: 'html' as const,
        duration: 20,
        priority: 90,
      },

      // 4. HTML - Feature Cards
      {
        title: '🎯 HTML - Feature Cards',
        content: `
          <div style="padding: 45px; background: #ffffff; height: 80vh;">
            <h1 style="font-size: 54px; color: #1a1a1a; margin-bottom: 45px; text-align: center; border-bottom: 4px solid #c41e3a; padding-bottom: 20px;">
              Unsere Stärken
            </h1>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 35px; max-width: 1200px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; border-radius: 20px; color: white; box-shadow: 0 8px 30px rgba(0,0,0,0.2);">
                <div style="font-size: 70px; margin-bottom: 20px;">🔒</div>
                <h2 style="font-size: 38px; margin-bottom: 15px;">Sicherheit</h2>
                <ul style="font-size: 22px; line-height: 2;">
                  <li>JWT Authentication</li>
                  <li>Role-Based Access</li>
                  <li>Rate Limiting</li>
                </ul>
              </div>
              <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 40px; border-radius: 20px; color: white; box-shadow: 0 8px 30px rgba(0,0,0,0.2);">
                <div style="font-size: 70px; margin-bottom: 20px;">⚡</div>
                <h2 style="font-size: 38px; margin-bottom: 15px;">Performance</h2>
                <ul style="font-size: 22px; line-height: 2;">
                  <li>Optimierte Ladezeiten</li>
                  <li>Caching-Strategien</li>
                  <li>CDN Integration</li>
                </ul>
              </div>
              <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 40px; border-radius: 20px; color: white; box-shadow: 0 8px 30px rgba(0,0,0,0.2);">
                <div style="font-size: 70px; margin-bottom: 20px;">📱</div>
                <h2 style="font-size: 38px; margin-bottom: 15px;">Responsive</h2>
                <ul style="font-size: 22px; line-height: 2;">
                  <li>Mobile First</li>
                  <li>Alle Displaygrößen</li>
                  <li>Touch-optimiert</li>
                </ul>
              </div>
              <div style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); padding: 40px; border-radius: 20px; color: white; box-shadow: 0 8px 30px rgba(0,0,0,0.2);">
                <div style="font-size: 70px; margin-bottom: 20px;">🎨</div>
                <h2 style="font-size: 38px; margin-bottom: 15px;">Design</h2>
                <ul style="font-size: 22px; line-height: 2;">
                  <li>PRASCO Corporate Design</li>
                  <li>Moderne UI/UX</li>
                  <li>Barrierefreiheit</li>
                </ul>
              </div>
            </div>
          </div>
        `,
        contentType: 'html' as const,
        duration: 22,
        priority: 85,
      },

      // 5. HTML - Stats Dashboard
      {
        title: '📈 HTML - Statistik Dashboard',
        content: `
          <div style="padding: 50px; background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); color: white; height: 80vh; border-radius: 15px;">
            <h1 style="font-size: 56px; margin-bottom: 50px; text-align: center; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">
              📊 Jahresübersicht 2025
            </h1>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 30px; max-width: 1400px; margin: 0 auto;">
              <div style="background: rgba(255,255,255,0.15); padding: 35px; border-radius: 15px; text-align: center; backdrop-filter: blur(10px); border: 2px solid rgba(255,255,255,0.2);">
                <div style="font-size: 64px; font-weight: 700; margin-bottom: 10px; color: #00f2fe;">1.250</div>
                <div style="font-size: 24px; opacity: 0.9;">Projekte</div>
              </div>
              <div style="background: rgba(255,255,255,0.15); padding: 35px; border-radius: 15px; text-align: center; backdrop-filter: blur(10px); border: 2px solid rgba(255,255,255,0.2);">
                <div style="font-size: 64px; font-weight: 700; margin-bottom: 10px; color: #43e97b;">98%</div>
                <div style="font-size: 24px; opacity: 0.9;">Zufriedenheit</div>
              </div>
              <div style="background: rgba(255,255,255,0.15); padding: 35px; border-radius: 15px; text-align: center; backdrop-filter: blur(10px); border: 2px solid rgba(255,255,255,0.2);">
                <div style="font-size: 64px; font-weight: 700; margin-bottom: 10px; color: #f093fb;">450</div>
                <div style="font-size: 24px; opacity: 0.9;">Kunden</div>
              </div>
              <div style="background: rgba(255,255,255,0.15); padding: 35px; border-radius: 15px; text-align: center; backdrop-filter: blur(10px); border: 2px solid rgba(255,255,255,0.2);">
                <div style="font-size: 64px; font-weight: 700; margin-bottom: 10px; color: #ffa726;">24/7</div>
                <div style="font-size: 24px; opacity: 0.9;">Support</div>
              </div>
            </div>
            <div style="margin-top: 60px; text-align: center;">
              <p style="font-size: 28px; opacity: 0.9; max-width: 900px; margin: 0 auto; line-height: 1.6;">
                Ein erfolgreiches Jahr mit kontinuierlichem Wachstum und zufriedenen Kunden
              </p>
            </div>
          </div>
        `,
        contentType: 'html' as const,
        duration: 20,
        priority: 80,
      },

      // 6. HTML - Alert Banner
      {
        title: '⚠️ HTML - Wichtige Mitteilung',
        content: `
          <div style="padding: 60px; height: 80vh; display: flex; align-items: center; justify-content: center;">
            <div style="max-width: 1000px;">
              <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%); padding: 50px; border-radius: 20px; box-shadow: 0 10px 40px rgba(255,107,107,0.4); color: white; margin-bottom: 30px; border-left: 10px solid #c41e3a;">
                <div style="display: flex; align-items: center; gap: 30px;">
                  <div style="font-size: 80px;">⚠️</div>
                  <div>
                    <h2 style="font-size: 44px; margin-bottom: 15px;">Wichtige Wartungsarbeiten</h2>
                    <p style="font-size: 26px; opacity: 0.95; line-height: 1.6;">
                      Am Sonntag, 05.01.2026 von 00:00 - 06:00 Uhr werden Systemwartungen durchgeführt.
                    </p>
                  </div>
                </div>
              </div>
              
              <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 40px; border-radius: 20px; box-shadow: 0 8px 30px rgba(79,172,254,0.3); color: white; border-left: 10px solid #0288d1;">
                <div style="display: flex; align-items: center; gap: 25px;">
                  <div style="font-size: 60px;">ℹ️</div>
                  <div>
                    <h3 style="font-size: 32px; margin-bottom: 10px;">Information</h3>
                    <p style="font-size: 22px; opacity: 0.95;">
                      Während dieser Zeit sind alle Services vorübergehend nicht verfügbar.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `,
        contentType: 'html' as const,
        duration: 18,
        priority: 98,
      },

      // 7. HTML - Contact Info
      {
        title: '📞 HTML - Kontakt & Standort',
        content: `
          <div style="padding: 50px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; height: 80vh; border-radius: 15px;">
            <h1 style="font-size: 56px; margin-bottom: 50px; text-align: center; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">
              📍 Kontaktieren Sie uns
            </h1>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 40px; max-width: 1200px; margin: 0 auto;">
              <div style="background: rgba(255,255,255,0.1); padding: 40px; border-radius: 15px; backdrop-filter: blur(10px);">
                <div style="font-size: 60px; margin-bottom: 20px;">📍</div>
                <h2 style="font-size: 36px; margin-bottom: 20px;">Adresse</h2>
                <p style="font-size: 24px; line-height: 1.8; opacity: 0.95;">
                  PRASCO GmbH<br/>
                  Musterstraße 123<br/>
                  12345 Musterstadt<br/>
                  Deutschland
                </p>
              </div>
              
              <div style="background: rgba(255,255,255,0.1); padding: 40px; border-radius: 15px; backdrop-filter: blur(10px);">
                <div style="font-size: 60px; margin-bottom: 20px;">📞</div>
                <h2 style="font-size: 36px; margin-bottom: 20px;">Kontakt</h2>
                <p style="font-size: 24px; line-height: 1.8; opacity: 0.95;">
                  Tel: +49 123 456789<br/>
                  Email: info@prasco.net<br/>
                  Web: www.prasco.de
                </p>
              </div>
              
              <div style="background: rgba(255,255,255,0.1); padding: 40px; border-radius: 15px; backdrop-filter: blur(10px);">
                <div style="font-size: 60px; margin-bottom: 20px;">🕐</div>
                <h2 style="font-size: 36px; margin-bottom: 20px;">Öffnungszeiten</h2>
                <p style="font-size: 24px; line-height: 1.8; opacity: 0.95;">
                  Mo - Fr: 08:00 - 18:00 Uhr<br/>
                  Sa: 09:00 - 13:00 Uhr<br/>
                  So: Geschlossen
                </p>
              </div>
              
              <div style="background: rgba(255,255,255,0.1); padding: 40px; border-radius: 15px; backdrop-filter: blur(10px);">
                <div style="font-size: 60px; margin-bottom: 20px;">🌐</div>
                <h2 style="font-size: 36px; margin-bottom: 20px;">Social Media</h2>
                <p style="font-size: 24px; line-height: 1.8; opacity: 0.95;">
                  LinkedIn: /company/prasco<br/>
                  Twitter: @prasco_gmbh<br/>
                  Instagram: @prasco.de
                </p>
              </div>
            </div>
          </div>
        `,
        contentType: 'html' as const,
        duration: 20,
        priority: 60,
      },

      // 8. Text - Einfacher Post
      {
        title: '📝 Willkommen!',
        content:
          'Herzlich willkommen bei PRASCO! Wir freuen uns, Sie auf unserem digitalen schwarzen Brett begrüßen zu dürfen. Bleiben Sie informiert über alle wichtigen Neuigkeiten und Ankündigungen.',
        contentType: 'text' as const,
        duration: 12,
        priority: 55,
      },

      // 9. Text - Ankündigung
      {
        title: '🎉 Neue Features verfügbar',
        content:
          'Ab sofort können Sie Videos direkt von YouTube und Vimeo einbinden! Nutzen Sie die neuen Multimedia-Funktionen für noch ansprechendere Präsentationen.',
        contentType: 'text' as const,
        duration: 15,
        priority: 50,
      },
    ];

    let created = 0;
    let skipped = 0;

    for (const example of examples) {
      const [post, wasCreated] = await Post.findOrCreate({
        where: { title: example.title },
        defaults: {
          ...example,
          categoryId: category.id,
          organizationId: prasco.id,
          createdBy: admin.id,
          isActive: true,
        },
      });

      if (wasCreated) {
        created++;
        logger.info(`   ✓ ${example.title}`);
      } else {
        skipped++;
      }
    }

    logger.info(`✅ HTML-Beispiele: ${created} erstellt, ${skipped} übersprungen`);
  } catch (error) {
    logger.error('❌ Fehler beim Erstellen der HTML-Beispiele:', error);
    throw error;
  }
};

// Direkter Aufruf ermöglichen
if (require.main === module) {
  (async () => {
    try {
      // Import Database connection
      const { connectDatabase } = await import('../../config/database');
      await connectDatabase();
      await seedHtmlExamples();
      process.exit(0);
    } catch (error) {
      logger.error('❌ Seed fehlgeschlagen:', error);
      process.exit(1);
    }
  })();
}
