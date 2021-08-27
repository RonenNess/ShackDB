/**
 * Initialize all view routes.
 * |-- copyright and license --|
 * @package    ShackDB
 * @file       web_pages.js
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
const appConfig = require('../lib/config');
const { UsersManager } = require("../lib/users");
const logger = require("../lib/users/lib/logger");

module.exports = function(app) {

    // skip if disabled
    if (!appConfig.server.enableWebPages) {
        return;
    }

    // text to show when blocked from external sources
    var blockedExternalText = "Web pages and management API is blocked for external sources. You can only use it from localhost.";

    // get context dictionary
    function getContext(req, activePage, breadcrumbs)
    {
        return {
            config: {
                apiRoot: appConfig.server.apiUrl,
                activePage: activePage
            },
            breadcrumbs: breadcrumbs,
            username: req.user ? req.user.id : "",
            isAdmin: req.user ? req.user.superuser : false,
        }
    }

    // get all users (only register routes when get users)
    UsersManager.getAllUsers().then((users) => {

        // check if we have enabled users
        var validUsers = users.filter(user => user.enabled);
        var gotValidUser = validUsers.length > 0;

        // warning if no valid users
        if (!gotValidUser) {
            logger.error("No valid users are set, server will run but you won't be able to do anything with it..");
        }

        // register main page
        app.get('/',(req, res) => {

            // generate context
            let context = getContext(req);

            // check if should block
            if (appConfig.security.localhostManagementOnly && !req.isLocalhostRequest) {
                context.reason = blockedExternalText;
                res.render('blocked.html', context);
                return;
            }

            // no users? special error page
            if (!gotValidUser) {
                res.render('no_users.html', context);
                return;
            }

            // logged in main page
            if (req.user) {
                res.render('main.html', context);
            }
            // not logged-in - show login page
            else {
                res.render('login.html', context);
            }
        });


        // get storages instances data for a user
        async function getStorageInstancesData(req)
        {
            // storages page
            if (req.user) {

                // get all user storages
                let storages = {};
                for (let type in appConfig.storageDriversGenerator) {

                    let instances = [];
                    storages[type] = {
                        instances: instances
                    };

                    // get instances
                    let storagesManager = req.user.storagesManager(type);
                    let storageInstances = await storagesManager.list();
                    for (let i = 0; i < storageInstances.length; ++i) {

                        let name = storageInstances[i];
                        let storage = await storagesManager.get(name);
                        let sizeKb = Math.ceil(await storage.getTotalSizeBytes() / 1000);
                        let keysCount = (await storage.list()).length;
                        instances.push({name: name, sizeKb: sizeKb, keysCount: keysCount});
                    }
                }

                // return data
                return storages;
            }

            return null;
        }


        // get storage type data for a user
        async function getStorageTypeData(req)
        {
            // storages page
            if (req.user) {

                // get all user storages
                let ret = {};
                for (let type in appConfig.storageDriversGenerator) {

                    // get policies
                    let policies = appConfig.storageTypeToPolicy[type];
                    let policyFields = [];
                    policyFields.push({title: "Max Keys", value: policies.maxKeys || "Unlimited", description: "How many keys are allowed in this storage type."});
                    policyFields.push({title: "Max Size [bytes]", value: policies.maxSizeBytes || "Unlimited", description: "Max size allowed for this storage type, including keys, values and metadata."});
                    policyFields.push({title: "Max Value Size [bytes]", value: policies.maxValueSizeBytes || "Unlimited", description: "Max size allowed for values in this storage type (after serialization)."});

                    // get drivers class and data
                    let storagesManager = req.user.storagesManager(type);
                    let drivers = appConfig.storageDriversGenerator[type].driversClassName;
                    let description = appConfig.storageDriversGenerator[type].description;
                    ret[type] = {
                        drivers: drivers,
                        description: description,
                        persistent: (appConfig.storageDriversGenerator[type]()).persistent,
                        policies: policyFields,
                        cache: storagesManager._cacheType || "None"
                    };
                }

                // return data
                return ret;
            }

            return null;
        }

        
        // register storages page
        app.get('/web/storages', async (req, res) => {

            // generate context
            let context = getContext(req, 'storages', [{name: 'storages', url: '/web/storages'}, {name: 'type', url: '/web/storages'}]);

            // check if should block
            if (appConfig.security.localhostManagementOnly && !req.isLocalhostRequest) {
                context.reason = blockedExternalText;
                res.render('blocked.html', context);
                return;
            }

            // storages page
            if (req.user) {
                context.storages = await getStorageTypeData(req);
                res.render('storages.html', context);
            }
            // not logged-in - show login page
            else {
                res.render('login.html', context);
            }
        });


        // register explore-specific-storage page
        app.get('/web/explore/:type/:id', async (req, res) => {

            // get type and id
            let type = req.params.type;
            let id = req.params.id;

            // generate context
            let context = getContext(req, 'explore', 
                [{name: 'explore', url: '/web/explore'}, {name: type + '-' + id, url: '/web/explore/' + type + '/' + id}]);

            // check if should block
            if (appConfig.security.localhostManagementOnly && !req.isLocalhostRequest) {
                context.reason = blockedExternalText;
                res.render('blocked.html', context);
                return;
            }
            
            // explore page
            if (req.user) {
            
                let storagesManager = req.user.storagesManager(type);
                var storage;
                try {
                    storage = await storagesManager.get(id);
                }
                catch (e) {
                    res.render('storage_not_found.html', context);
                    return;
                }
            
                context.storageType = type;
                context.storageId = id;
                context.storageSecret = storage.secretKey;
                context.apiKey = storage.apiKey;
                context.maxKeys = storage.policies.maxKeys;
                context.maxSizeKb = storage.policies.maxSizeBytes ? Math.ceil(storage.policies.maxSizeBytes / 1000) : null;
                context.storageRoot = storage.root.replace(/\\/g, "/");
                context.pendingChanges = storage.pendingChanges;
                context.cachedKeys = storage.cachedKeys;
                res.render('explore_storage.html', context);
            }
            // not logged-in - show login page
            else {
                res.render('login.html', context);
            }
        });
        

        // register manage-specific-storage page
        app.get('/web/manage/:type/:id', async (req, res) => {

            // get type and id
            let type = req.params.type;
            let id = req.params.id;

            // generate context
            let context = getContext(req, 'storages');

            // check if should block
            if (appConfig.security.localhostManagementOnly && !req.isLocalhostRequest) {
                context.reason = blockedExternalText;
                res.render('blocked.html', context);
                return;
            }
            
            // explore page
            if (req.user) {
            
                let storagesManager = req.user.storagesManager(type);
                var storage;
                try {
                    storage = await storagesManager.get(id);
                }
                catch (e) {
                    res.render('storage_not_found.html', context);
                    return;
                }
            
                context.storageType = type;
                context.storageId = id;
                context.apiKey = storage.apiKey;
                context.secretKey = context.storageSecret = storage.secretKey;
                context.readonlyKey = storage.readonlyKey;
                context.keys = (await storage.list()).length;
                context.sizeKb = Math.ceil((await storage.getTotalSizeBytes()) / 1000);
                res.render('manage_storage.html', context);
            }
            // not logged-in - show login page
            else {
                res.render('login.html', context);
            }
        });

        // register storage api page
        app.get('/web/api/:type/:id', async (req, res) => {

            // get type and id
            let type = req.params.type;
            let id = req.params.id;

            // generate context
            let context = getContext(req, 'storages');

            // check if should block
            if (appConfig.security.localhostManagementOnly && !req.isLocalhostRequest) {
                context.reason = blockedExternalText;
                res.render('blocked.html', context);
                return;
            }
            
            // show apis page
            if (req.user) {
            
                let storagesManager = req.user.storagesManager(type);
                var storage;
                try {
                    storage = await storagesManager.get(id);
                }
                catch (e) {
                    res.render('storage_not_found.html', context);
                    return;
                }
            
                context.storageType = type;
                context.storageId = id;
                context.apiKey = storage.apiKey;
                context.secretKey = context.storageSecret = storage.secretKey;
                context.readonlyKey = storage.readonlyKey;
                context.apiKey = storage.apiKey;
                context.hostname = req.protocol + "://" + req.headers.host
                res.render('show_storage_api.html', context);
            }
            // not logged-in - show login page
            else {
                res.render('login.html', context);
            }
        });
        
        
        // register explore page
        app.get('/web/explore', async (req, res) => {
            
            // generate context
            let context = getContext(req, 'explore', [{name: 'explore', url: '/web/explore'}]);

            // check if should block
            if (appConfig.security.localhostManagementOnly && !req.isLocalhostRequest) {
                context.reason = blockedExternalText;
                res.render('blocked.html', context);
                return;
            }

            // explore page
            if (req.user) {

                let storages = {};
                let gotStorages = false;
                for (let type in appConfig.storageDriversGenerator) 
                {
                    let storagesManager = req.user.storagesManager(type);
                    storages[type] = await storagesManager.list();
                    gotStorages |= storages[type].length > 0;
                }
                context.storages = storages;
                context.gotStorages = gotStorages;
                res.render('explore.html', context);
            }
            // not logged-in - show login page
            else {
                res.render('login.html', context);
            }
        });
        
        
        // register user page
        app.get('/web/user', async (req, res) => {
            
            // generate context
            let context = getContext(req, 'user', [{name: 'user profile', url: '/web/user'}]);

            // check if should block
            if (appConfig.security.localhostManagementOnly && !req.isLocalhostRequest) {
                context.reason = blockedExternalText;
                res.render('blocked.html', context);
                return;
            }

            // user profile page
            if (req.user) {

                context.userId = req.user.id;
                context.email = req.user.email || "[not set]";
                context.superuser = req.user.superuser;
                context.createdAt = req.user.createdAtReadable;
                context.updatedAt = req.user.updatedAtReadable;
                context.enabled = req.user.enabled;
                res.render('profile.html', context);
            }
            // not logged-in - show login page
            else {
                res.render('login.html', context);
            }
        });
        
        
        // register management page
        app.get('/web/manage', async (req, res) => {
            
            // generate context
            let context = getContext(req, 'manage', [{name: 'manage', url: '/web/manage'}]);

            // check if should block
            if (appConfig.security.localhostManagementOnly && !req.isLocalhostRequest) {
                context.reason = blockedExternalText;
                res.render('blocked.html', context);
                return;
            }
            if (!req.user || !req.user.superuser) {
                context.reason = "Management pages are only available for administrators!";
                res.render('blocked.html', context);
                return;
            }

            // manage page
            if (req.user) {

                let users = [];
                let userIds = await UsersManager.list();
                for (let i = 0; i < userIds.length; ++i) {
                    users.push(await UsersManager.get(userIds[i]));
                }
                context.users = users;
                res.render('manage.html', context);
            }
            // not logged-in - show login page
            else {
                res.render('login.html', context);
            }
        });


        // register page to get storages data
        app.get('/web/storages-data', async (req, res) => {

            // check if should block
            if (appConfig.security.localhostManagementOnly && !req.isLocalhostRequest) {
                res.setHeader('Content-Type', 'application/json');
                res.status(400); 
                res.end("Blocked");
            }

            // storages page
            if (req.user) {
                let storages = await getStorageInstancesData(req);
                res.setHeader('Content-Type', 'application/json');
                res.status(200); 
                res.json(storages);
            }
            // not logged-in - show login page
            else {
                res.setHeader('Content-Type', 'application/json');
                res.status(500); 
                res.end("");
            }
        });

        // register docs page
        const docsHtml = fs.readFileSync('./views/docs.html');
        app.get('/web/docs',(req, res) => {
            res.type('text/html');
            res.status(200); 
            res.send(docsHtml);
        });
    });
};