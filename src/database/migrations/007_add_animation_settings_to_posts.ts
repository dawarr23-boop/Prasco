import { QueryInterface, DataTypes } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    // Füge neue Spalten zur posts Tabelle hinzu
    await queryInterface.addColumn('posts', 'auto_animate', {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Automatisches Abspielen der Element-Animationen',
    });

    await queryInterface.addColumn('posts', 'animation_loop', {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Animationen in Schleife wiederholen',
    });

    await queryInterface.addColumn('posts', 'animation_delay', {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Verzögerung vor Start der ersten Animation (ms)',
    });

    await queryInterface.addColumn('posts', 'reduced_motion_fallback', {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Fallback für prefers-reduced-motion aktiviert',
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.removeColumn('posts', 'auto_animate');
    await queryInterface.removeColumn('posts', 'animation_loop');
    await queryInterface.removeColumn('posts', 'animation_delay');
    await queryInterface.removeColumn('posts', 'reduced_motion_fallback');
  },
};
