/**
 * Load application config to a dictionary.
 * |-- copyright and license --|
 * @package    ShackDB
 * @file       config.js
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

const isInTest = typeof global.it === 'function';
const fs = require('fs');
const path = require('path');
const ICache = require('./storage/lib/cache/cache.interface');
const IStorageDrivers = require('./storage/lib/drivers/drivers.interface');
const StoragePolicies = require('./storage/lib/policies');
const configFile = isInTest ? 'app.test.json' : 'app.json';
const config = JSON.parse(fs.readFileSync(path.join('config', configFile), 'utf8'));
const dataRoot = config.paths.dataRoot;

// check storage types validity
if (!config.storageTypes) {
    throw new Error("Missing or invalid storage types configuration!");
}

// load driver types as dictionary
let defaultStorageType;
const storageDriversGenerator = {};
const storageTypeToPolicy = {};
const storageTypeToCacheName = {};
for (let name in config.storageTypes) {
    
    // get storage type params
    let storageTypeConf = config.storageTypes[name];

    // load drivers class from drivers path
    let loadedClass;
    try {
        loadedClass = require(storageTypeConf.drivers);
    }
    catch (e) {
        throw new Error(`Could not load storage drivers from '${storageTypeConf.drivers}'.`);
    }

    // make sure valid type, and set in dict
    if (!(loadedClass.prototype instanceof IStorageDrivers)) {
        throw new Error(`Storage drivers from path '${storageTypeConf.drivers}' did not return a correct class type (should inherit from IstorageTypes).`)
    }
    storageDriversGenerator[name] = () => new loadedClass(storageTypeConf.config || {});
    storageDriversGenerator[name].driversClassName = loadedClass.name;
    storageDriversGenerator[name].description = loadedClass.description;
    storageTypeToPolicy[name] = new StoragePolicies(config.policies[storageTypeConf.policy] || {});
    storageTypeToCacheName[name] = storageTypeConf.cache;

    // set defaults
    if (!defaultStorageType) { defaultStorageType = name; }
}


// "dictionary": {"class": "./storage/lib/cache/dictionary_cache", "config": {"maxKeys": 10, "keysToReduceTo": 8}}
const storageCacheGenerators = {};
for (let name in config.caches) {
    
    // get cache type params
    let cacheTypeConf = config.caches[name];

    // load cache class from path
    let loadedClass;
    try {
        loadedClass = require(cacheTypeConf.class);
    }
    catch (e) {
        throw new Error(`Could not load cache class from '${cacheTypeConf.class}'.`);
    }

    // make sure valid type, and set in dict
    if (!(loadedClass.prototype instanceof ICache)) {
        throw new Error(`Storage cache from path '${cacheTypeConf.class}' did not return a correct class type (should inherit from ICache).`)
    }
    storageCacheGenerators[name] = () => new loadedClass(cacheTypeConf.config || {});
}


// build app config
const appConfig = {

    // are we in debug mode?
    isInTest: isInTest,

    // all app paths
    paths: {
        dataRoot: path.join(dataRoot),
        usersDataRoot: path.join(dataRoot, config.paths.usersDataRoot),
        storagesDataRoot: path.join(dataRoot, config.paths.storagesDataRoot),
    },

    // users storage type
    usersStorageType: config.usersStorageType,

    // misc storage preferences
    storage: {
        keepMetadata: Boolean(config.storage.keepMetadata),
        usageStatsReportInterval: config.storage.usageStatsReportInterval || 0
    },

    // storage drivers generators
    storageDriversGenerator: storageDriversGenerator,
    defaultStorageType: defaultStorageType,

    // cache class generators
    storageCacheGenerators: storageCacheGenerators,

    // get policy from storage type
    storageTypeToPolicy: storageTypeToPolicy,

    // get cache from storage type
    storageTypeToCacheName: storageTypeToCacheName,

    // security stuff
    security: {
        maxFailedLoginAttempts: config.security.maxFailedLoginAttempts,
        mustBeAdminToCreateUser: config.security.mustBeAdminToCreateUser,
        cookiesSecret: config.security.cookiesSecret || undefined,
        privateKeyFile: config.security.privateKeyFile,
        certificateFile: config.security.certificateFile,
        authTokenMaxAgeSeconds: config.security.authTokenMaxAgeSeconds || undefined,
        signCookies: Boolean(config.security.cookiesSecret),
        localhostManagementOnly: Boolean(config.security.localhostManagementOnly)
    },

    // general settings
    server: {
        port: config.server.port,
        securedPort: config.server.securedPort,
        hostname: config.server.hostname,
        apiUrl: config.server.apiUrl,
        enableWebPages: config.server.enableWebPages
    },

    // built-in users
    users: config.users
};

module.exports = appConfig;