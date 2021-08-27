/**
 * Implement the storage api.
 * |-- copyright and license --|
 * @package    ShackDB
 * @file       api_storage.js
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
const config = require('./../../config');
const ApiBase = require('./api_base');
const Joi = require('joi');
const { validateStorageId, ApiKeyToStorage } = require('../../storage');


// storage actions that require write permissions
const writeActions = ['set', 'update', 'delete', 'purge', 'new_secret_key', 'new_readonly_key', 'destroy'];

// storage actions that are readonly
const readonlyActions = ['get', 'list', 'exist'];

// storage actions that require a key param
const actionsThatRequireKeyParam = ['get', 'set', 'delete', 'exist', 'update'];


/**
 * Manage all storage apis.
 */
class ApiStorage extends ApiBase
{
    setupRoutes(app)
    {
        logger.info("Setup storage routes.");   

        // actions on all storages of given type
        this.register(app, 'get', 'storages/:type', this.listStorages, null, true, true);
        this.register(app, 'delete', 'storages/:type/', this.deleteStorages, null, true, true);

        // actions on specific storage
        this.register(app, 'post', 'storages/:type/:id', this.createStorage, null, true, true);
        this.register(app, 'get', 'storages/:type/:id', this.listStorageKeys, null, true, true);
        this.register(app, 'head', 'storages/:type/:id', this.getStorageHead, null, true, true);
        this.register(app, 'delete', 'storages/:type/:id', this.deleteStorage, null, true, true);

        // action on storage keys / values using api key
        this.register(app, 'post', 'access', this.storageAccessApi, new Joi.object({
            apiKey: Joi.string().required(),
            secretKey: Joi.string(),
            readonlyKey: Joi.string(),
            retrieveMeta: Joi.bool(),
            data: Joi.any(),
            key: Joi.string(),
            action: Joi.string().valid('set', 'update', 'get', 'exist', 'delete', 'list', 'purge', 'new_secret_key', 'new_readonly_key', 'destroy').required(),
        }), false);

        // record usage statistics
        this._stats = {};

        // when not in test mode, report usage stats
        if (config.storage.usageStatsReportInterval) {
            logger.debug(`Will report storage usage stats every ${config.storage.usageStatsReportInterval} seconds.`);
            if (!config.isInTest) {
                setInterval(() => {
                    logger.debug(`Storage API stats from past ${config.storage.usageStatsReportInterval} seconds: `);
                    this.writeApiStatsToLog();
                    this.resetStatsCounters();

                }, config.storage.usageStatsReportInterval * 1000);
            }
        }
    }

    /**
     * Write current API stats to log.
     */
    writeApiStatsToLog()
    {
        logger.debug(JSON.stringify(this._stats, null, 4));
    }

    /**
     * Reset API stats.
     */
    resetStatsCounters()
    {
        this._stats = {};
    }

    /**
     * Checks if a given storage id is valid.
     */
    _isValidId(storageId)
    {
        return validateStorageId(storageId);
    }

    /**
     * Get storages manager from request.
     */
    _getStorages(req)
    {
        let type = req.params.type || config.defaultStorageType;
        let storages = req.user.storagesManager(type);
        if (!storages) {
            logger.warn(`Invalid or missing storage type '${req.params.type}'.`);
            throw new Error("Storage type not found!");
        }
        return storages;
    }

    /**
     * Get storage instance from request. 
     * This method may return errors to response, but won't return success.
     */
    async _getStorageFromRequest(req, res)
    {
        return new Promise(async (resolve, reject) => {

            // get storages manager and storage id
            try {
                var storages = this._getStorages(req);
            }
            catch(e) {
                reject(e);
            }
            let storageId = req.params.id;

            // validate storage id
            if (!this._isValidId(storageId)) {
                this.sendError(req, res, 400, "Invalid storage id.");
                reject("Invalid storage id.");
                return;
            }

            // not exist? return 404
            if (await storages.exist(storageId) === false) {
                this.sendError(req, res, 404, "Storage not found!");
                reject("Storage not found!");
                return;
            }

            // get storage
            try {
                var storage = await storages.get(storageId);
            }
            catch (e) {
                logger.error("Unexpected error in storage API: ", e);
                this.sendError(req, res, 500, "Unexpected error!");
                reject(e);
                return;
            }

            // return storage object
            resolve(storage);
        });
    }

