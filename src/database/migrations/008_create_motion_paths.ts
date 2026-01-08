import { QueryInterface, DataTypes } from 'sequelize';

/**
 * Migration: Create motion_paths table
 * 
 * Motion Paths erweitern Element-Animationen um Bewegungspfade
 * - SVG-basierte Pfaddefinition
 * - Bézier-Kurven und vordefinierte Pfade
 * - Auto-Orient (automatische Ausrichtung entlang des Pfades)
 */

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable('motion_paths', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    elementAnimationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'element_animations',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      unique: true, // 1:1 Relationship
      field: 'element_animation_id',
    },
    pathType: {
      type: DataTypes.ENUM('line', 'curve', 'arc', 'circle', 'custom'),
      allowNull: false,
      defaultValue: 'line',
      comment: 'Typ des Bewegungspfades',
      field: 'path_type',
    },
    pathData: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'SVG Path Daten (JSON-encoded) mit Kontrollpunkten',
      field: 'path_data',
    },
    autoOrient: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Automatische Ausrichtung des Elements entlang des Pfades',
      field: 'auto_orient',
    },
    orientAngle: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Zusätzlicher Rotations-Offset in Grad (0-360)',
      field: 'orient_angle',
    },
    anchorPoint: {
      type: DataTypes.ENUM('center', 'top-left', 'top-right', 'bottom-left', 'bottom-right', 'top', 'bottom', 'left', 'right'),
      allowNull: false,
      defaultValue: 'center',
      comment: 'Ankerpunkt des Elements für die Pfad-Animation',
      field: 'anchor_point',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'updated_at',
    },
  });

  // Index auf elementAnimationId für schnelle Lookups
  await queryInterface.addIndex('motion_paths', ['element_animation_id'], {
    name: 'idx_motion_paths_element_animation',
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('motion_paths');
}
