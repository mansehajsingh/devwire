/* require dependencies */
const { User, Project, ProjectMember } = require("../models");
const { Sequelize } = require("sequelize");
const userInvalidity = require("./validation/UserValidator");
const dotenv = require("dotenv").config();
const bcrypt = require("bcrypt");
const { validate: isValidUUID } = require("uuid");

/* controller */
class UserController {

    static async getUsers(req, res, next) {
        const usernameQuery = req.query.usernameQuery;
        const limit = req.query.limit <= 100 ? parseInt(req.query.limit) : 10;
        
        const likeUsers = await User.findAll({
            attributes: ["id", "username", "first_name", "last_name"],
            limit: limit,
            where: {
                username: {
                    [Sequelize.Op.iLike]: `%${usernameQuery}%`
                }
            }
        })

        return res.status(200).json({ users: likeUsers });
    }

    static async getUser(req, res, next) {
        // destructuring the request body
        const { user_id } = req.params;
        
        if (!user_id) return res.status(422).json({ message: "No user id provided." });
        if (!isValidUUID(user_id)) return res.status(422).json({ message: "User id format invalid." });

        const user = await User.findOne({ where: { id: user_id } });

        // if the user does not exist
        if (!user) return res.status(404).json({ message: "No user exists with this user id." });

        // formatting response
        const response = {
            id: user.id,
            username: user.username,
            first_name: user.first_name,
            last_name: user.last_name
        }

        return res.status(200).json(response);
    }

    static async createUser(req, res, next) {
        // destructuring request body
        const { username, first_name, last_name, password } = req.body;

        // validating request items
        const userInvalid = userInvalidity(username, first_name, last_name, password);
        if (userInvalid) {
            return res.status(userInvalid.status).json(userInvalid.message);
        }

        // checking if the username exists already in the db
        const usernameExists = await User.usernameExists(username);
        if (usernameExists) {
            return res.status(409).json({ message: "This username has already been taken." });
        }
        
        // hashing the password to store in the db
        bcrypt.hash(password, parseInt(process.env.ROUNDS), async function(err, hashedPassword) {
            const user = await User.create({
                username: username,
                first_name: first_name,
                last_name: last_name,
                hashed_password: hashedPassword
            });
            return res.status(201).json({ 
                message: "User created successfully.",
                resource: {
                    id: user.id,
                    username: user.username,
                    first_name: user.first_name,
                    last_name: user.last_name,
                }
            });
        });
    }

    static async getProjects(req, res, next) {
        const { user_id } = req.params;

        let user;

        try {
            user = await User.findOne({ 
                where: { id: user_id },
                include: [{
                    model: Project,
                    include: [{
                        model: User
                    }]
                }]
            });
        }
        catch (err) {
            return res.status(404).json({ message: "No user exists with this id." });
        }

        const memberProjects = await ProjectMember.findAll({
            where: { user_id: user_id },
            include: [
                {
                    model: Project,
                    include: { model: User }
                },
            ]
        });

        if (!user)
            return res.status(404).json({ message: "No user exists with this id." });

        if (req.session.user_id !== user_id)
            return res.status(403).json({ message: "This token is not authorized to view projects for this user." });

        let projects = [];

        if (user.projects) {
            projects = user.projects.map((project) => {
                return {
                    id: project.id,
                    name: project.name,
                    description: project.description,
                    owner: {
                        id: project.user.id,
                        username: project.user.username,
                        first_name: project.user.first_name,
                        last_name: project.user.last_name
                    }
                };
            });
        }

        if (memberProjects) {
            projects = projects.concat(memberProjects.map((member) => {
                return {
                    id: member.project.id,
                    name: member.project.name,
                    description: member.project.description,
                    owner: {
                        id: member.project.user.id,
                        username: member.project.user.username,
                        first_name: member.project.user.first_name,
                        last_name: member.project.user.last_name
                    }
                };
            }));
        }
        
        return res.status(200).json({
            projects: projects,
        });
    }

    static async editUser(req, res, next) {
        const { user_id } = req.params;
        const { username, first_name, last_name } = req.body;

        if (req.session.user_id !== user_id)
            return res.status(403).json({ message: "This token is not authorized to edit details for this user." });

        // validating request items
        const userInvalid = userInvalidity(username, first_name, last_name, "validpasswordplaceholder");
        if (userInvalid) {
            return res.status(userInvalid.status).json({ message: userInvalid.message });
        }

        // checking if the username exists already in the db
        const usernameExists = await User.findOne({ where: { username: username } });
        if (usernameExists && usernameExists.id !== user_id) {
            return res.status(409).json({ message: "This username has already been taken." });
        }

        const updatedUser = await User.update({ 
            username, first_name, last_name
        }, {
            where: { id: user_id }
        });

        return res.status(200).json({
            resource: {
                id: user_id,
                username, first_name, last_name
            }
        });
    }

}

module.exports = UserController;