    /**
     * Implement storage access API (the main API applications use).
     */
    async storageAccessApi(req, res)
    {
        return new Promise(async (resolve, reject) => {

            // get params
            let apiKey = req.body.apiKey;
            let secretKey = req.body.secretKey;
            let readonlyKey = req.body.readonlyKey;
            let action = req.body.action;
            let retrieveMeta = Boolean(req.body.retrieveMeta);

            // to keep stats
            if (!this._stats[apiKey]) {
                this._stats[apiKey] = {};
            }
            if (!this._stats[apiKey][action]) {
                this._stats[apiKey][action] = {'calls': 0, 'success': 0, 'errors': 0}
            }

            // update calls count
            let currStats = this._stats[apiKey][action];
            currStats.calls++;

            try
            {
                // no secret nor readonly key?
                if (!secretKey && !readonlyKey) {
                    this.sendError(req, res, 400, "Must either provide secret key or readonly key!");
                    reject("Must either provide secret key or readonly key!");
                    currStats.errors++;
                    return;
                }

                // if provided key make sure its valid
                if (req.body.key && !this._isValidId(req.body.key)) {
                    this.sendError(req, res, 400, "Invalid key value!");
                    reject("Invalid key.");
                    currStats.errors++;
                    return;
                }
                
                // get storage instance
                var storage = ApiKeyToStorage.get(apiKey);

                // storage not found?
                if (!storage) {
                    this.sendError(req, res, 404, "Storage not found!");
                    reject("Storage not found!");
                    currStats.errors++;
                    return;
                }

                // check if we must have secret key
                let requireSecret = (writeActions.indexOf(action) !== -1);
                if (requireSecret && !secretKey) {
                    this.sendError(req, res, 403, "Missing valid secret key for write-operation!");
                    reject("Missing valid secret key for write-operation!");
                    currStats.errors++;
                    return;
                }

                // check secret key validity
                if ((requireSecret || secretKey) && (secretKey !== storage.secretKey)) {
                    this.sendError(req, res, 403, "Secret key mismatch!");
                    reject("Wrong secret key!");
                    currStats.errors++;
                    return;
                }

                // check readonly key validity
                if (readonlyKey && (readonlyKey !== storage.readonlyKey)) {
                    this.sendError(req, res, 403, "Readonly key key mismatch!");
                    reject("Wrong readonly key!");
                    currStats.errors++;
                    return;
                }

                // get data
                if (action === 'set' || action === 'update') {
                    var data = req.body.data;
                    if (data === undefined) {
                        this.sendError(req, res, 400, "Missing or invalid data!");
                        reject("Missing or invalid data!");
                        currStats.errors++;
                        return;
                    }
                }

                // get and validate key
                if (actionsThatRequireKeyParam.indexOf(action) !== -1) {
                    var key = req.body.key;
                    if (!key || !this._isValidId(key)) {
                        this.sendError(req, res, 400, "Missing or invalid key!");
                        reject("Missing or invalid key!");
                        currStats.errors++;
                        return;
                    }
                }
            }
            catch (e)
            {
                this.sendError(req, res, 500, "Unexpected error!");
                logger.error(`Unexpected error in storage action ${type} (during validations)! Error: ${e}.`);
                reject(e);
                currStats.errors++;
                return;          
            }

            // perform action
            try {
                switch (action)
                {
                    case "set":
                        {
                            let metadata = {source: req.socket.remoteAddress}
                            await storage.set(key, data, metadata);
                            this.sendSuccess(res, {success: true});
                        }
                        break;

                    case "update":
                        {
                            if (data.constructor !== Object) {
                                this.sendError(req, res, 400, "Data param in update action is not a dictionary!");
                                reject("Data param in update action is not a dictionary!");
                                currStats.errors++;
                                return;
                            }

                            let oldValue = {};
                            let isNew = true;
                            try {
                                oldValue = await storage.get(key, retrieveMeta);
                                isNew = false;
                            }
                            catch (e) {
                            }

                            if (oldValue.constructor !== Object) {
                                this.sendError(req, res, 400, "Existing data to update is not a dictionary!");
                                reject("Existing data to update is not a dictionary!");
                                currStats.errors++;
                                return;
                            }

                            for (let key in data) {
                                oldValue[key] = data[key];
                            }

                            let metadata = {source: req.socket.remoteAddress}
                            await storage.set(key, oldValue, metadata);
                            this.sendSuccess(res, {success: true, data: oldValue, new: isNew});
                        }
                        break;

                    case "get":
                        {
                            try {
                                let ret = await storage.get(key, retrieveMeta);
                                this.sendSuccess(res, {data: ret, success: true});
                            }
                            catch (e) {
                                if ((await storage.exist(key)) === false) {
                                    this.sendError(req, res, 404 , "Key not found!");
                                    reject(e);
                                    currStats.errors++;
                                    return;
                                }
                                throw e;
                            }
                        }
                        break;

                    case "exist":
                        {
                            let ret = await storage.exist(key);
                            this.sendSuccess(res, {exist: ret, success: true});
                        }
                        break;
                        
                    case "delete":
                        {
                            try {
                                await storage.delete(key);
                                this.sendSuccess(res, {deleted: true, success: true});
                            }
                            catch (e) {
                                if ((await storage.exist(key)) === false) {
                                    this.sendError(req, res, 404 , "Key not found!");
                                    reject(e);
                                    currStats.errors++;
                                    return;
                                }
                                throw e;
                            }
                        }
                        break;

                    case "purge":
                        {
                            await storage.purge();
                            this.sendSuccess(res, {purged: true, success: true});
                        }
                        break;

                    case "destroy":
                        {
                            await storage.purge();
                            await (storage.manager.delete(storage.id));
                            this.sendSuccess(res, {destroyed: true, success: true});
                        }
                        break;
                        
                    case "list":
                        {
                            let values = await storage.list();
                            let size = await storage.getTotalSizeBytes();
                            let pendingChanges = storage.pendingChanges;
                            this.sendSuccess(res,  {keys: values, size: size, pendingChanges: pendingChanges, success: true});
                        }
                        break;

                    case "new_secret_key":
                        {
                            logger.debug(`Reset secret key for: ${storage.apiKey}.`);
                            await storage.generateSecretKey();
                            let newSecret = storage.secretKey;
                            this.sendSuccess(res,  {newSecretKey: newSecret, success: true});
                        }
                        break;
                        
                    case "new_readonly_key":
                        {
                            logger.debug(`Reset readonly key for: ${storage.apiKey}.`);
                            await storage.generateReadonlyKey();
                            let newReadonly = storage.readonlyKey;
                            this.sendSuccess(res,  {newReadonlyKey: newReadonly, success: true});
                        }
                        break;
                }
            }
            catch (e) {
                this.sendError(req, res, 500, "Unexpected error!");
                logger.error(`Unexpected error in storage action ${type}! Error: ${e}.`);
                reject(e);
                currStats.errors++;
                return;
            }

            // if got here = success
            currStats.success++;
            resolve(true);
        });
    }
    
