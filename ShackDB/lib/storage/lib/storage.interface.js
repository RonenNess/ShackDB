/**
 * IStorage interface: manage a single storage instance.
 * |-- copyright and license --|
 * @package    ShackDB
 * @file       storage.interface.js
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
 * Interface for a storage unit.
 */
class IStorage
{
    /**
     * Create the storage instance.
     * @param {String} id storage unique id.
     * @param {String} root storage root path or url.
     * @param {IStoragesManager} manager parent storage manager.
     * @param {IStorageDrivers} drivers storage drivers to use for this instance.
     * @param {IStorageDrivers} metadataDrivers storage drivers to use for this instance metadata. Can be null to use the same as 'drivers'.
     * @param {StoragePolicies} policies dictionary with storage policies.
     * @param {ICache} cache optional cache manager.
     */
    constructor(id, root, manager, drivers, metadataDrivers, policies, cache)
    {
    }

    /**
     * Get how many keys are cached, if this storage has caching layer.
     * @returns {Number} cached keys count.
     */
    get cachedKeys()
    {
        throw new Error("Not Implemented!"); 
    }

    /**
     * Get this storage's root.
     * @returns {String} storage root.
     */
    get root()
    {
        throw new Error("Not Implemented!"); 
    }

    /**
     * Get this storage's policies.
     * @returns {StoragePolicies} storage policies.
     */
    get policies()
    {
        throw new Error("Not Implemented!"); 
    }

    /**
     * Flush any pending changes.
     * @returns {Promise} promise to resolve after successfully flushing changes.
     */
    flush()
    {
        throw new Error("Not Implemented!"); 
    }
    
    /**
     * Get number of batched changes that needs to be flushed.
     * @returns {Number} number of pending changes.
     */
    get pendingChanges()
    {
        throw new Error("Not Implemented!"); 
    }

    /**
     * Save storage metadata to disk.
     * @returns {Promise} promise to resolve after successfully saving metadata.
     */
    saveMetadata()
    {
        throw new Error("Not Implemented!"); 
    }

    /**
     * Get the parent storage manager class.
     * @returns {IStoragesManager} parent storage manager.
     */
    get manager()
    {
        throw new Error("Not Implemented!"); 
    }

    /**
     * Get this storage's id.
     * @returns {String} storage id.
     */
     get id()
     {
         throw new Error("Not Implemented!"); 
     }

    /**
     * Get this storage's api key.
     * @returns {String} secret key.
     */
    get apiKey()
    {
        throw new Error("Not Implemented!"); 
    }

    /**
     * Get this storage's secret key.
     * @returns {String} secret key.
     */
    get secretKey()
    {
        throw new Error("Not Implemented!"); 
    }

    /**
     * Generate a new sercret key for this storage.
     * @returns {Promise} promise to resolve after successfully generating secret key.
     */
    generateSecretKey()
    {
        throw new Error("Not Implemented!"); 
    }

    /**
     * Get this storage's readonly key.
     * @returns {readonlyKey} secret key.
     */
     get readonlyKey()
     {
         throw new Error("Not Implemented!"); 
     }
 
     /**
      * Generate a new readonly key for this storage.
      * @returns {Promise} promise to resolve after successfully generating readonly key.
      */
     generateReadonlyKey()
     {
         throw new Error("Not Implemented!"); 
     }
     
    /**
     * Get storage total size in bytes, including keys.
     * @param {String} path path to get size of.
     * @returns {Promise.<Number>} promise with returned size. Rejects if path not found.
     */
     getTotalSizeBytes()
     {
         throw new Error("Not Implemented!");
     }

    /**
     * Get data.
     * @param {String} key item key to get.
     * @param {Boolean} retrieveMetadata if true, will return data with metadata, if metadata is present.
     * @returns {Promise.<*>} promise with value to return. rejected if value don't exist.
     */
    get(key, retrieveMetadata)
    {
        throw new Error("Not Implemented!"); 
    }

    /**
     * Set data.
     * @param {String} key item key to set.
     * @param {*} data item data. 
     * @param {*} metadata optional metadata dictionary. May contain keys: {source}.
     * @returns {Promise} promise to resolve when done.
     */
    set(key, data, metadata)
    {
        throw new Error("Not Implemented!");
    }

    /**
     * Delete data.
     * @param {String} key item key to delete. 
     * @returns {Promise} promise to resolve when done. rejected if value to delete didn't exist.
     */
    delete(key)
    {
        throw new Error("Not Implemented!");
    }

    /**
     * Check if a key exists.
     * @param {String} key item key.
     * @returns {Promise.<Boolean>} promise with boolean if exist or not. Promise should always be resolved.
     */
    exist(key)
    {
        throw new Error("Not Implemented!");
    }
    
    /**
     * Delete all storage keys.
     * @returns {Promise} promise to resolve when done.
     */
    purge()
    {
        throw new Error("Not Implemented!");
    }
     
    /**
     * Get list of all storage keys.
     * @returns {Promise.<Array<String>>} promise with list of keys. Promise should always be resolved.
     */
    list()
    {
        throw new Error("Not Implemented!");
    }
}


// export the storage interface.
module.exports = IStorage;