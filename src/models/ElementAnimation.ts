import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export type AnimationType = 'entrance' | 'exit' | 'emphasis' | 'motion-path';
export type TriggerType = 'auto' | 'click' | 'hover' | 'scroll' | 'sequence';

interface ElementAnimationAttributes {
  id: number;
  postId: number;
  elementSelector: string;
  elementIndex?: number;
  animationType: AnimationType;
  effectName: string;
  startTime: number;
  duration: number;
  delay: number;
  easing: string;
  direction?: string;
  intensity: number;
  distance?: number;
  triggerType: TriggerType;
  triggerTarget?: string;
  sequenceOrder: number;
  options?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ElementAnimationCreationAttributes
  extends Optional<
    ElementAnimationAttributes,
    | 'id'
    | 'elementIndex'
    | 'startTime'
    | 'duration'
    | 'delay'
    | 'easing'
    | 'direction'
    | 'intensity'
    | 'distance'
    | 'triggerType'
    | 'triggerTarget'
    | 'sequenceOrder'
    | 'options'
    | 'createdAt'
    | 'updatedAt'
  > {}

class ElementAnimation
  extends Model<ElementAnimationAttributes, ElementAnimationCreationAttributes>
  implements ElementAnimationAttributes
{
  public id!: number;
  public postId!: number;
  public elementSelector!: string;
  public elementIndex?: number;
  public animationType!: AnimationType;
  public effectName!: string;
  public startTime!: number;
  public duration!: number;
  public delay!: number;
  public easing!: string;
  public direction?: string;
  public intensity!: number;
  public distance?: number;
  public triggerType!: TriggerType;
  public triggerTarget?: string;
  public sequenceOrder!: number;
  public options?: Record<string, any>;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Validierungsmethode
  public isValid(): boolean {
    const validTypes: AnimationType[] = ['entrance', 'exit', 'emphasis', 'motion-path'];
    const validTriggers: TriggerType[] = ['auto', 'click', 'hover', 'scroll', 'sequence'];
    const validEntranceEffects = [
      'fadeIn',
      'fadeInUp',
      'fadeInDown',
      'fadeInLeft',
      'fadeInRight',
      'flyIn',
      'flyInUp',
      'flyInDown',
      'flyInLeft',
      'flyInRight',
      'zoomIn',
      'zoomInUp',
      'zoomInDown',
      'bounceIn',
      'slideIn',
      'slideInUp',
      'slideInDown',
      'slideInLeft',
      'slideInRight',
      'rotateIn',
      'flipIn',
      'lightSpeedIn',
    ];
    const validExitEffects = [
      'fadeOut',
      'fadeOutUp',
      'fadeOutDown',
      'fadeOutLeft',
      'fadeOutRight',
      'flyOut',
      'flyOutUp',
      'flyOutDown',
      'flyOutLeft',
      'flyOutRight',
      'zoomOut',
      'bounceOut',
      'slideOut',
      'slideOutUp',
      'slideOutDown',
      'slideOutLeft',
      'slideOutRight',
      'rotateOut',
      'flipOut',
    ];
    const validEmphasisEffects = [
      'pulse',
      'bounce',
      'shake',
      'swing',
      'wobble',
      'jello',
      'heartBeat',
      'flash',
      'rubberBand',
      'tada',
      'grow',
      'shrink',
      'spin',
    ];

    if (!validTypes.includes(this.animationType)) {
      return false;
    }

    if (!validTriggers.includes(this.triggerType)) {
      return false;
    }

    // Validiere Effect-Name basierend auf Animation-Type
    if (this.animationType === 'entrance' && !validEntranceEffects.includes(this.effectName)) {
      return false;
    }
    if (this.animationType === 'exit' && !validExitEffects.includes(this.effectName)) {
      return false;
    }
    if (this.animationType === 'emphasis' && !validEmphasisEffects.includes(this.effectName)) {
      return false;
    }

    // Timing-Validierung
    if (this.duration < 0 || this.duration > 10000) {
      return false; // Max 10 Sekunden
    }
    if (this.startTime < 0) {
      return false;
    }
    if (this.delay < 0) {
      return false;
    }

    // Intensity-Validierung
    if (this.intensity < 0 || this.intensity > 100) {
      return false;
    }

    return true;
  }

  // Hilfsmethode zum Abrufen der CSS-Klasse
  public getCSSClass(): string {
    return `animate-${this.effectName}`;
  }

  // Hilfsmethode zum Generieren der Animation-Config
  public getAnimationConfig(): Record<string, any> {
    return {
      type: this.animationType,
      effect: this.effectName,
      timing: {
        startTime: this.startTime,
        duration: this.duration,
        delay: this.delay,
        easing: this.easing,
      },
      properties: {
        direction: this.direction,
        intensity: this.intensity,
        distance: this.distance,
      },
      trigger: {
        type: this.triggerType,
        target: this.triggerTarget,
      },
      sequence: this.sequenceOrder,
      options: this.options || {},
    };
  }
}

ElementAnimation.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    postId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'post_id',
      references: {
        model: 'posts',
        key: 'id',
      },
    },
    elementSelector: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'element_selector',
    },
    elementIndex: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'element_index',
    },
    animationType: {
      type: DataTypes.ENUM('entrance', 'exit', 'emphasis', 'motion-path'),
      allowNull: false,
      field: 'animation_type',
    },
    effectName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'effect_name',
    },
    startTime: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'start_time',
    },
    duration: {
      type: DataTypes.INTEGER,
      defaultValue: 500,
    },
    delay: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    easing: {
      type: DataTypes.STRING(50),
      defaultValue: 'ease-out',
    },
    direction: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    intensity: {
      type: DataTypes.INTEGER,
      defaultValue: 100,
    },
    distance: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    triggerType: {
      type: DataTypes.ENUM('auto', 'click', 'hover', 'scroll', 'sequence'),
      defaultValue: 'auto',
      field: 'trigger_type',
    },
    triggerTarget: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'trigger_target',
    },
    sequenceOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'sequence_order',
    },
    options: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'element_animations',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['post_id'],
      },
      {
        fields: ['post_id', 'sequence_order'],
      },
      {
        fields: ['animation_type'],
      },
    ],
  }
);

export default ElementAnimation;
