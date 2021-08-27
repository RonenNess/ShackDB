/**
 * IStoragesManager interface: manage all the storages instances.
 * Its main functionality is to create and retrieve storage objects.
 * |-- copyright and license --|
 * @package    ShackDB
 * @file       storages_manager.interface.js
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
 * Interface for the storages manager class - manage all storage instances.
 */
class IStoragesManager
{
    /**
     * Create the storages manager.
     * @param {String} root storage root path or url.
     * @param {String} storageType storage type to use, as defined in the app.json config file.
     */
    constructor(root, storageType)
    {
    }

    /**
     * Get storages manager root folder.
     */
    get root()
    {
        throw new Error("Not Implemented!"); 
    }

    /**
     * Get storage by id.
     * @param {String} id storage id.
     * @returns {Promise.<IStorage>} promise with storage instance, or reject if not found.
     */
    get(id)
    {
        throw new Error("Not Implemented!"); 
    }

    /**
     * Delete a storage.
     * @param {String} id storage id to delete. 
     * @returns {Promise} resolved if deleted successfully, rejected if failed to delete or not found.
     */
    delete(id)
    {
        throw new Error("Not Implemented!");
    }

    /**
     * Create a new storage.
     * @param {String} id new storage id. 
     * @returns {Promise.<IStorage>} promise with storage instance. Reject if already exist.
     */
    create(id)
    {
        throw new Error("Not Implemented!");
    }

    /**
     * Get or create new storage.
     * @param {String} id storage id.
     * @returns {Promise.<[IStorage,isNew]>} promise with storage instance and if its a new instance.
     */
    getOrCreate(id)
    {
        throw new Error("Not Implemented!");
    }

    /**
     * Clear cached storage instances.
     */
    clearCache()
    {
        throw new Error("Not Implemented!");
    }

    /**
     * Check if a storage exists.
     * @param {String} id storage id.
     * @returns {Promise.<Boolean>} promise with boolean if exist or not. Promise should always be resolved.
     */
    exist(id)
    {
        throw new Error("Not Implemented!");
    }

    /**
     * Get list of all storages ids.
     * @returns {Promise.<Array<String>>} promise with list of storage ids. Promise should always be resolved.
     */
    list()
    {
        throw new Error("Not Implemented!");
    }

    /**
     * Delete all storages.
     * @returns {Promise} promise to resolve when done.
     */
    purge()
    {
        throw new Error("Not Implemented!");
    }
}


// export the storages manager interface.
module.exports = IStoragesManager;