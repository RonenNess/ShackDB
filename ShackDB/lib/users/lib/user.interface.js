/**
 * IUser interface: define the interface for a user instance.
 * |-- copyright and license --|
 * @package    ShackDB
 * @file       user.interface.js
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
 * Interface for the user class.
 */
class IUser
{
    /**
     * Create the user instance.
     * @param {String} id user id.
     */
    constructor(id)
    {
    }

    /**
     * Return a unique version identifier of this user.
     * Should change whenever an action is done that may change this object internally, or change the way its represented in persistent storage.
     * Used to sync with users manager cache.
     */
    get version()
    {
        throw new Error("Not Implemented!");
    }

    /**
     * Return user's data, without password and without creation time (ie only the provided fields).
     * Should not allow to change the user internals, ie returns a copy.
     */
    get data()
    {
        throw new Error("Not Implemented!");
    }

    /**
     * Return if the user is enabled or not.
     */
     get enabled()
     {
         throw new Error("Not Implemented!");
     }

    /**
     * Update and save user's new data.
     * Will only update keys that exist in data dictionary. See constructor for options.
     * @param {*} data user data to update.
     *                  Possible keys: {password,email,superuser}
     * @param {Boolean} save if true, will save data to persistent storage.
     * @returns {Promise} promise to resolve on success.
     */
    update(data, save)
    {
        throw new Error("Not Implemented!");
    }

    /**
     * Save user data to persistent storage.
     * @returns {Promise} promise to resolve on success.
     */
    save()
    {
        throw new Error("Not Implemented!");
    }

    /**
     * Load user data from persistent storage.
     * @returns {Promise} promise to resolve on success.
     */
    load()
    {
        throw new Error("Not Implemented!");
    }

    /**
     * Return if this user exists in persistent storage.
     * @returns {Promise.<Boolean>} promise to resolve with a boolean to indicate if user exists or not.
     */
    exist()
    {
        throw new Error("Not Implemented!");
    }

    /**
     * Delete user from persistent storage.
     * @returns {Promise} promise to resolve on success.
     */
    delete()
    {
        throw new Error("Not Implemented!");
    }

    /**
     * Get the storages manager designated for this user.
     * @param {String} type storage drivers type (as defined in app config).
     * @returns {IStoragesManager} storages manager instance for given type.
     */
    storagesManager(type)
    {
        throw new Error("Not Implemented!");
    }

    /**
     * Check if this user is a superuser.
     * @returns {Boolean} is superuser.
     */
    get superuser()
    {
        throw new Error("Not Implemented!");
    }

    /**
     * Get timestamp this user was created at.
     * @returns {Number} created timestamp in ms.
     */
    get createdAt()
    {
        throw new Error("Not Implemented!");
    }

    /**
     * Get timestamp this user was last updated.
     * @returns {Number} updated timestamp in ms.
     */
    get updatedAt()
    {
        throw new Error("Not Implemented!");
    }

    /**
     * Get createdAt as readable text.
     */
    get createdAtReadable()
    {
        throw new Error("Not Implemented!");
    }

    /**
     * Get updatedAt as readable text.
     */
    get updatedAtReadable()
    {
        throw new Error("Not Implemented!");
    }

    /**
     * Get createdAt as readable date only text.
     */
    get createdAtDateReadable()
    {
        throw new Error("Not Implemented!");
    }
 
     /**
      * Get updatedAt as readable date only text.
      */
    get updatedAtDateReadable()
    {
        throw new Error("Not Implemented!");
    }

    /**
     * Get user unique id.
     * @returns {String} user's username.
     */
    get id()
    {
        throw new Error("Not Implemented!");
    }

    /**
     * Get user email or null.
     * @returns {String} user's email.
     */
    get email()
    {
        throw new Error("Not Implemented!");
    }

    /**
     * Attempt to authenticate this user with password.
     * @returns {Boolean} true if password match, false if not.
     */
    authenticate(password)
    {
        throw new Error("Not Implemented!");
    }
}
 

// export the user interface.
module.exports = IUser;