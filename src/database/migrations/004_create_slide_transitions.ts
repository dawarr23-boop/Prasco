import { QueryInterface, DataTypes } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable('slide_transitions', {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      post_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'posts',
          key: 'id',
        },
        onDelete: 'CASCADE',
        unique: true, // Ein Post hat maximal eine Transition
      },
      
      // Transition-Typ
      transition_type: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: 'fade, slide, zoom, wipe, push, cube, flip, morph',
      },
      
      // Transition-Parameter
      direction: {
        type: DataTypes.STRING(20),
        allowNull: true,
        comment: 'left, right, up, down, in, out',
      },
      duration: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 800,
        comment: 'Millisekunden',
      },
      easing: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'ease-in-out',
        comment: 'CSS easing function',
      },
      
      // Zusätzliche Optionen
      delay: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Verzögerung vor Start (ms)',
      },
      z_index: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: 'Z-Index während Transition',
      },
      
      // Erweiterte Optionen (JSON)
      options: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Zusätzliche Parameter (z.B. Farben, Intensität)',
      },
      
      // Metadaten
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    });

    // Index für schnelle Abfragen
    await queryInterface.addIndex('slide_transitions', ['post_id'], {
      name: 'idx_slide_transitions_post_id',
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable('slide_transitions');
  },
};
