/**
 * Implement the users api.
 * |-- copyright and license --|
 * @package    ShackDB
 * @file       api_users.js
 * @author     Ronen Ness (ronenness@gmail.com | http://ronenness.com)
 * @copyright  (c) 2021 Ronen Ness
 * @license    GPL-3.0-only or GPL-3.0-or-later
 * @CLA        Contributions are licensed under this license, as well as give all rights to use, modify and *distribute outside of this license* to Ronen Ness.
 *             The author / copyright owner of this code (Ronen Ness) reserve the right to distribute everything under a different license (dual licensing), including contributions made by other people.
 *
 *   This file is part of ShackDB.
 *
 *   ShackDB is free software: you can redistribute it and/or modify
 *   it under the terms of the GNU General Public License as published by
 *   the Free Software Foundation, either version 3 of the License, or
 *   (at your option) any later version.
 *
 *   ShackDB is distributed in the hope that it will be useful,
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *   GNU General Public License for more details.
 *
 *   You should have received a copy of the GNU General Public License
 *   along with ShackDB.  If not, see <https://www.gnu.org/licenses/>.
 * |-- end copyright and license --|
 * 
 */
const logger = require('./logger');
const config = require('./../../config');
const { UsersManager } = require('../../users');
const ApiBase = require('./api_base');
const Joi = require('joi');
const usersStorage = require('../../users/lib/users_storage');
const { AuthManager } = require('../../auth');


/**
 * Manage all user apis.
 */
class ApiUsers extends ApiBase
{
    setupRoutes(app)
    {
        logger.info("Setup users routes.");

        this.register(app, 'get', 'users', this.getUsersList, null, true, true);
        this.register(app, 'delete', 'users/:username', this.deleteUser, null, true, true);
        this.register(app, 'get', 'users/:username', this.getUserData, null, true, true);
        this.register(app, 'head', 'users/:username', this.getUserHead, null, true, true);

        this.register(app, 'post', 'users/:username', this.createUser, new Joi.object({
            email: Joi.string().email({ tlds: { allow: false } }),
            password: Joi.string().required(),
            superuser: Joi.boolean(),
        }), true, true);

        this.register(app, 'put', 'users/:username', this.updateUser, new Joi.object({
            email: Joi.string().email({ tlds: { allow: false } }),
            password: Joi.string(),
            enabled: Joi.boolean(),
        }), true, true);
    }

    async getUsersList(req, res)
    {
        return new Promise(async (resolve, reject) => {

            // check if must be admin
            if (!req.user || !req.user.superuser) {
                this.sendError(req, res, 401, "Unauthorized! Must be admin to perform this action.");
                reject("Unauthorized! Must be admin to perform this action.");
                return;
            }

            // return users list
            let users = await usersStorage.list();
            this.sendSuccess(res, users);
            resolve(true);
        });
    }

    async createUser(req, res)
    {
        return new Promise(async (resolve, reject) => {

            // check if must be admin
            if (config.security.mustBeAdminToCreateUser) {
                if (!req.user || !req.user.superuser) {
                    this.sendError(req, res, 401, "Unauthorized! Must be admin to perform this action.");
                    reject("Unauthorized! Must be admin to perform this action.");
                    return;
                }
            }

            // get user id and check if already exists
            const username = req.params.username;
            if (await UsersManager.exist(username)) {
                this.sendError(req, res, 409, "User already exist!");
                reject("User already exist!");
                return;
            }

            // make sure only admins can create admins
            if (req.body.superuser && !req.user.superuser) {
                this.sendError(req, res, 400, "Only admins can create other admins!");
                reject("Only admins can create other admins!");
                return;
            }

            // create user 
            try {
                var user = await UsersManager.create(username, {
                    email: req.body.email,
                    password: req.body.password,
                    superuser: req.body.superuser
                });
            }
            catch (e) {
                this.sendError(req, res, 500, "Unknown error creating user!");
                reject("Unknown error creating user!");
                return;
            }

            // return success
            this.sendSuccess(res, user.data);
            resolve(true);
        });
    }
  

    async updateUser(req, res)
    {
        return new Promise(async (resolve, reject) => {

            // get user id and make sure exist
            const username = req.params.username;
            if (await UsersManager.exist(username) === false) {
                this.sendError(req, res, 404, "User to update not found!");
                reject("User to update not found!");
                return;
            }

            // get user 
            try {
                var user = await UsersManager.get(username);
            }
            catch (e) {
                this.sendError(req, res, 500, "Unknown error while getting user!");
                reject("Unknown error while getting user!");
                return;
            }

            // validate user
            if (!(req.user.superuser || req.user == user)) {
                this.sendError(req, res, 401, "You don't have permissions to edit this user!");
                reject("You don't have permissions to edit this user!");
                return;
            }

            // update user
            await user.update({
                password: req.body.password,
                email: req.body.email,
                enabled: req.body.enabled
            }, true);

            // return success
            this.sendSuccess(res);
            resolve(true);
        });
    }


    async deleteUser(req, res)
    {
        return new Promise(async (resolve, reject) => {

            // check if properly authenticated
            const username = req.params.username;
            if (!this.isAuthorized(req, username)) {
                this.sendError(req, res, 401, "Unauthorized!");
                reject("Unauthorized");
                return;
            }

            // delete user
            try {
                await UsersManager.delete(username);
                await AuthManager.delete(username);
            }
            catch (e) {
                this.sendError(req, res, 404, "User not found!");
                reject("User not found!");
                return;
            }

            // return success
            this.sendSuccess(res);
            resolve(true);
        });
    }
    
    async getUserData(req, res)
    {
        return new Promise(async (resolve, reject) => {

            // check if properly authenticated
            const username = req.params.username;
            if (!this.isAuthorized(req, username)) {
                this.sendError(req, res, 401, "Unauthorized!");
                reject("Unauthorized");
                return;
            }

            // get user and make sure exists
            try {
                var user = await UsersManager.get(username);
            }
            catch (e) {
                this.sendError(req, res, 404, "User not found!");
                reject("User not found!");
                return;
            }

            // return success
            this.sendSuccess(res, user.data);
            resolve(true);
        });
    }
        
    async getUserHead(req, res)
    {
        return new Promise(async (resolve, reject) => {

            // check if properly authenticated
            const username = req.params.username;
            if (!this.isAuthorized(req, username)) {
                this.sendError(req, res, 401, "Unauthorized!");
                reject("Unauthorized");
                return;
            }

            // get user and make sure exists
            try {
                await UsersManager.get(username);
            }
            catch (e) {
                this.sendError(req, res, 404, "User not found!");
                reject("User not found!");
                return;
            }

            // return success
            this.sendSuccess(res);
            resolve(true);
        });
    }
}


// export main class
module.exports = new ApiUsers();