/**
 * ICache interface: an interface for a caching solution we can attach to storages.
 * |-- copyright and license --|
 * @package    ShackDB
 * @file       cache.interface.js
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
 * Interface for storage caching.
 */
class ICache
{
    /**
     * Create the storage cache.
     * @param {*} config dictionary with cache config, as given from app config.
     */
    constructor(config)
    {
    }

    /**
     * Return how many keys are in cache.
     * @returns {Number} keys count.
     */
    get keysCount()
    {
        throw new Error("Not Implemented!");
    }

    /**
     * Clear the cache.
     */
    clear()
    {
        throw new Error("Not Implemented!");
    }

    /**
     * Get value from cache.
     * @param {String} key key to get.
     * @returns {*} cached value, or undefined.
     */
    get(key)
    {
        throw new Error("Not Implemented!");
    }

    /**
     * Set value to cache.
     * @param {String} key key to set.
     * @param {*} value value to set.
     */
    set(key, value)
    {
        throw new Error("Not Implemented!");
    }

    /**
     * Remove value from cacne.
     * @param {String} key key to remove.
     */
    delete(key)
    {
        throw new Error("Not Implemented!");
    }
}

// export the interface.
module.exports = ICache;