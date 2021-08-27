/**
 * Filesystem drivers implementation.
 * |-- copyright and license --|
 * @package    ShackDB
 * @file       drivers_filesystem.js
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
const fs = require('fs');
const path = require('path');
const logger = require('../logger');
const fsPromises = fs.promises;
const IStorageDrivers = require("./drivers.interface");


/**
 * Implement storage drivers using filesystem.
 */
class FilesystemDrivers extends IStorageDrivers
{
    constructor(config)
    {
        super(config);
    }

    get persistent()
    {
        return true;
    }

    flush()
    {  
        return new Promise(async (resolve, reject) => {
            resolve(true);
        });
    }
    
    get pendingChanges()
    {
        return 0;
    }

    get(path)
    {
        if (!path) { throw new Error("Missing path param!"); }
        return new Promise(async (resolve, reject) => {
            try {
                let data = await fsPromises.readFile(path, 'utf8');
                if (data) {
                    try {
                        resolve(data);
                        return;
                    }
                    catch (e) {
                        reject("Invalid or corrupted data file!");
                        return;
                    }
                }
                else {
                    resolve({});
                    return;
                }
            }
            catch (e) {
                reject(e);
            }
        });
    }

    getSync(path)
    {
        if (!path) { throw new Error("Missing path param!"); }
        return fs.readFileSync(path, 'utf8');
    }

    set(path, data)
    {
        if (!path) { throw new Error("Missing path param!"); }
        if (data === undefined) { throw new Error("Missing data param!"); }

        return new Promise(async (resolve, reject) => {
            try {
                await fsPromises.writeFile(path, String(data));
                resolve(true);
            }
            catch (e) {
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
                let isDir = fs.lstatSync(path).isDirectory();
                if (isDir) {
                    await fsPromises.rmdir(path, {recursive: true});
                }
                else {
                    await fsPromises.unlink(path);
                }
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
                await fsPromises.access(path, fs.constants.F_OK);
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
        return new Promise(async (resolve, reject) => {
            try {
                fs.rmdirSync(path, { recursive: true });
                fs.mkdirSync(path, { recursive: true });
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
        if (!fs.existsSync(path)) {
            logger.debug("Create folder for filesystem drivers: " + path);
            fs.mkdirSync(path, { recursive: true });
        }
    }
    
    getTotalSizeBytes(_path)
    {
        if (!_path) { throw new Error("Missing path param!"); }
        return new Promise(async (resolve, reject) => {
            try {
                let keys = await this.list(_path);
                let retSize = 0;
                for (let i = 0; i < keys.length; ++i) {
                    let filename = keys[i];
                    retSize += fs.statSync(path.join(_path, filename)).size;
                    retSize += filename.length;
                }
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

    list(path)
    {
        if (!path) { throw new Error("Missing path param!"); }
        return new Promise(async (resolve, reject) => {
            try {
                let files = await fsPromises.readdir(path);
                resolve(files);
            }
            catch (e) {
                reject("Unknown error listing files: " + e);
            }
        });
    }
}
 
// drivers description
FilesystemDrivers.description = "Persistent storage type that keep data as files.";

// export the filesystem drivers.
module.exports = FilesystemDrivers;
