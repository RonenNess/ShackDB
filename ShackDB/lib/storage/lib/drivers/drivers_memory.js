/**
 * Ram drivers implementation.
 * |-- copyright and license --|
 * @package    ShackDB
 * @file       drivers_memory.js
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
const IStorageDrivers = require("./drivers.interface");
const path = require('path');

// the actual data
var globalDataDict = {};


/**
 * Implement storage drivers using RAM.
 */
class MemoryDrivers extends IStorageDrivers
{
    constructor(config)
    {
        super(config);
    }

    /**
     * Break path into segments.
     * @param {String} _path path to break.
     * @returns path segments as list.
     */
    _break(_path)
    {
        _path = _path.replace(/\\/g, '/');
        return _path.split('/');
    }

    /**
     * Get the value key (without folder parts) from a given path.
     * @param {String} _path path to get key from.
     */
    _getValueKey(_path)
    {
        let parts = this._break(_path);
        return parts[parts.length-1];
    }

    /**
     * Get parent dictionary or value from the global values dictionary.
     * @param {*} _path path to fetch data for.
     * @param {*} createMissing if true, will create missing path segments. else, throw exception.
     * @param {*} includeLastSegment if true, will include last path segment. if not, will return the dict containing it.
     * @returns data or dictionary from the global dict.
     */
    _getFromGlobalDataDict(_path, createMissing, includeLastSegment)
    {
        // break path into segments
        let parts = this._break(_path);

        // traverse the data dictionary
        let curr = globalDataDict;
        let len = includeLastSegment ? parts.length : parts.length - 1;
        for (let i = 0; i < len; ++i) {

            // get next segment in path
            if (curr[parts[i]]) {
                curr = curr[parts[i]];
            }
            // if not found..
            else {
                if (createMissing) {
                    curr = curr[parts[i]] = {};
                }
                else {
                    throw new Error("Path not found!");
                }
            }
        }

        // return dict
        return curr;
    }

    get persistent()
    {
        return false;
    }
    
    get pendingChanges()
    {
        return 0;
    }

    flush()
    {
        return new Promise(async (resolve, reject) => {
            resolve(true);
        });
    }

    get(path)
    {
        if (!path) { throw new Error("Missing path param!"); }

        return new Promise(async (resolve, reject) => {
            try {
                let ret = this.getSync(path);
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
        let data = this._getFromGlobalDataDict(path, false, true);
        return data;
    }

    set(path, data)
    {
        if (!path) { throw new Error("Missing path param!"); }
        if (data === undefined) { throw new Error("Missing data param!"); }

        return new Promise(async (resolve, reject) => {
            
            try {
                let key = this._getValueKey(path);
                let parent = this._getFromGlobalDataDict(path, true, false);
                parent[key] = String(data);
                resolve(true);
            }
            catch(e) {
                reject(e);
            }
        });
    }
    
    setImmediate(path, data)
    {
        return this.set(path, data);
    }

    delete(path)
    {
        if (!path) { throw new Error("Missing path param!"); }

        return new Promise(async (resolve, reject) => {

            try {
                let key = this._getValueKey(path);
                let parent = this._getFromGlobalDataDict(path, false, false);
                if (parent[key] === undefined) {
                    reject("Not found!");
                    return;
                }
                delete parent[key];
                resolve(true);
            }
            catch(e) {
                reject(e);
            }
        });
    }

    exist(path)
    {
        if (!path) { throw new Error("Missing path param!"); }

        return new Promise((resolve, reject) => {
            try {
                this._getFromGlobalDataDict(path, false, true);
                resolve(true);
            }
            catch (e) {
                resolve(false);
            }
        });
    }
    
    purge(path)
    {
        if (!path) { throw new Error("Missing path param!"); }
        return new Promise((resolve, reject) => {
            try {
                let key = this._getValueKey(path);
                let parent = this._getFromGlobalDataDict(path, true, false);
                parent[key] = {};
                resolve(true);
            }
            catch(e) {
                reject(e);
            }
        });
    }
    
    initSync(path)
    {
        if (!path) { throw new Error("Missing path param!"); }
        let key = this._getValueKey(path);
        let parent = this._getFromGlobalDataDict(path, true, false);
        if (!parent[key]) { parent[key] = {}; }
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

    list(path)
    {
        if (!path) { throw new Error("Missing path param!"); }
        return new Promise(async (resolve, reject) => {
            try {
                let parent = this._getFromGlobalDataDict(path, false, true);
                resolve(Object.keys(parent));
            }
            catch(e) {
                resolve([]);
            }
        });
    }

    getTotalSizeBytes(path)
    {
        if (!path) { throw new Error("Missing path param!"); }
        return new Promise(async (resolve, reject) => {
            try {
                let parent = this._getFromGlobalDataDict(path, false, true);
                let retSize = 0;
                for (let key in parent) {
                    retSize += parent[key].length;
                    retSize += key.length;
                }
                resolve(retSize);
            }
            catch(e) {
                reject("Path not found.");
            }
        });
    }
}

// drivers description
MemoryDrivers.description = "Storage type that keep data in memory only. All keys and values are lost every time the server goes down.";

// export the ram drivers.
module.exports = MemoryDrivers;
