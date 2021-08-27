/**
 * Implement api middlewares to apply on express app.
 * |-- copyright and license --|
 * @package    ShackDB
 * @file       middlewares.js
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
const {AuthManager} = require('./../../auth');

module.exports = function(app) {

    // add middleware to fetch user from cookie
    app.use(function (req, res, next) {

        let token = req.cookies['auth-token'] || req.signedCookies['auth-token']
        if (token) {

            try {
                // get token from cookie and convert to user
                req.user = token ? AuthManager.tokenToUser(token, req.socket.remoteAddress) : null;

                // if disabled, remove user
                if (req.user && !req.user.enabled) {
                    req.user = null;
                }
            }
            catch (e) {
                logger.error("Error while trying to get user from cookie! Error: " + e);
            }
        }
    
        // continue pipeline
        next();
    });

    // add middleware to identify if request is from localhost
    app.use(function (req, res, next) {

        // check if localhost
        var ip = req.socket.remoteAddress;
        var host = req.get('host');   
        req.isLocalhostRequest = ((ip === "127.0.0.1") || (ip === "::ffff:127.0.0.1") || (ip === "::1") || (host.indexOf("localhost") !== -1));
    
        // continue pipeline
        next();
    });
};