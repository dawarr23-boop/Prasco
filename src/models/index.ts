import User from './User';
import Organization from './Organization';
import Category from './Category';
import Media from './Media';
import Post from './Post';
import Permission from './Permission';
import RolePermission from './RolePermission';
import UserPermission from './UserPermission';
import Setting from './Setting';
import Display from './Display';
import PostDisplay from './PostDisplay';

// Define associations

// Organization -> Users (1:N)
Organization.hasMany(User, {
  foreignKey: 'organizationId',
  as: 'users',
});
User.belongsTo(Organization, {
  foreignKey: 'organizationId',
  as: 'organization',
});

// Organization -> Categories (1:N)
Organization.hasMany(Category, {
  foreignKey: 'organizationId',
  as: 'categories',
});
Category.belongsTo(Organization, {
  foreignKey: 'organizationId',
  as: 'organization',
});

// Organization -> Posts (1:N)
Organization.hasMany(Post, {
  foreignKey: 'organizationId',
  as: 'posts',
});
Post.belongsTo(Organization, {
  foreignKey: 'organizationId',
  as: 'organization',
});

// Organization -> Media (1:N)
Organization.hasMany(Media, {
  foreignKey: 'organizationId',
  as: 'media',
});
Media.belongsTo(Organization, {
  foreignKey: 'organizationId',
  as: 'organization',
});

// User -> Posts (1:N) - Creator
User.hasMany(Post, {
  foreignKey: 'createdBy',
  as: 'posts',
});
Post.belongsTo(User, {
  foreignKey: 'createdBy',
  as: 'creator',
});

// User -> Media (1:N) - Uploader
User.hasMany(Media, {
  foreignKey: 'uploadedBy',
  as: 'uploadedMedia',
});
Media.belongsTo(User, {
  foreignKey: 'uploadedBy',
  as: 'uploader',
});

// Category -> Posts (1:N)
Category.hasMany(Post, {
  foreignKey: 'categoryId',
  as: 'posts',
});
Post.belongsTo(Category, {
  foreignKey: 'categoryId',
  as: 'category',
});

// Media -> Posts (1:N) - A media file can be used in multiple posts
Media.hasMany(Post, {
  foreignKey: 'mediaId',
  as: 'posts',
});
Post.belongsTo(Media, {
  foreignKey: 'mediaId',
  as: 'media',
});

// Permission -> RolePermissions (1:N)
Permission.hasMany(RolePermission, {
  foreignKey: 'permissionId',
  as: 'rolePermissions',
});
RolePermission.belongsTo(Permission, {
  foreignKey: 'permissionId',
  as: 'permission',
});

// Permission -> UserPermissions (1:N)
Permission.hasMany(UserPermission, {
  foreignKey: 'permissionId',
  as: 'userPermissions',
});
UserPermission.belongsTo(Permission, {
  foreignKey: 'permissionId',
  as: 'permission',
});

// User -> UserPermissions (1:N) - Direct permission grants/revokes
User.hasMany(UserPermission, {
  foreignKey: 'userId',
  as: 'userPermissions',
});
UserPermission.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

// Many-to-Many: User <-> Permission (through UserPermission)
User.belongsToMany(Permission, {
  through: UserPermission,
  foreignKey: 'userId',
  otherKey: 'permissionId',
  as: 'permissions',
});
Permission.belongsToMany(User, {
  through: UserPermission,
  foreignKey: 'permissionId',
  otherKey: 'userId',
  as: 'users',
});

// Organization -> Displays (1:N)
Organization.hasMany(Display, {
  foreignKey: 'organizationId',
  as: 'displays',
});
Display.belongsTo(Organization, {
  foreignKey: 'organizationId',
  as: 'organization',
});

// Many-to-Many: Post <-> Display (through PostDisplay)
Post.belongsToMany(Display, {
  through: PostDisplay,
  foreignKey: 'postId',
  otherKey: 'displayId',
  as: 'displays',
});
Display.belongsToMany(Post, {
  through: PostDisplay,
  foreignKey: 'displayId',
  otherKey: 'postId',
  as: 'posts',
});

// PostDisplay Relations
Post.hasMany(PostDisplay, {
  foreignKey: 'postId',
  as: 'postDisplays',
});
PostDisplay.belongsTo(Post, {
  foreignKey: 'postId',
  as: 'post',
});

Display.hasMany(PostDisplay, {
  foreignKey: 'displayId',
  as: 'postDisplays',
});
PostDisplay.belongsTo(Display, {
  foreignKey: 'displayId',
  as: 'display',
});

export { User, Organization, Category, Media, Post, Permission, RolePermission, UserPermission, Setting, Display, PostDisplay };

export default {
  User,
  Organization,
  Category,
  Media,
  Post,
  Permission,
  RolePermission,
  UserPermission,
  Setting,
  Display,
  PostDisplay,
};
