/**
 * Implement the auth manager.
 * |-- copyright and license --|
 * @package    ShackDB
 * @file       auth_manager.js
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
const UsersManager = require('../../users').UsersManager;
const IUser = require("../../users/lib/user.interface");
const IAuth = require("./auth.interface");
const uuid = require('uuid');


/**
 * Implement the auth manager class.
 */
class AuthManager extends IAuth
{
    constructor()
    {
        super();
        this._userIdToToken = {};
        this._tokenToUser = {};
    }

    authenticate(username, password)
    {
        if (!username) { throw new Error("Missing user id!"); }
        if (!password) { throw new Error("Missing user password!"); }

        return new Promise(async (resolve, reject) => {

            // get user
            let user;
            try {
                user = await UsersManager.get(username);
            }
            catch (e) {
                reject("User not found!");
                return;
            }

            // disabled?
            if (!user.enabled) {
                reject("User is disabled!");
                return;
            }

            // attempt to authenticate
            if (user.authenticate(password)) {
                resolve(user);
            }
            else {
                reject("Wrong password!");
            }
        });
    }

    userToToken(user, source)
    {
        // sanity and get userid
        if (!user) { throw new Error("Missing user id!"); }
        if (!(user instanceof IUser)) { throw new Error("User param must be an instance of IUser!"); }
        if (!source){ throw new Error("Missing token source!"); } 
        
        // get token key
        let tokenKey = user.id + '&' + source;

        // generate new token
        if (!this._userIdToToken[tokenKey]) {
            let token = tokenKey + '&' + uuid.v4();
            this._userIdToToken[tokenKey] = token;
            this._tokenToUser[token] = {user: user, source: source, version: user.version};
            logger.debug(`Created auth token for user ${user.id} and source ${source}.`);
        }

        // return token
        return this._userIdToToken[tokenKey];
    }

    tokenToUser(token, source)
    {
        if (!token) { throw new Error("Missing token param!"); }
        if (!source){ throw new Error("Missing token source!"); } 
        
        // get user details
        let ret = this._tokenToUser[token] || null;
        if (!ret) {
            return null;
        }

        // check source mismatch
        if (ret.source !== source) {
            logger.debug(`Rejected auth because source mismatch (source: ${source}, expected: ${ret.source}).`);
            return null;
        }

        // check if need to update user
        if (ret.user.version !== ret.version) {
            logger.debug(`Reload user ${ret.user.id} in background because of version mismatch.`);
            UsersManager.get(ret.user.id).then((user) => {
                ret.user = user;
                ret.version = user.version;
            });
        }

        // return user
        return ret ? ret.user : null;
    }

    delete(userId)
    {
        for (let key in this._userIdToToken) {
            if (key.split('&')[0] === userId) {
                delete this._userIdToToken[key];
            }
        }

        for (let key in this._tokenToUser) {
            if (this._tokenToUser[key].user.id === userId) {
                delete this._tokenToUser[key];
            }
        }
    }

    clearTokens()
    {
        this._tokenToUser = {};
        this._userIdToToken = {};
        logger.debug(`Cleared all auth tokens.`);
    }
}
  
 
 // export the auth manager.
 module.exports = new AuthManager();