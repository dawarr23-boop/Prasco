import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

/**
 * MotionPath Attributes
 */
export interface MotionPathAttributes {
  id: number;
  elementAnimationId: number;
  pathType: 'line' | 'curve' | 'arc' | 'circle' | 'custom';
  pathData: string; // JSON string mit SVG Path Daten
  autoOrient: boolean;
  orientAngle: number;
  anchorPoint: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top' | 'bottom' | 'left' | 'right';
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * MotionPath Creation Attributes (ohne auto-increment/auto-set Felder)
 */
export interface MotionPathCreationAttributes
  extends Optional<MotionPathAttributes, 'id' | 'autoOrient' | 'orientAngle' | 'anchorPoint' | 'createdAt' | 'updatedAt'> {}

/**
 * Path Data Structure (gespeichert als JSON in pathData)
 */
export interface PathDataStructure {
  svgPath: string; // SVG Path String (z.B. "M 0,0 L 100,100")
  controlPoints: Array<{
    x: number;
    y: number;
    type?: 'move' | 'line' | 'curve' | 'arc';
  }>;
  viewBox?: {
    width: number;
    height: number;
  };
}

/**
 * MotionPath Model
 * 
 * Definiert Bewegungspfade für Element-Animationen
 * - SVG-basierte Pfaddefinition mit Kontrollpunkten
 * - Verschiedene Pfadtypen (Linie, Kurve, Bogen, Kreis, Custom)
 * - Auto-Orient für automatische Ausrichtung
 * - 1:1 Relationship mit ElementAnimation
 */
class MotionPath extends Model<MotionPathAttributes, MotionPathCreationAttributes> implements MotionPathAttributes {
  public id!: number;
  public elementAnimationId!: number;
  public pathType!: 'line' | 'curve' | 'arc' | 'circle' | 'custom';
  public pathData!: string;
  public autoOrient!: boolean;
  public orientAngle!: number;
  public anchorPoint!: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top' | 'bottom' | 'left' | 'right';
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  /**
   * Parse pathData JSON to PathDataStructure
   */
  public getPathDataObject(): PathDataStructure | null {
    try {
      return JSON.parse(this.pathData);
    } catch (error) {
      console.error('Failed to parse pathData:', error);
      return null;
    }
  }

  /**
   * Set pathData from PathDataStructure
   */
  public setPathDataObject(data: PathDataStructure): void {
    this.pathData = JSON.stringify(data);
  }

  /**
   * Validierung der pathData
   */
  public isValidPathData(): boolean {
    const data = this.getPathDataObject();
    if (!data) return false;

    // SVG Path muss vorhanden sein
    if (!data.svgPath || typeof data.svgPath !== 'string') {
      return false;
    }

    // Kontrollpunkte müssen Array sein
    if (!Array.isArray(data.controlPoints)) {
      return false;
    }

    // Kontrollpunkte müssen x und y haben
    for (const point of data.controlPoints) {
      if (typeof point.x !== 'number' || typeof point.y !== 'number') {
        return false;
      }
    }

    return true;
  }

  /**
   * Generiere vordefinierte Pfade
   */
  public static generatePredefinedPath(
    type: 'line' | 'curve' | 'arc' | 'circle',
    width: number = 300,
    height: number = 300
  ): PathDataStructure {
    switch (type) {
      case 'line':
        return {
          svgPath: `M 0,0 L ${width},${height}`,
          controlPoints: [
            { x: 0, y: 0, type: 'move' },
            { x: width, y: height, type: 'line' },
          ],
          viewBox: { width, height },
        };

      case 'curve':
        return {
          svgPath: `M 0,${height / 2} Q ${width / 2},0 ${width},${height / 2}`,
          controlPoints: [
            { x: 0, y: height / 2, type: 'move' },
            { x: width / 2, y: 0, type: 'curve' },
            { x: width, y: height / 2, type: 'curve' },
          ],
          viewBox: { width, height },
        };

      case 'arc':
        return {
          svgPath: `M 0,${height} A ${width / 2},${height / 2} 0 0,1 ${width},${height}`,
          controlPoints: [
            { x: 0, y: height, type: 'move' },
            { x: width, y: height, type: 'arc' },
          ],
          viewBox: { width, height },
        };

      case 'circle':
        const cx = width / 2;
        const cy = height / 2;
        const r = Math.min(width, height) / 2;
        return {
          svgPath: `M ${cx},${cy - r} A ${r},${r} 0 1,1 ${cx - 0.001},${cy - r} Z`,
          controlPoints: [
            { x: cx, y: cy - r, type: 'move' },
            { x: cx, y: cy + r, type: 'arc' },
          ],
          viewBox: { width, height },
        };

      default:
        return {
          svgPath: `M 0,0 L ${width},${height}`,
          controlPoints: [
            { x: 0, y: 0, type: 'move' },
            { x: width, y: height, type: 'line' },
          ],
          viewBox: { width, height },
        };
    }
  }

