/**
 * Implement the user class.
 * |-- copyright and license --|
 * @package    ShackDB
 * @file       user.js
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
const crypto = require('crypto');
const path = require('path');
const config = require('./../../config');
const { StoragesManager } = require('../../storage');
const logger = require('./logger');
const uuid = require('uuid');
const IUser = require("./user.interface");
const usersStorage = require('./users_storage');


/**
 * Implement the user class.
 */
class User extends IUser
{
    constructor(id, data)
    {
        super(id, data);

        // store id
        if (!id) { throw new Error("Missing id for new user instance!"); }
        this._id = id;

        // store data
        this._data = data ? JSON.parse(JSON.stringify(data)) : {};

        // enable by default
        if (this._data.enabled === undefined) {
            this._data.enabled = true;
        }

        // generate salt
        this._data.salt = uuid.v4();

        // set creation time
        this._data.createdAt = this._data.createdAt || (new Date()).getTime();

        // storage managers
        this._storageManagers = {};

        // user version - to update in the manager after changes
        this._version = 0;
    }
    
    get id()
    {
        return this._id;
    }

    get data()
    {
        return {
            email: this.email,
            superuser: this.superuser,
            username: this.id, 
            createdAt: this.createdAt, 
            updatedAt: this.updatedAt, 
            enabled: this.enabled
        };
    }

    _saltAndHash(password)
    {
        if (!this._data.salt) {
            throw new Error("Missing salt!");
        }
        return crypto.createHash('md5').update(this._data.salt + password).digest('hex');
    }

    get version()
    {
        return this._version;
    }

    update(data, save)
    {
        return new Promise(async (resolve, reject) => {
            try {
                logger.debug(`Update user '${this.id}' details: ${JSON.stringify(data)}. save after: ${save}.`);
                this._data = this._data || {};
                this._data.createdAt = this._data.createdAt || (new Date()).getTime();
                this._data.updatedAt = (new Date()).getTime();
                if (data.enabled !== undefined) { this._data.enabled = data.enabled; }
                if (data.email !== undefined) { this._data.email = data.email; }
                if (data.saltedPassword !== undefined) { this._data.saltedPassword = data.saltedPassword; }
                if (data.password !== undefined) { this._data.saltedPassword = this._saltAndHash(data.password); }
                if (data.superuser !== undefined) { this._data.superuser = Boolean(data.superuser); }
                this._version++;
                if (save) { await this.save(); }
                logger.debug(`User '${this.id}' updated details: ${JSON.stringify(this._data)}. New version: ${this._version}.`);
                resolve(true);
            }
            catch (e) {
                reject(e);
            }
        });
    }

    save()
    {
        return new Promise(async (resolve, reject) => {
            try {
                await usersStorage.set(this._id, this._data);
                await usersStorage.flush();
                resolve(true);
            }
            catch (e) {
                reject(e);
            }
        });
    }

    delete()
    {
        this._version++;
        return new Promise(async (resolve, reject) => {
            try {
                await usersStorage.delete(this._id);
                resolve(true);
            }
            catch (e) {
                reject(e);
            }
        });
    }

    load()
    {
        this._version++;
        return new Promise(async (resolve, reject) => {
            try {
                this._data = await usersStorage.get(this._id);
                resolve(true);
            }
            catch (e) {
                reject(e);
            }
        });
    }

    exist()
    {
        return new Promise(async (resolve, reject) => {
            try {
                let exist = await usersStorage.exist(this._id);
                resolve(exist);
            }
            catch (e) {
                reject(e);
            }
        });
    }

    get createdAtReadable()
    {
        return String(new Date(this.createdAt)).split("GMT")[0];
    }

    get updatedAtReadable()
    {
        return String(new Date(this.updatedAt)).split("GMT")[0];
    }
    
    get createdAtDateReadable()
    {
        return String(new Date(this.createdAt).toDateString());
    }

    get updatedAtDateReadable()
    {
        return String(new Date(this.updatedAt).toDateString());
    }

    get id()
    {
        return this._id;
    }

    get createdAt()
    {
        return this._data.createdAt;
    }
    
    get updatedAt()
    {
        return this._data.updatedAt || this.createdAt;
    }
    
    get superuser()
    {
        return Boolean(this._data.superuser);
    }

    get email()
    {
        return this._data.email;
    }

    get enabled()
    {
        return this._data.enabled;
    }

    storagesManager(type)
    {
        if (!this._storageManagers[type]) {
            logger.debug(`Create storage manager for user ${this._id} and type ${type}.`);
            this._storageManagers[type] = new StoragesManager(path.join(config.paths.storagesDataRoot, this._id), type);
        }
        return this._storageManagers[type];
    }

    authenticate(password)
    {
        return this._saltAndHash(password) === this._data.saltedPassword;
    }
}


// export the user class.
module.exports = User;