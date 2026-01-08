import { QueryInterface, DataTypes } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    // Füge Animation-Einstellungen zur posts-Tabelle hinzu
    await queryInterface.addColumn('posts', 'auto_animate', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Automatische Animationen aktivieren',
    });

    await queryInterface.addColumn('posts', 'animation_loop', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Animationen wiederholen',
    });

    await queryInterface.addColumn('posts', 'animation_delay', {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Globale Verzögerung für alle Animationen (ms)',
    });

    await queryInterface.addColumn('posts', 'reduced_motion_fallback', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Fallback für prefers-reduced-motion aktivieren',
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn('posts', 'auto_animate');
    await queryInterface.removeColumn('posts', 'animation_loop');
    await queryInterface.removeColumn('posts', 'animation_delay');
    await queryInterface.removeColumn('posts', 'reduced_motion_fallback');
  },
};
