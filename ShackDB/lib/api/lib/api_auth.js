/**
 * Implement the authentication api.
 * |-- copyright and license --|
 * @package    ShackDB
 * @file       api_auth.js
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
const config = require('../../config');
const ApiBase = require('./api_base');
const Joi = require('joi');
const { UsersManager } = require('../../users');
const { AuthManager } = require('../../auth');


/**
 * Manage basic authentication.
 */
class ApiAuth extends ApiBase
{
    setupRoutes(app)
    {
        this._failedAttempts = {};

        this.register(app, 'post', 'auth/login', this.login, 
            new Joi.object({
                username: Joi.string().required(),
                password: Joi.string().required(),
            }), false, true
        );

        this.register(app, 'post', 'auth/logout', this.logout, null, false, true);

        // reduce failed attempts
        this._clearFailedAttemptsInterval = setInterval(() => {
            for (let key in this._failedAttempts) {
                this._failedAttempts[key]--;
            }
        }, 10000);
    }

    cleanup()
    {
        if (this._clearFailedAttemptsInterval) {
            clearInterval(this._clearFailedAttemptsInterval);
            this._clearFailedAttemptsInterval = null;
        }
    }

    clearLockedAccounts()
    {
        this._failedAttempts = {};
    }

    async login(req, res)
    {
        return new Promise(async (resolve, reject) => {

            // get username and make sure valid
            let username = req.body.username;
            if (!username) {
                this.sendError(req, res, 400, "Missing username.");
                reject("Missing username.");
                return;
            }

            // too many failed attempts? error
            if (this._failedAttempts[username] > config.security.maxFailedLoginAttempts) {
                this._failedAttempts[username] = Math.max(config.security.maxFailedLoginAttempts * 2, 10);
                this.sendError(req, res, 429, "Too many login attempts!");
                reject("Too many login attempts!");
                return;
            }

            // try to authenticate
            try {
                var user = await AuthManager.authenticate(username, req.body.password);
            }
            catch (e) {
                this._failedAttempts[username] = (this._failedAttempts[username] || 0) + 1;
                this.sendError(req, res, 401, e);
                reject(e);
                return;
            }

            // get authentication token
            let token = AuthManager.userToToken(user, req.socket.remoteAddress);

            // set authentication cookie
            try {
                let options = { signed: config.security.signCookies, secret: config.security.cookiesSecret, secure: true };
                let maxAge = (config.security.authTokenMaxAgeSeconds * 1000) || undefined;
                if (maxAge) {
                    options.maxAge = maxAge;
                }
                res.cookie('auth-token', token, options);
            }
            catch (e) {
                reject(e);
                return;
            }

            // return success
            try {
                this.sendSuccess(res, {user: user.id, token: token});
                resolve(true);
            }
            catch (e) {
                reject(e);
            }
        });
    }

    
    async logout(req, res)
    {
        return new Promise(async (resolve, reject) => {

            // remove authentication cookie regardless if found user or not
            try {
                res.clearCookie('auth-token');
            }
            catch (e) {
                reject(e);
                return;
            }

            // no user? return 400 
            if (!req.user) {
                this.sendError(req, res, 400, "Not logged in.");
                reject("Not logged in.");
                return;
            }

            // return success
            this.sendSuccess(res, {user: req.user.id});
            resolve(true);
        });
    }
}


// export main class
module.exports = new ApiAuth();