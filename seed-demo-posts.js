#!/usr/bin/env node
/**
 * Seed Demo Posts
 */

require('dotenv').config({ path: '.env.production' });

async function seedDemoPosts() {
  try {
    console.log('🔄 Verbinde mit Datenbank...');
    
    const { sequelize } = require('./dist/config/database');
    await sequelize.authenticate();
    console.log('✅ Datenbank verbunden');
    
    const { Post, Category, User, Organization } = require('./dist/models');
    
    // Hole die erste Organisation
    const org = await Organization.findOne();
    if (!org) {
      console.error('❌ Keine Organisation gefunden');
      process.exit(1);
    }
    
    // Hole den Admin-User
    const admin = await User.findOne({ where: { email: 'admin@prasco.net' } });
    if (!admin) {
      console.error('❌ Admin-User nicht gefunden');
      process.exit(1);
    }
    
    // Hole Kategorien
    const categories = await Category.findAll();
    const infoCategory = categories.find(c => c.name === 'Informationen') || categories[0];
    const eventCategory = categories.find(c => c.name === 'Veranstaltungen') || categories[1];
    
    console.log('📝 Erstelle Demo-Posts...');
    
    // Berechne Datum für 7 Tage in der Zukunft
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
    
    const demoPosts = [
      {
        title: 'Willkommen bei PRASCO',
        content: 'Herzlich willkommen auf unserem digitalen Schwarzen Brett! Hier finden Sie aktuelle Informationen und wichtige Ankündigungen.',
        contentType: 'text',
        categoryId: infoCategory?.id,
        organizationId: org.id,
        createdBy: admin.id,
        duration: 10,
        priority: 10,
        isActive: true,
        endDate: sevenDaysLater
      },
      {
        title: 'Wichtige Mitteilung',
        content: 'Bitte beachten Sie: Ab nächster Woche gelten neue Öffnungszeiten.\n\nMontag - Freitag: 8:00 - 18:00 Uhr\nSamstag: 9:00 - 14:00 Uhr',
        contentType: 'text',
        categoryId: infoCategory?.id,
        organizationId: org.id,
        createdBy: admin.id,
        duration: 15,
        priority: 8,
        isActive: true,
        endDate: sevenDaysLater
      },
      {
        title: 'Team-Meeting',
        content: 'Unser nächstes Team-Meeting findet am Freitag um 14:00 Uhr im Konferenzraum statt. Bitte bringen Sie Ihre aktuellen Projektberichte mit.',
        contentType: 'text',
        categoryId: eventCategory?.id,
        organizationId: org.id,
        createdBy: admin.id,
        duration: 12,
        priority: 7,
        isActive: true,
        endDate: sevenDaysLater
      },
      {
        title: 'Erfolgreicher Projektabschluss',
        content: '🎉 Herzlichen Glückwunsch! Unser Projekt wurde erfolgreich abgeschlossen. Vielen Dank an alle Beteiligten für die großartige Zusammenarbeit!',
        contentType: 'text',
        categoryId: infoCategory?.id,
        organizationId: org.id,
        createdBy: admin.id,
        duration: 10,
        priority: 6,
        isActive: true,
        endDate: sevenDaysLater
      },
      {
        title: 'Neue Richtlinien',
        content: '<div style="font-size: 1.5rem; padding: 2rem;"><h2>Aktualisierte Sicherheitsrichtlinien</h2><ul><li>Bitte verwenden Sie sichere Passwörter</li><li>Aktivieren Sie die Zwei-Faktor-Authentifizierung</li><li>Melden Sie verdächtige Aktivitäten sofort</li></ul></div>',
        contentType: 'html',
        categoryId: infoCategory?.id,
        organizationId: org.id,
        createdBy: admin.id,
        duration: 20,
        priority: 9,
        isActive: true,
        endDate: sevenDaysLater
      }
    ];
    
    for (const postData of demoPosts) {
      await Post.create(postData);
      console.log(`  ✅ Post erstellt: ${postData.title}`);
    }
    
    const postCount = await Post.count();
    console.log(`\n✅ ${demoPosts.length} Demo-Posts erstellt (Gesamt: ${postCount})`);
    
    await sequelize.close();
    console.log('\n🎉 Demo-Posts erfolgreich erstellt!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Fehler:', error);
    process.exit(1);
  }
}

seedDemoPosts();
