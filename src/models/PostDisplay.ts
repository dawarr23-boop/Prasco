import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

interface PostDisplayAttributes {
  postId: number;
  displayId: number;
  priorityOverride?: number;
  createdAt?: Date;
}

class PostDisplay
  extends Model<PostDisplayAttributes>
  implements PostDisplayAttributes
{
  public postId!: number;
  public displayId!: number;
  public priorityOverride?: number;

  public readonly createdAt!: Date;
}

PostDisplay.init(
  {
    postId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'posts',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    displayId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'displays',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    priorityOverride: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Optional priority override for this specific display',
    },
  },
  {
    sequelize,
    tableName: 'post_displays',
    timestamps: true,
    updatedAt: false,
    indexes: [
      {
        fields: ['post_id', 'display_id'],
        unique: true,
      },
      {
        fields: ['display_id'],
      },
    ],
  }
);

export default PostDisplay;