    /**
     * Implement list storages API.
     */
    async listStorages(req, res)
    {
        return new Promise(async (resolve, reject) => {

            // get storages manager
            try {
                var storages = this._getStorages(req);
            }
            catch(e) {
                reject(e);
            }

            // return success
            let keys = await storages.list();
            this.sendSuccess(res, keys);
            resolve(true);
        });
    }

    /**
     * Implement delete all storages.
     */
    async deleteStorages(req, res)
    {
        return new Promise(async (resolve, reject) => {

            // get storages manager
            try {
                var storages = this._getStorages(req);
            }
            catch(e) {
                reject(e);
            }

            // return success
            await storages.purge();
            this.sendSuccess(res, {});
            resolve(true);
        });
    }

    /**
     * Implement getting storage head.
     */
    async getStorageHead(req, res)
    {
        return new Promise(async (resolve, reject) => {

            // get storage
            try {
                var storage = await this._getStorageFromRequest(req, res);
            }
            catch(e) {
                reject(e);
                return;
            }

            // return success
            this.sendSuccess(res, {secretKey: storage.secretKey, readonlyKey: storage.readonlyKey});
            resolve(true);
        });
    }

     /**
     * Implement getting storage keys.
     */
    async listStorageKeys(req, res)
    {
        return new Promise(async (resolve, reject) => {

            // get storage
            try {
                var storage = await this._getStorageFromRequest(req, res);
            }
            catch(e) {
                reject(e);
                return;
            }

            // return success
            let keys = await storage.list();
            this.sendSuccess(res, keys);
            resolve(true);
        });
    }

    /**
     * Implement deleting a storage.
     */
    async deleteStorage(req, res)
    {
        return new Promise(async (resolve, reject) => {

            // get storage
            try {
                var storages = this._getStorages(req);
            }
            catch(e) {
                reject(e);
            }
            let storageId = req.params.id;

            // validate storage id
            if (!this._isValidId(storageId)) {
                this.sendError(req, res, 400, "Invalid storage id.");
                reject("Invalid storage id.");
                return;
            }

            // not exist? return 404
            if (await storages.exist(storageId) === false) {
                this.sendError(req, res, 404, "Storage not found!");
                reject("Storage not found!");
                return;
            }

            // delete storage
            try {
                await storages.delete(storageId);
            }
            catch (e) {
                this.sendError(req, res, 500, "Unexpected error!");
                reject(e);
                return;
            }

            // return success
            this.sendSuccess(res, {});
            resolve(true);
        });
    }

     /**
     * Implement creating a storage.
     */
    async createStorage(req, res)
    {
        return new Promise(async (resolve, reject) => {

            // get storage
            try {
                var storages = this._getStorages(req);
            }
            catch(e) {
                reject(e);
            }
            let storageId = req.params.id;

            // validate storage id
            if (!this._isValidId(storageId)) {
                this.sendError(req, res, 400, "Invalid storage id.");
                reject("Invalid storage id.");
                return;
            }

            // storage already exist? error
            try {
                if (await storages.exist(storageId)) {
                    this.sendError(req, res, 409, "Storage with this id already exist.");
                    reject("Storage with this id already exist.");
                    return;
                }
            }
            catch (e) {
                this.sendError(req, res, 500, "Unexpected error while validating id!");
                reject("Unexpected error while validating id!");
                return;
            }

            // create storage
            try {
                await storages.create(storageId);
            }
            catch (e) {
                this.sendError(req, res, 500, "Unexpected error!");
                reject("Unexpected error!");
                return;
            }

            // return success
            this.sendSuccess(res, {});
            resolve(true);
        });
    }
}


// export main class
module.exports = new ApiStorage();