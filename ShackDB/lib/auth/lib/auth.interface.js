/**
 * IAuth interface: define the interface for user authentication.
 * |-- copyright and license --|
 * @package    ShackDB
 * @file       auth.interface.js
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

const IUser = require("../../users/lib/user.interface");


/**
 * Interface for the authentication manager class.
 */
class IAuth
{
    /**
     * Authenticate user.
     * @param {String} username Username. 
     * @param {String} password Password.
     * @returns {Promise.<IUser>} Promise with user instance, or reject with reason why.
     */
    authenticate(username, password)
    {
        throw new Error("Not Implemented!");
    }

    /**
     * Get authentication token for user - push this into cookies to keep signed in.
     * @param {IUser} user user to get token for.
     * @param {String} source source ip or hostname.
     * @returns {String} token content.
     */
    userToToken(user, source)
    {
        throw new Error("Not Implemented!");
    }

    /**
     * Get user instance from authentication token.
     * @param {String} token authentication token.
     * @param {String} source source ip or hostname.
     * @returns {IUser} user instance, or null if token is invalid.
     */
    tokenToUser(token, source)
    {
        throw new Error("Not Implemented!");
    }

    /**
     * Clear all tokens, essentially logging out all users that have token cookie.
     */
    clearTokens()
    {
        throw new Error("Not Implemented!");
    }

    /**
     * Clear all tokens of a given user id.
     * @param {String} userId user id.
     */
    delete(userId)
    {
        throw new Error("Not Implemented!");
    }
}
  
 
 // export the auth interface.
 module.exports = IAuth;