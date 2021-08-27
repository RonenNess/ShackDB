/**
 * IStorage manage a single storage instance.
 * |-- copyright and license --|
 * @package    ShackDB
 * @file       storage.js
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
const IStorage = require('./storage.interface');
const path = require('path');
const appConfig = require('../../config')
const validFilename = require('./validate_storage_id');
const uuid = require('uuid');


// for how long to cache keys and size
const cachingTime = 30 * 1000;


// get current timestamp
function timestamp()
{
    return (new Date()).getTime();
}


/**
 * Implements a storage class.
 */
class Storage extends IStorage
{
    constructor(id, root, manager, drivers, metadataDrivers, policies, cache)
    {
        super(id, root, manager, drivers, metadataDrivers, policies, cache);

        if (!drivers) {
            throw new Error("Missing storage drivers!");
        }
        if (!root) {
            throw new Error("Missing storage root!");
        }
        if (!id) {
            throw new Error("Missing storage id!");
        }

        // if true, will store values metadata
        // never change this to false outside of tests
        this.storeValuesMd = appConfig.storage.keepMetadata;

        logger.info(`Create storage instance with id '${id}'.`);
        this._id = id;
        this._root = root;
        this._dataPath = path.join(this._root, 'data');
        this._metadataPath = path.join(this._root, 'metadata.json');
        this._policies = policies;

        // store manager
        this._manager = manager;

        // create data folder
        this._drivers = drivers;
        this._drivers.initSync(this._dataPath);

        // set caching solution
        this._cache = cache;

        // store drivers for metadata
        this._metadataDrivers = metadataDrivers || drivers;
        if (metadataDrivers !== drivers) {
            this._metadataDrivers.initSync(this._dataPath);
        }

        // load existing metadata
        try {
            this._metadata = JSON.parse(this._metadataDrivers.getSync(this._metadataPath));
        }
        // set new metadata if a new storage
        catch {
            this._metadata = {
                version: 1,
                apiKey: uuid.v4(),
                secret: uuid.v4(),
                readonlyKey: uuid.v4()
            };
        }
    }

    get manager()
    {
        return this._manager;
    }

    get policies()
    {
        return this._policies;
    }

    get pendingChanges()
    {
        return this._drivers.pendingChanges;
    }

    get root()
    {
        return this._root;
    }

    get id()
    {
        return this._id;
    }

    get apiKey()
    {
        return this._metadata.apiKey;
    }

    get secretKey()
    {
        return this._metadata.secret;
    }

    get readonlyKey()
    {
        return this._metadata.readonlyKey;
    }

    getTotalSizeBytes()
    {
        return new Promise(async (resolve, reject) => {
            try {
                let now = timestamp();
                if (!this._cachedSize || (now - this._cachedSizeTime) > cachingTime) {
                    this._cachedSize = await this._drivers.getTotalSizeBytes(this._dataPath);
                    this._cachedSizeTime = now;
                }
                resolve(this._cachedSize);
            }
            catch (e) {
                reject(e);
            }
        });
    }

    _setMetadata(newMetadata)
    {
        return new Promise(async (resolve, reject) => {
            let tempMd = JSON.parse(JSON.stringify(newMetadata));
            tempMd.version = (tempMd.version || 1) + 1;
            try {
                await this._metadataDrivers.setImmediate(this._metadataPath, JSON.stringify(tempMd));
                this._metadata = tempMd;
                resolve(true);
            }
            catch (e) {
                reject(e);
            }
        });
    }

    saveMetadata()
    {
        return this._metadataDrivers.setImmediate(this._metadataPath, JSON.stringify(this._metadata));
    }

    flush()
    {
        return this._drivers.flush();
    }

    generateSecretKey()
    {
        // generate key and secret
        let secret = uuid.v4();
        this._metadata.secret = secret;
        return this._setMetadata(this._metadata);
    }

    generateReadonlyKey()
    {
        // generate key and secret
        let readonlyKey = uuid.v4();
        this._metadata.readonlyKey = readonlyKey;
        return this._setMetadata(this._metadata);
    }

    _idToPath(key)
    {
        return path.join(this._dataPath, key);
    }

    // throw exception for illegal keys
    _validateKey(key)
    {
        if (!key) {
            throw new Error("Missing key parameter!");
        }
        if (!validFilename(key)) {
            throw new Error("Invalid key!");
        }
    }

    get cachedKeys()
    {
        return this._cache ? this._cache.keysCount : 0;
    }

