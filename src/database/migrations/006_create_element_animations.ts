import { QueryInterface, DataTypes } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.createTable('element_animations', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      postId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'post_id',
        references: {
          model: 'posts',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      // Element-Identifikation
      elementSelector: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'element_selector',
        comment: 'CSS Selector oder Data-ID des zu animierenden Elements',
      },
      elementIndex: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'element_index',
        comment: 'Optional: Index bei mehreren Elementen mit gleichem Selector',
      },
      // Animation-Typ
      animationType: {
        type: DataTypes.ENUM('entrance', 'exit', 'emphasis', 'motion-path'),
        allowNull: false,
        field: 'animation_type',
        comment: 'Typ der Animation',
      },
      effectName: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: 'effect_name',
        comment: 'Name des Effekts (z.B. fadeIn, flyIn, bounce)',
      },
      // Timing
      startTime: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'start_time',
        comment: 'Start-Zeit relativ zum Slide-Start (ms)',
      },
      duration: {
        type: DataTypes.INTEGER,
        defaultValue: 500,
        comment: 'Animations-Dauer in Millisekunden',
      },
      delay: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Zusätzliche Verzögerung vor Start (ms)',
      },
      easing: {
        type: DataTypes.STRING(50),
        defaultValue: 'ease-out',
        comment: 'CSS Easing-Funktion',
      },
      // Richtung/Parameter
      direction: {
        type: DataTypes.STRING(20),
        allowNull: true,
        comment: 'Richtung der Animation (left, right, up, down, etc.)',
      },
      intensity: {
        type: DataTypes.INTEGER,
        defaultValue: 100,
        comment: 'Intensität der Animation (0-100%)',
      },
      distance: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Distanz für bewegungsbasierte Animationen (px)',
      },
      // Trigger
      triggerType: {
        type: DataTypes.ENUM('auto', 'click', 'hover', 'scroll', 'sequence'),
        defaultValue: 'auto',
        field: 'trigger_type',
        comment: 'Wie die Animation ausgelöst wird',
      },
      triggerTarget: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'trigger_target',
        comment: 'Optional: Element das die Animation triggert',
      },
      // Reihenfolge
      sequenceOrder: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'sequence_order',
        comment: 'Reihenfolge bei mehreren Animationen',
      },
      // Erweiterte Optionen
      options: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'JSON für zusätzliche Parameter (Motion Path, Colors, etc.)',
      },
      // Timestamps
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'created_at',
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'updated_at',
        defaultValue: DataTypes.NOW,
      },
    });

    // Indizes für Performance
    await queryInterface.addIndex('element_animations', ['post_id'], {
      name: 'idx_element_animations_post_id',
    });

    await queryInterface.addIndex('element_animations', ['post_id', 'sequence_order'], {
      name: 'idx_element_animations_sequence',
    });

    await queryInterface.addIndex('element_animations', ['animation_type'], {
      name: 'idx_element_animations_type',
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.dropTable('element_animations');
  },
};
