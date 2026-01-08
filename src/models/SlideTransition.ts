import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';
import Post from './Post';

// Attribute-Interface
interface SlideTransitionAttributes {
  id: number;
  postId: number;
  transitionType: string;
  direction?: string;
  duration: number;
  easing: string;
  delay: number;
  zIndex: number;
  options?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

// Creation-Attribute (id, createdAt, updatedAt sind optional beim Erstellen)
interface SlideTransitionCreationAttributes
  extends Optional<SlideTransitionAttributes, 'id' | 'delay' | 'zIndex' | 'createdAt' | 'updatedAt'> {}

// Model-Klasse
class SlideTransition
  extends Model<SlideTransitionAttributes, SlideTransitionCreationAttributes>
  implements SlideTransitionAttributes
{
  public id!: number;
  public postId!: number;
  public transitionType!: string;
  public direction?: string;
  public duration!: number;
  public easing!: string;
  public delay!: number;
  public zIndex!: number;
  public options?: Record<string, any>;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Validierungsmethode
  public isValid(): boolean {
    const validTypes = ['fade', 'slide', 'zoom', 'wipe', 'push', 'cube', 'flip', 'morph'];
    const validDirections = ['left', 'right', 'up', 'down', 'in', 'out'];

    if (!validTypes.includes(this.transitionType)) {
      return false;
    }

    if (this.direction && !validDirections.includes(this.direction)) {
      return false;
    }

    if (this.duration < 0 || this.duration > 5000) {
      return false; // Max 5 Sekunden
    }

    return true;
  }

  // Gibt ein nutzerfreundliches Objekt zurück
  public toJSON(): object {
    return {
      id: this.id,
      postId: this.postId,
      transitionType: this.transitionType,
      direction: this.direction,
      duration: this.duration,
      easing: this.easing,
      delay: this.delay,
      zIndex: this.zIndex,
      options: this.options,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

// Model-Initialisierung
SlideTransition.init(
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
      onDelete: 'CASCADE',
      unique: true,
    },
    transitionType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'transition_type',
      validate: {
        isIn: [['fade', 'slide', 'zoom', 'wipe', 'push', 'cube', 'flip', 'morph']],
      },
    },
    direction: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: {
        isIn: [['left', 'right', 'up', 'down', 'in', 'out']],
      },
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 800,
      validate: {
        min: 0,
        max: 5000,
      },
    },
    easing: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'ease-in-out',
    },
    delay: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    zIndex: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      field: 'z_index',
    },
    options: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'slide_transitions',
    underscored: true,
    timestamps: true,
  }
);

// Relationship zu Post
SlideTransition.belongsTo(Post, {
  foreignKey: 'postId',
  as: 'post',
});

Post.hasOne(SlideTransition, {
  foreignKey: 'postId',
  as: 'transition',
});

export default SlideTransition;
