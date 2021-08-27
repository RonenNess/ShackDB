/**
 * IStorageDrivers interface: implement the data access layer.
 * |-- copyright and license --|
 * @package    ShackDB
 * @file       drivers.interface.js
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
 * Interface for storage drivers layer that implement the writing / reading data itself.
 */
class IStorageDrivers
{
    /**
     * Create the storage drivers.
     * @param {*} config dictionary with driver's config, as given from app config.
     */
    constructor(config)
    {
    }

    /**
     * Get if this storage type is persistent or not.
     */
    get persistent()
    {
        throw new Error("Not Implemented!"); 
    }

    /**
     * Get how many cached changes we have waiting to be flushed.
     */
    get pendingChanges()
    {
        throw new Error("Not Implemented!");
    }

    /**
     * Flush cached data, if such exist.
     */
    flush()
    {
        throw new Error("Not Implemented!");
    }

    /**
     * Get data from path, async.
     * @param {String} path item path to get.
     * @returns {Promise.<String>} promise with value to return. rejected if value don't exist.
     */
    get(path)
    {
        throw new Error("Not Implemented!"); 
    }

    /**
     * Get data from path, sync.
     * @param {String} path item path to get.
     */
    getSync(path)
    {
        throw new Error("Not Implemented!"); 
    }
    
    /**
     * Set data.
     * @param {String} path item path to set.
     * @param {String} data item data. Must be JSON serializable.
     * @returns {Promise} promise to resolve when done.
     */
    set(path, data)
    {
        throw new Error("Not Implemented!");
    }

    /**
     * Set data, without using any batching or chaes if such exists.
     * This method must write data immediately and resolve when its persistent.
     * @param {String} path item path to set.
     * @param {String} data item data. Must be JSON serializable.
     * @returns {Promise} promise to resolve when done.
     */
    setImmediate(path, data)
    {
        throw new Error("Not Implemented!");
    }

    /**
     * Delete data.
     * @param {String} path item path to delete. 
     * @returns {Promise} promise to resolve when done. rejected if key to delete doesn't exist.
     */
    delete(path)
    {
        throw new Error("Not Implemented!");
    }

    /**
     * Check if a path exists.
     * @param {String} path item path to check.
     * @returns {Promise.<Boolean>} promise with boolean if exist or not. Promise should always be resolved.
     */
    exist(path)
    {
        throw new Error("Not Implemented!");
    }
    
    /**
     * Delete all stored values under given path.
     * @param {String} path path to delete.
     * @returns {Promise} promise to resolve when done.
     */
    purge(path)
    {
        throw new Error("Not Implemented!");
    }
        
    /**
     * Init table on given root, async.
     * @param {String} path root path to init on.
     * @returns {Promise} promise to resolve when done.
     */
    init(path)
    {
        throw new Error("Not Implemented!");
    }

    /**
     * Init table on given root, sync.
     * @param {String} path root path to init on.
     */
    initSync(path)
    {
        throw new Error("Not Implemented!");
    }

    /**
     * Get list of all children under given path.
     * @param {String} path path to get keys from.
     * @returns {Promise.<Array<String>>} promise with list of keys. Promise should always be resolved.
     */
    list(path)
    {
        throw new Error("Not Implemented!");
    }

    /**
     * Get total size in bytes, including keys.
     * @param {String} path path to get size of.
     * @returns {Promise.<Number>} promise with returned size. Rejects if path not found.
     */
    getTotalSizeBytes(path)
    {
        throw new Error("Not Implemented!");
    }
}

// drivers description
IStorageDrivers.description = "Missing description.";

// export the storage drivers interface.
module.exports = IStorageDrivers;