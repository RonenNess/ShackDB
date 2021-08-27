/**
 * Convert API key to storage instance.
 * |-- copyright and license --|
 * @package    ShackDB
 * @file       apikey_to_storage.js
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
 * Since 2021.
 */
const logger = require('./logger');

/**
 * A dictionary-like object to convert API key to storage.
 */
class ApiKeyToStorage
{
    /**
     * Create the api key to storage converter.
     */
    constructor()
    {
        this._storages = {};
    }

    /**
     * Register a storage instance.
     * @param {IStorage} storage storage instance.
     */
    add(storage)
    {
        let overriden = this._storages[storage.apiKey];
        if (overriden && overriden != storage && overriden.id !== storage.id) {
            throw new Error("API Key conflict!");
        }
        logger.debug(`Register storage API key: ${storage.apiKey} (root: ${storage.root}).`);
        this._storages[storage.apiKey] = storage;
    }

    /**
     * Remove a storage instance.
     * @param {IStorage} storage storage instance.
     */
    remove(storage)
    {
        logger.debug(`Remove storage API key: ${storage.apiKey} (root: ${storage.root}).`);
        delete this._storages[storage.apiKey];
    }

    /**
     * Get storage by api key.
     * @param {String} apiKey api key to get storage to.
     * @returns Storage instance, or undefined if not registered.
     */
    get(apiKey)
    {
        return this._storages[apiKey];
    }

    /**
     * Remove all storages.
     */
    purge()
    {
        logger.debug("Remove all registered storages.");
        this._storages = {};
    }
}


// export the api-to-storage manager
module.exports = new ApiKeyToStorage();