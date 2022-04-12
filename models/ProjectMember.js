/* require dependencies */
const { sequelize } = require("../database");
const { Model, DataTypes } = require("sequelize");
const User = require("./User");
const Project = require("./Project");

/* init model */
class ProjectMember extends Model {};

ProjectMember.init(
    /* model attributes */
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            primaryKey: true
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: User,
                key: "id"
            }
        },
        project_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: Project,
                key: "id"
            }
        },
        type: {
            type: DataTypes.ENUM("member"), // can add more types in the future
            allowNull: false,
            defaultValue: "member",
        },
    },
    /* model options */
    {
        sequelize,
        modelName: "project_member"
    }
);

module.exports = ProjectMember;