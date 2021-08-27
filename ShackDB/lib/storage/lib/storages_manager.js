/**
 * Implement the storages manager interface.
 * |-- copyright and license --|
 * @package    ShackDB
 * @file       storages_manager.js
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
const IStoragesManager = require("./storages_manager.interface");
const Storage = require("./storage");
const validateStorageId = require('./validate_storage_id');
const config = require('../../config');
const path = require('path');
const FilesystemDrivers = require('./drivers/drivers_filesystem');
const ApiKeyToStorage = require('./apikey_to_storage');


/**
 * Manage all storage instances.
 */
class StoragesManager extends IStoragesManager
{
    constructor(root, storageType)
    {
        // store root path 
        super(root, storageType);

        // get policies
        this._policies = config.storageTypeToPolicy[storageType];

        // get drivers
        storageType = storageType || config.defaultStorageType;
        if (!config.storageDriversGenerator[storageType]) {
            throw new Error(`Missing or invalid storage drivers for type ${storageType}`);
        }
        this._drivers = config.storageDriversGenerator[storageType]();
        this._generateStorageDrivers = () => config.storageDriversGenerator[storageType]();

        // get method to generate storage cache
        this._cacheType = config.storageTypeToCacheName[storageType];
        this._storageCacheGenerator = this._cacheType ? config.storageCacheGenerators[this._cacheType] : () => undefined;

        // set root folder
        this._root = path.join(root, storageType);
        this._loadedStorages = {};
        logger.info(`Creating new storage manager class on root='${this.root}'.`);

        // init drivers
        this._drivers.initSync(this.root);

        // if drivers are not persistent, create a special registry of storages
        if (!this._drivers.persistent) {
            this._metadataDrivers = new FilesystemDrivers({});
            this._metadataDrivers.initSync(this.root);
        }
        else {
            this._metadataDrivers = this._drivers;
        }
    }

    get root()
    {
        return this._root; 
    }

    // throw exception for illegal ids
    _validateId(id)
    {
        if (!id) {
            throw new Error("Missing id parameter!");
        }
        if (!validateStorageId(id)) {
            throw new Error("Invalid storage id!");
        }
    }

    // convert storage id to storage path
    _idToPath(id)
    {
        return this.root + '/' + id;
    }

    get(id)
    {
        this._validateId(id);
        return new Promise(async (resolve, reject) => {

            try
            {
                // already in cache? return it
                if (this._loadedStorages[id]) {
                    resolve(this._loadedStorages[id]);
                    return;
                }

                // make sure exists before creating and returning instance
                let exist = await this.exist(id);
                if (exist) {
                    let storagePath = this._idToPath(id);
                    logger.debug(`Load existing storage '${id}' (path='${storagePath}').`);
                    var storage = new Storage(id, storagePath, this, this._generateStorageDrivers(), this._metadataDrivers, this._policies, this._storageCacheGenerator());
                    this._loadedStorages[id] = storage;
                    ApiKeyToStorage.add(storage);
                    resolve(storage);
                    return;
                }
            }
            catch (e) {
                logger.error("Error while getting storage: " + e);
                reject(e);
                return;
            }

            // not exist? reject
            reject("Storage not found.");

        });
    }

    getOrCreate(id)
    {
        if (!id) { 
            throw new Error("Missing id parameter!"); 
        }

        return new Promise(async (resolve, reject) => {
            try {
                if (await this.exist(id)) {
                    resolve([await this.get(id), false]);
                }
                else {
                    resolve([await this.create(id), true]);
                }
            }
            catch (e) {
                reject("Unexpected error! " + e);
            }
        });
    }

    delete(id)
    {
        this._validateId(id);
        return new Promise(async (resolve, reject) => {

            // doesn't exist? skip
            let exist = await this.exist(id);
            if (!exist) {
                logger.warn(`Storage to delete '${id}' not found.`);
                delete this._loadedStorages[id]; // <-- just in case..
                reject();
                return;
            }

            // delete storage folder, and when done - remove from loaded storage
            try {
                let storage = await this.get(id);
                logger.debug(`Deleting storage '${id}'.`);
                await this._drivers.delete(storage.root);
                if (this._metadataDrivers !== this._drivers) {
                    await this._metadataDrivers.delete(storage.root);
                }
                delete this._loadedStorages[id];
                ApiKeyToStorage.remove(storage);
                resolve(true);
            }
            catch (e) {
                logger.error(`Failed to delete storage with error ${e}.`);
                reject(e);
            }
        });
    }

    list()
    {
        return new Promise(async (resolve, reject) => {
            try {
                let keys = await this._metadataDrivers.list(this.root);
                resolve(keys);
            }
            catch (e) {
                reject("Unknown error: " + e);
            }
        });
    }

    create(id)
    {
        // validate id
        this._validateId(id);

        return new Promise(async (resolve, reject) => {
            
            try
            {
                let exist = await this.exist(id);

                // already exist? reject!
                if (exist) {
                    reject("Storage already exist!");
                    return;
                }

                var storagePath = this._idToPath(id);
                logger.info(`Creating new storage with id '${id}' and root folder '${storagePath}'.`);
            }
            catch (e) {
                logger.error("Error while creating storage: " + e);
                reject(e);
                return;
            }

            // create and return storage instance
            try {
                let storage = new Storage(id, storagePath, this, this._generateStorageDrivers(), this._metadataDrivers, this._policies, this._storageCacheGenerator());
                await storage.saveMetadata();
                this._loadedStorages[id] = storage;
                ApiKeyToStorage.add(storage);
                resolve(storage);
            }
            catch (e) {
                reject("Unexpected error! " + e);
            }
        });
    }

    exist(id)
    {
        this._validateId(id);
        let storagePath = this._idToPath(id);
        return new Promise(async (resolve, reject) => {
            let exist = await this._metadataDrivers.exist(storagePath);
            resolve(exist);
        });
    }

    clearCache()
    {
        this._loadedStorages = {};
    }

    purge()
    {
        logger.debug(`Purge all storages from root '${this.root}'.`);
        return new Promise(async (resolve, reject) => {
            try
            {
                await this._drivers.purge(this.root);
                await this._drivers.init(this.root);

                if (this._metadataDrivers !== this._drivers) {
                    await this._metadataDrivers.purge(this.root);
                    await this._metadataDrivers.init(this.root);
                }

                for (let cached in this._loadedStorages) {
                    ApiKeyToStorage.remove(this._loadedStorages[cached]);
                }
                this._loadedStorages = {};
                resolve(true);
            }
            catch (e)
            {
                reject(e);
            }
        });
    }
}


// export the storages manager.
module.exports = StoragesManager;