  /**
   * Validiere pathType ENUM
   */
  public static isValidPathType(type: string): type is 'line' | 'curve' | 'arc' | 'circle' | 'custom' {
    return ['line', 'curve', 'arc', 'circle', 'custom'].includes(type);
  }

  /**
   * Validiere anchorPoint ENUM
   */
  public static isValidAnchorPoint(
    anchor: string
  ): anchor is 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top' | 'bottom' | 'left' | 'right' {
    return ['center', 'top-left', 'top-right', 'bottom-left', 'bottom-right', 'top', 'bottom', 'left', 'right'].includes(anchor);
  }

  /**
   * Get CSS offset-anchor value from anchorPoint
   */
  public getCSSAnchorPoint(): string {
    const anchorMap: Record<string, string> = {
      'center': 'center',
      'top-left': 'left top',
      'top-right': 'right top',
      'bottom-left': 'left bottom',
      'bottom-right': 'right bottom',
      'top': 'center top',
      'bottom': 'center bottom',
      'left': 'left center',
      'right': 'right center',
    };
    return anchorMap[this.anchorPoint] || 'center';
  }

  /**
   * Get CSS offset-rotate value
   */
  public getCSSOffsetRotate(): string {
    if (!this.autoOrient) {
      return `${this.orientAngle}deg`;
    }
    return this.orientAngle === 0 ? 'auto' : `auto ${this.orientAngle}deg`;
  }
}

/**
 * Initialize MotionPath Model
 */
export function initMotionPath(sequelize: Sequelize): typeof MotionPath {
  MotionPath.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      elementAnimationId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        field: 'element_animation_id',
      },
      pathType: {
        type: DataTypes.ENUM('line', 'curve', 'arc', 'circle', 'custom'),
        allowNull: false,
        defaultValue: 'line',
        field: 'path_type',
        validate: {
          isIn: {
            args: [['line', 'curve', 'arc', 'circle', 'custom']],
            msg: 'pathType must be one of: line, curve, arc, circle, custom',
          },
        },
      },
      pathData: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: 'path_data',
        validate: {
          isValidJSON(value: string) {
            try {
              JSON.parse(value);
            } catch (error) {
              throw new Error('pathData must be valid JSON');
            }
          },
        },
      },
      autoOrient: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'auto_orient',
      },
      orientAngle: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'orient_angle',
        validate: {
          min: -360,
          max: 360,
        },
      },
      anchorPoint: {
        type: DataTypes.ENUM('center', 'top-left', 'top-right', 'bottom-left', 'bottom-right', 'top', 'bottom', 'left', 'right'),
        allowNull: false,
        defaultValue: 'center',
        field: 'anchor_point',
        validate: {
          isIn: {
            args: [['center', 'top-left', 'top-right', 'bottom-left', 'bottom-right', 'top', 'bottom', 'left', 'right']],
            msg: 'anchorPoint must be one of: center, top-left, top-right, bottom-left, bottom-right, top, bottom, left, right',
          },
        },
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
    },
    {
      sequelize,
      tableName: 'motion_paths',
      timestamps: true,
      underscored: true,
    }
  );

  return MotionPath;
}

export default MotionPath;
