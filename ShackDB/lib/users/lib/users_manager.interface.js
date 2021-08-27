/**
 * IUsersManager interface: manage all the users instances.
 * Its main functionality is to create and retrieve user objects.
 * |-- copyright and license --|
 * @package    ShackDB
 * @file       users_manager.interface.js
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


/**
 * Interface for the storages manager class - manage all user instances.
 */
class IUsersManager
{
    /**
     * Create the users manager.
     */
    constructor()
    {
    }

    /**
     * Get user by id.
     * @param {String} id user id to get.
     * @returns {Promise.<IUser>} promise with user instance, or reject if not found.
     */
    get(id)
    {
        throw new Error("Not Implemented!"); 
    }

    /**
     * Get a list with all user instances.
     * @returns {Promise.<Array<IUser>>} promise with user instances.
     */
    getAllUsers()
    {
        throw new Error("Not Implemented!"); 
    }

    /**
     * Delete a user.
     * @param {String} id user id to delete. 
     * @returns {Promise} resolved if deleted successfully, rejected if failed to delete or not found.
     */
    delete(id)
    {
        throw new Error("Not Implemented!");
    }

    /**
     * Create a new user.
     * @param {String} id new user id. 
     * @param {*} data new user data dictionary. Options: {password,email,superuser}.
     * @returns {Promise.<IUser>} promise with user instance. Reject if already exist.
     */
    create(id, data)
    {
        throw new Error("Not Implemented!");
    }

    /**
     * Update existing user data.
     * @param {String} id user id. 
     * @param {*} data user data dictionary to update. See create() docs for possible keys.
     * @returns {Promise} promise to resolve on success.
     */
    update(id, data)
    {
        throw new Error("Not Implemented!");
    }

    /**
     * Get or create a new user, and update its data.
     * @param {String} id user id.
     * @param {*} data new user data to update. See create() docs for possible keys.
     * @returns {Promise.<[IUser,isNew]>} promise with user instance and if its a new instance.
     */
    updateOrCreate(id, data)
    {
        throw new Error("Not Implemented!");
    }

    /**
     * Get or create new user.
     * @param {String} id user id.
     * @param {*} data new user data dictionary, if need to create new. See create() docs for possible keys.
     * @returns {Promise.<[IUser,isNew]>} promise with user instance and if its a new instance.
     */
    getOrCreate(id, data)
    {
        throw new Error("Not Implemented!");
    }

    /**
     * Check if a user exists.
     * @param {String} id user id.
     * @returns {Promise.<Boolean>} promise with boolean if exist or not. Promise should always be resolved.
     */
    exist(id)
    {
        throw new Error("Not Implemented!");
    }

    /**
     * Get list of all user ids.
     * @returns {Promise.<Array<String>>} promise with list of user ids. Promise should always be resolved.
     */
    list()
    {
        throw new Error("Not Implemented!");
    }

    /**
     * Delete all users.
     * @returns {Promise} promise to resolve when done.
     */
    purge()
    {
        throw new Error("Not Implemented!");
    }

    /**
     * Clear cache of loaded users.
     */
    clearCache()
    {
        throw new Error("Not Implemented!");
    }
}


// export the users manager interface.
module.exports = IUsersManager;