import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

interface PostAttributes {
  id: number;
  title: string;
  content: string;
  contentType: 'text' | 'image' | 'video' | 'html' | 'presentation' | 'pdf' | 'word';
  mediaId?: number;
  categoryId?: number;
  organizationId?: number;
  createdBy: number;
  startDate?: Date;
  endDate?: Date;
  duration: number;
  priority: number;
  isActive: boolean;
  showTitle: boolean;
  displayMode: 'all' | 'specific';
  viewCount: number;
  backgroundMusicUrl?: string;
  backgroundMusicVolume?: number;
  blendEffect?: string;
  soundEnabled?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PostCreationAttributes
  extends Optional<
    PostAttributes,
    | 'id'
    | 'mediaId'
    | 'categoryId'
    | 'startDate'
    | 'endDate'
    | 'duration'
    | 'priority'
    | 'isActive'
    | 'showTitle'
    | 'displayMode'
    | 'viewCount'
    | 'backgroundMusicUrl'
    | 'backgroundMusicVolume'
    | 'blendEffect'
    | 'soundEnabled'
    | 'createdAt'
    | 'updatedAt'
  > {}

class Post extends Model<PostAttributes, PostCreationAttributes> implements PostAttributes {
  public id!: number;
  public title!: string;
  public content!: string;
  public contentType!: 'text' | 'image' | 'video' | 'html' | 'presentation' | 'pdf' | 'word';
  public mediaId?: number;
  public categoryId?: number;
  public organizationId?: number;
  public createdBy!: number;
  public startDate?: Date;
  public endDate?: Date;
  public duration!: number;
  public priority!: number;
  public isActive!: boolean;
  public showTitle!: boolean;
  public displayMode!: 'all' | 'specific';
  public viewCount!: number;
  public backgroundMusicUrl?: string;
  public backgroundMusicVolume?: number;
  public blendEffect?: string;
  public soundEnabled?: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public readonly displays?: any[];

  // Helper method to check if post is currently active
  public get isCurrentlyActive(): boolean {
    if (!this.isActive) return false;

    const now = new Date();

    if (this.startDate && now < this.startDate) return false;
    if (this.endDate && now > this.endDate) return false;

    return true;
  }
}

Post.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    contentType: {
      type: DataTypes.ENUM('text', 'image', 'video', 'html', 'presentation', 'pdf', 'word'),
      allowNull: false,
      defaultValue: 'text',
    },
    mediaId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'media',
        key: 'id',
      },
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'categories',
        key: 'id',
      },
    },
    organizationId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'organizations',
        key: 'id',
      },
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 10,
      comment: 'Display duration in seconds',
    },
    priority: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100,
      },
      comment: 'Higher priority posts are shown more often (0-100)',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    showTitle: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Whether to display the title on the display screen',
    },
    displayMode: {
      type: DataTypes.ENUM('all', 'specific'),
      allowNull: false,
      defaultValue: 'all',
      comment: 'Show on all displays or specific displays only',
    },
    viewCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    backgroundMusicUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'URL to background music file for non-video content',
    },
    backgroundMusicVolume: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 50,
      comment: 'Background music volume (0-100)',
    },
    blendEffect: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Transition blend effect (fade, slide-left, slide-right, zoom-in, zoom-out, etc.)',
    },
    soundEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true,
      comment: 'Whether sound/audio is enabled for this post (video posts)',
    },
  },
  {
    sequelize,
    tableName: 'posts',
    timestamps: true,
    indexes: [
      {
        fields: ['is_active', 'start_date', 'end_date'],
      },
      {
        fields: ['organization_id'],
      },
      {
        fields: ['category_id'],
      },
    ],
  }
);

export default Post;
