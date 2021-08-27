/**
 * Cached filesystem drivers implementation.
 * |-- copyright and license --|
 * @package    ShackDB
 * @file       drivers_cached_filesystem.js
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
const path = require('path');
const IStorageDrivers = require("./drivers.interface");
const FilesystemDrivers = require('./drivers_filesystem');


// create filesystems drivers instance to use internally
const _filesystemDrivers = new FilesystemDrivers({});


/**
 * Implement storage drivers using filesystem with cache.
 * These drivers will batch changes and are able to respond a lot faster to users, but at the risk of data lost in case of critical errors.
 */
class CachedFilesystemDrivers extends IStorageDrivers
{
    constructor(config)
    {
        super(config);

        // batched changes we need to write
        this._batchedChanges = {};

        // how long to wait before writing down changes
        this._timeToFlushSeconds = (config || {}).timeToFlushSeconds || 10;
        this._nextFlushTimer = null;
    }
      
    // flush all cached changes to disk
    async _flushCachedValues()
    {
        // get cached values and reset cached dictionary
        let values = this._batchedChanges;
        this._batchedChanges = {};

        // flush changes
        for (let path in values) {
            let value = values[path];
            if (value === null) {
                await _filesystemDrivers.delete(path);
            }
            else {
                await _filesystemDrivers.set(path, value);
            }
        }
    }

    // set timer for next flush, if needed.
    _setFlushTimer()
    {
        if (!this._nextFlushTimer) {
            this._nextFlushTimer = setTimeout(() => {
                this._flushCachedValues();
                this._nextFlushTimer = null;
            }, this._timeToFlushSeconds * 1000);
        }
    }

    get persistent()
    {
        return true;
    }
    
    get pendingChanges()
    {
        return Object.keys(this._batchedChanges).length;
    }

    flush()
    {  
        return new Promise(async (resolve, reject) => {
            
            try {

                // remove timer for next flush
                if (this._nextFlushTimer) {
                    clearTimeout(this._nextFlushTimer);
                    this._nextFlushTimer = null;
                }
            
                // flush changes
                await this._flushCachedValues();
                resolve(true);

            }
            catch (e) {
                reject(e);
            }
        });
    }

    get(path)
    {
        if (!path) { throw new Error("Missing path param!"); }
        return new Promise(async (resolve, reject) => {
            try {
                
                // if data is cached, return it
                let cached = this._batchedChanges[path];
                if (cached !== undefined) {
                    if (cached === null) {
                        reject("Value not found!");
                    }
                    else {
                        resolve(cached);
                    }
                    return;
                }
                
                // get from filesystem
                let ret = await _filesystemDrivers.get(path);
                resolve(ret);
            }
            catch (e) {
                reject(e);
            }
        });
    }

    getSync(path)
    {
        if (!path) { throw new Error("Missing path param!"); }

        let cached = this._batchedChanges[path];
        if (cached !== undefined) {
            if (cached === null) {
                throw new Error("Value not found!");
            }
            else {
                return cached;
            }
        }

        return _filesystemDrivers.getSync(path);
    }

    set(path, data)
    {
        if (!path) { throw new Error("Missing path param!"); }
        if (data === undefined) { throw new Error("Missing data param!"); }

        return new Promise(async (resolve, reject) => {
            try {
                this._batchedChanges[path] = data;
                this._setFlushTimer();
                resolve(true);
            }
            catch (e) {
                reject(e);
            }
        });
    }

    setImmediate(path, data)
    {
        return _filesystemDrivers.set(path, data);
    }

    delete(path)
    {
        if (!path) { throw new Error("Missing path param!"); }
        return new Promise(async (resolve, reject) => {
            try {
                if (!(await this.exist(path))) {
                    reject("Key not found!");
                    return;
                }
                this._batchedChanges[path] = null;
                this._setFlushTimer();
                resolve(true);
            }
            catch (e) {
                reject(e);
            }
        });
    }

    exist(path)
    {
        if (!path) { throw new Error("Missing path param!"); }
        return new Promise(async (resolve, reject) => {
            try {
                let cached = this._batchedChanges[path];
                if (cached !== undefined) {
                    resolve(cached !== null);
                    return;
                }
                let exist = await _filesystemDrivers.exist(path);
                resolve(exist);
            }
            catch (e) {
                resolve(false);
            }
        });
    }
    
    purge(path)
    {
        if (!path) { throw new Error("Missing path param!"); }
        return new Promise(async (resolve, reject) => {
            try {
                await _filesystemDrivers.purge(path);
                this._batchedChanges = {};
                resolve(true);
            }
            catch (e) {
                reject(e);
            }
        });
    }
    
    initSync(path)
    {
        if (!path) { throw new Error("Missing path param!"); }
        _filesystemDrivers.initSync(path);
    }
    
    getTotalSizeBytes(_path)
    {
        if (!_path) { throw new Error("Missing path param!"); }
        return new Promise(async (resolve, reject) => {
            try {
                let retSize = await _filesystemDrivers.getTotalSizeBytes(_path);
                resolve(retSize);
            }
            catch(e) {
                reject("Path not found.");
            }
        });
    }

    init(path)
    {
        if (!path) { throw new Error("Missing path param!"); }
        return new Promise(async (resolve, reject) => {
            try {
                this.initSync(path);
                resolve(true);
            }
            catch (e) {
                reject(e);
            }
        });
    }

    list(_path)
    {
        if (!_path) { throw new Error("Missing path param!"); }
        return new Promise(async (resolve, reject) => {
            try {
                let keys = new Set(await _filesystemDrivers.list(_path));
                for (let cachedPath in this._batchedChanges) {

                    let cachedValue = this._batchedChanges[cachedPath];
                    let key = path.basename(cachedPath);

                    if (cachedValue !== null) {
                        keys.add(key);
                    }
                    else {
                        keys.delete(key);
                    }
                }
                resolve(Array.from(keys));
            }
            catch (e) {
                reject("Unknown error listing files: " + e);
            }
        });
    }
}

 // drivers description
 CachedFilesystemDrivers.description = "Persistent storage type that keep data as files, but batch changes before flushing them. Its faster than the regular files storage, but you may lose data if server crashes before comitting changes.";

// export the cached filesystem drivers.
module.exports = CachedFilesystemDrivers;