    get(key, retrieveMetadata)
    {
        this._validateKey(key);
        let filename = this._idToPath(key);
        return new Promise(async (resolve, reject) => {
            try {
                
                // try to get from cache
                if (this._cache) {
                    let cachedData = this._cache.get(key);
                    if (cachedData !== undefined) {
                        if (!retrieveMetadata) {
                            cachedData = cachedData._d;
                        }
                        resolve(cachedData);
                        return;
                    }
                }

                // get data from file (with metadata)
                let data = await this._drivers.get(filename);
                data = JSON.parse(data);
                
                // update cache
                if (this._cache) {
                    this._cache.set(key, data);
                }

                // check if should remove metadata
                if (!retrieveMetadata) {
                    data = data._d;
                }

                // return result
                resolve(data);
            }
            catch (e) {
                reject(e);
            }
        });
    }

    set(key, data, metadata)
    {
        this._validateKey(key);
        if (data === undefined) { throw new Error("Missing data!"); }

        // build data with or without metadata
        metadata = metadata || {};
        if (this.storeValuesMd) {
            data = {
                _d: data, 
                modified: timestamp(), 
                source: metadata.source
            };
        }
        else {
            data = {_d: data};
        }
        let dataAsString = JSON.stringify(data);

        return new Promise(async (resolve, reject) => {
            try {

                // do policies validations: max key len
                if (this._policies.maxKeyLength && key.length > this._policies.maxKeyLength) {
                    reject("Policy validation error: key length is too long.");
                    return;
                }

                // do policies validations: max keys count
                if (this._policies.maxKeys) {
                    let allKeys = await this.list();
                    if (allKeys.length >= this._policies.maxKeys) {
                        reject("Policy validation error: too many keys are set.");
                        return;
                    }
                }

                // do policies validations: max value size
                if (this._policies.maxValueSizeBytes && dataAsString.length > this._policies.maxValueSizeBytes) {
                    reject("Policy validation error: value size is too big.");
                    return;
                }

                // do policies validations: max size
                if (this._policies.maxSizeBytes) {

                    // validate max size in bytes
                    let currentSize = await this.getTotalSizeBytes();
                    if (currentSize + key.length + dataAsString.length > this._policies.maxSizeBytes) {
                        reject("Policy validation error: exceed total size limit.");
                        return;
                    }
                }

                // update cached size
                if (this._cachedSize) {
                    
                    // if exist need to properly delete it first to reduce size
                    if (await this.exist(key)) {
                        await this.delete(key);
                    }

                    // add size
                    this._cachedSize += key.length + dataAsString.length;
                }

                // update cache
                if (this._cache) {
                    this._cache.set(key, data);
                }

                // get path and set value
                let path = this._idToPath(key);
                await this._drivers.set(path, dataAsString);

                // update cached keys
                if (this._cachedKeys) {
                    this._cachedKeys.add(key);
                }

                // done!
                resolve(true);
            }
            catch (e) {
                reject(e);
            }
        });
    }

    delete(key)
    {
        this._validateKey(key);
        return new Promise(async (resolve, reject) => {
            try {

                // get filename
                let filename = this._idToPath(key);

                // update cached size counter
                if (this._cachedSize) {
                    let data = await this._drivers.get(filename);
                    this._cachedSize -= key.length + data.length;
                }

                // do the deletion
                await this._drivers.delete(filename);

                // update cache
                if (this._cache) {
                    this._cache.delete(key);
                }

                // remove from keys cache
                if (this._cachedKeys) {
                    this._cachedKeys.delete(key); 
                }

                resolve(true);
            }
            catch (e) {
                reject(e);
            }
        });
    }

    exist(key)
    {
        this._validateKey(key);
        let filename = this._idToPath(key);
        return new Promise(async (resolve, reject) => {

            // check cache
            if (this._cache) {
                if (this._cache.get(key) !== undefined) {
                    resolve(true);
                    return;
                }
            }

            let exist = await this._drivers.exist(filename);
            resolve(exist);
        });
    }
    
    list()
    {
        return new Promise(async (resolve, reject) => {
            try {

                // do we have cache? use it
                let now = timestamp();
                if (this._cachedKeys && (now - this._cachedKeysTime) < cachingTime) {
                    resolve(Array.from(this._cachedKeys));
                    return;
                }

                // get list and store in cache
                this._cachedKeys = new Set(await this._drivers.list(this._dataPath));
                this._cachedKeysTime = now;
                resolve(Array.from(this._cachedKeys));
            }
            catch (e) {
                reject(e);
            }
        });
    }

    purge()
    {
        logger.debug(`Purge entire storage '${this._id}'.`);
        return new Promise(async (resolve, reject) => {
            try {
                await this._drivers.purge(this._dataPath);
                
                let now = timestamp();

                this._cachedKeys = new Set();
                this._cachedKeysTime = now;

                this._cachedSize = 0;
                this._cachedSizeTime = now;

                // update cache
                if (this._cache) {
                    this._cache.clear();
                }
                
                resolve(true);
            }
            catch (e) {
                reject(e);
            }
        });
    }
}


// export the storage class.
module.exports = Storage;