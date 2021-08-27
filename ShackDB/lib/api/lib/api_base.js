/**
 * Implement the authentication api.
 * |-- copyright and license --|
 * @package    ShackDB
 * @file       api_base.js
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
const { AuthManager } = require('../../auth');

// schema validation options
const schemaOptions = {
    abortEarly: true,        // include all errors
    allowUnknown: false,     // ignore unknown props
    stripUnknown: false      // remove unknown props
};


/**
 * Base class for an API manager.
 */
class ApiBase
{
    /**
     * Register all API routes.
     * @param {express.app} app main app instance.
     */
    setupRoutes(app)
    {
        throw new Error("Not Implemented!");
    }

    /**
     * Do custom cleanups.
     */
    cleanup()
    {
    }

    /**
     * Check if request have authenticated superuser, or a given username.
     * @param {express.Request} req request to check. 
     * @param {String} username username to check.
     * @returns {Boolean} if request authorized to access this API.
     */
    isAuthorized(req, username)
    {
        let validUser = req.user && ((req.user.id == username) || (req.user.superuser));
        return validUser;
    }

    /**
     * Register a route.
     * @param {express.app} app main app instance.
     * @param {String} method http type - get / post / put / delete..
     * @param {String} url url to put after config.server.apiUrl prefix.
     * @param {Function} handler handler method.
     * @param {Joi.object} joiSchema optional joi schema to validate body.
     * @param {Boolean} mustBeLoggedIn if true, will return 400 if not logged in.
     * @param {Boolean} isManagementAPI if true, this is a management API (and not storage access).
     */
    register(app, method, url, handler, joiSchema, mustBeLoggedIn, isManagementAPI)
    {
        // get full url
        let fullUrl = config.server.apiUrl + url;
        logger.info("Register route: ", method, fullUrl);

        // register method
        app[method](fullUrl, async (req, res) => {

            // validate schema
            if (joiSchema) {
                const { error, value } = joiSchema.validate(req.body, schemaOptions);
                if (error) {
                    let errMsg = error.details[0].message;
                    this.sendError(req, res, 400, errMsg);
                    logger.warn("Failed request body validation: " + errMsg);
                    return;
                }
            }

            // make sure logged in
            if (mustBeLoggedIn && !req.user) {
                this.sendError(req, res, 401, "User not logged in!");
                return;
            }

            // check if should block
            if (isManagementAPI && config.security.localhostManagementOnly && !req.isLocalhostRequest) {
                this.sendError(req, res, 401, "Management API is blocked for external connections.");
                return;
            }

            // call handler
            try {
                await handler.call(this, req, res);
            }
            catch (e) {
                if (!req.__writtenError) {
                    logger.error(`Error in url ${fullUrl}: ${e}`);
                }
            }
        })
    }

    /**
     * Generate error response with code and message.
     * @param {express.Request} req request object.
     * @param {express.Response} res response object.
     * @param {Number} code status code.
     * @param {String} error error message.
     */
    sendError(req, res, code, error)
    {
        if (code !== 404) {
            logger.warn(`Error in url '${req.url}': ${code} '${error}'.`);
        }
        res.__writtenError = true;
        res.status(code);
        res.end(JSON.stringify({error: error}));
    }

    /**
     * Generate success response with code and message.
     * @param {express.Response} res response object.
     * @param {*} data optional data to attach.
     * @param {Number} code status code (default to 200).
     */
    sendSuccess(res, data, code)
    {
        const ret = data || null;
        res.status(code || 200);
        res.end(JSON.stringify(ret));
    }
}


// export main class
module.exports = ApiBase;