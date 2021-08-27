/**
 * UsersManager implements the users manager interface.
 * |-- copyright and license --|
 * @package    ShackDB
 * @file       users_manager.js
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
const usersStorage = require('./users_storage');
const User = require('./user');
const IUsersManager = require('./users_manager.interface');


/**
 * Implement the storages manager class - manage all user instances.
 */
class UsersManager extends IUsersManager
{
    constructor()
    {
        super();
        this._loadedUsers = {};
    }
    
    // make sure id and data are valid, throw exception if not.
    _validateIdAndData(id, data, skipDataValidation)
    {
        if (!id) { throw new Error("Missing user id!"); }
        if (!data && !skipDataValidation) { throw new Error("Missing user data!"); }
    }

    getAllUsers()
    {
        return new Promise(async (resolve, reject) => {

            try {
                var ret = [];
                let users = await this.list();
                for (var i = 0; i < users.length; ++i) {
                    let user = await this.get(users[i]);
                    ret.push(user);
                }
                resolve(ret);
            }
            catch (e) {
                reject(e);
            }
        });
    }

    get(id)
    {
        this._validateIdAndData(id, null, true);

        return new Promise(async (resolve, reject) => {

            // return from cache if already loaded
            if (this._loadedUsers[id]) {
                
                let cached = this._loadedUsers[id];
                if (cached.version === cached.user.version) {
                    resolve(cached.user);
                    return;
                } 
                else {
                    logger.debug(`Removed user ${id} from users cache because version mismatch. Will reload it now.`);
                    delete this._loadedUsers[id];
                }
            }

            // not exist? reject
            let exist = await this.exist(id);
            if (!exist) {
                reject("User not found!");
                return;
            }

            // try to get user
            try {
                logger.info(`Load user '${id}' instance.`);
                let user = new User(id);
                await user.load();
                this._loadedUsers[id] = {user: user, version: user.version};
                resolve(user);
            }
            catch (e) {
                reject("User data corrupted!");
                return;
            }
        });
    }

    delete(id)
    {
        this._validateIdAndData(id, null, true);

        return new Promise(async (resolve, reject) => {
            try {
                logger.info(`Delete user '${id}'.`);
                let user = await this.get(id);
                await user.delete();
                delete this._loadedUsers[id];
                resolve(true);
            }
            catch (e) {
                reject("User to delete not found!");
            }
        });
    }

    create(id, data)
    {
        this._validateIdAndData(id, data);

        return new Promise(async (resolve, reject) => {

            // already exist? reject
            let exist = await this.exist(id);
            if (exist) {
                reject("User already exist!");
                return;
            }

            // create user
            try {
                logger.info(`Create user '${id}'.`);
                let user = new User(id);
                await user.update(data, true);
                this._loadedUsers[id] = {user: user, version: user.version};
                resolve(user);
            }
            catch (e) {
                reject("Error creating user! " + e);
            }
        });
    }

    updateOrCreate(id, data)
    {
        this._validateIdAndData(id, data);

        return new Promise(async (resolve, reject) => {
            try {
                if (await this.exist(id)) {
                    let user = await this.get(id);
                    await user.update(data, true);
                    resolve([user, false]);
                }
                else {
                    resolve([await this.create(id, data), true]);
                }
            }
            catch (e) {
                reject("Unexpected error! " + e);
            }
        });
    }

    getOrCreate(id, data)
    {
        this._validateIdAndData(id, data);

        return new Promise(async (resolve, reject) => {
            try {
                if (await this.exist(id)) {
                    resolve([await this.get(id), false]);
                }
                else {
                    resolve([await this.create(id, data), true]);
                }
            }
            catch (e) {
                reject("Unexpected error! " + e);
            }
        });
    }

    update(id, data)
    {
        this._validateIdAndData(id, data);

        return new Promise(async (resolve, reject) => {

            // already exist? reject
            let exist = await this.exist(id);
            if (!exist) {
                reject("User to update does not exist!");
                return;
            }

            // update user
            try {
                logger.info(`Update user '${id}'.`);
                let user = await this.get(id);
                await user.update(data, true);
                resolve(user);
            }
            catch (e) {
                reject("Error creating user! " + e);
            }
        });
    }

    clearCache()
    {
        this._loadedUsers = {};
    }

    exist(id)
    {
        this._validateIdAndData(id, null, true);

        return new Promise(async (resolve, reject) => {
            let tempUser = new User(id);
            let exist = await tempUser.exist();
            resolve(exist);
        });
    }

    list()
    {
        return new Promise(async (resolve, reject) => {
            let ret = await usersStorage.list();
            resolve(ret);
        });
    }

    purge()
    {
        return new Promise(async (resolve, reject) => {
            await usersStorage.purge();
            this._loadedUsers = {};
            resolve(true);
        });
    }
}


// export the users manager class.
module.exports = new UsersManager();