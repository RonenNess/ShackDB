/**
 * Perform a set of security checks and show warnings on potential issues.
 * |-- copyright and license --|
 * @package    ShackDB
 * @file       security_validations.js
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
const config = require('./lib/config');
const { UsersManager } = require("./lib/users");
const log4js = require("log4js");
const logger = log4js.getLogger('security');

// show warning if default admin is enabled
UsersManager.get('admin').then((user) => {
    if (user.enabled) {
        logger.warn("Default admin user is enabled. Its recommended to disable it and create your own admin under a different name.");
    }
}).catch(() => {});

// show warning if default or no cookie secret is used
if (config.security.cookiesSecret === "shacookie") {
    logger.warn("Default cookies secret is used. Its recommended to change it to a unique string.");
}
else if (!config.security.cookiesSecret) {
    logger.warn("Cookies secret is not used. Its recommended to enable it.");
}

// show warning if using general bind address
if (config.server.hostname === '0.0.0.0') {
    logger.warn("Binding hostname is permissive 0.0.0.0 address. Its more secured to use a more specific hostname or IP.");
}

// show warning if http is enabled
if (config.server.port) {
    logger.warn("HTTP is enabled. Its recommended to enable HTTPS and disable HTTP.");
}