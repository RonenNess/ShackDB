/**
 * Test the storage api - base tests for all storage types.
 * |-- copyright and license --|
 * @package    ShackDB
 * @file       api_storage_access.test.js
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

// get testing asserts
const assert = require('assert');

// get config
const config = require('../../config');

// to create test users and storage
const { AuthManager } = require('../../auth');
const { UsersManager } = require('../../users');
const userId = 'user_id';
const adminId = 'admin_id';
const userDetails = {email:"test@gmail.com", "password": "123456"};
const adminDetails = {email:"admin@gmail.com", "password": "123456", "superuser": true};
const existingStorageId = 'test_existing_storage';

// get utility methods
const {axios, toTestUrl, checkErrorCode, checkSuccessCode} = require('./utils');

// users
var user, user2, admin;


describe(config.server.apiUrl, function() 
{
    describe('access', function() 
    {
        let _types = ['memory', 'files', 'cached_files', 'files_with_cache', 'cached_files_with_cache'];
        for (let _ti = 0; _ti < _types.length; ++_ti) {

            (function(type) {

                describe('<' + type + '>', function() 
                {

                    beforeEach(async () => {
                        AuthManager.clearTokens();
                        let _isNew, storage;
                        [user, _isNew] = await UsersManager.getOrCreate(userId, userDetails);
                        [user2, _isNew] = await UsersManager.getOrCreate(userId + '_2', userDetails);
                        [admin, _isNew] = await UsersManager.getOrCreate(adminId, adminDetails);
                        //await user.storagesManager(type).purge();
                        [storage, _isNew] = await user.storagesManager(type).getOrCreate(existingStorageId);
                        await storage.purge();
                    });

                    describe('general_validations', function() 
                    { 
                        it('return 403 if secret key mismatch', async () =>
                        {
                            let storages = await user.storagesManager(type);
                            let storage = await storages.get(existingStorageId);
                            await storage.set("test_key", {"foo": "bar"});

                            await checkErrorCode(async () => await axios.request(
                                {
                                    method: 'post',
                                    url: toTestUrl("access"),
                                    data: {
                                        apiKey: storage.apiKey,
                                        secretKey: storage.secretKey + '_',
                                        key: 'test_key',
                                        action: 'get'
                                    }
                                }), 403);
                        });

                        it('return 404 if storage is not found', async () =>
                        {
                            let storages = await user.storagesManager(type);
                            let storage = await storages.get(existingStorageId);
                            await storage.set("test_key", {"foo": "bar"});

                            await checkErrorCode(async () => await axios.request(
                                {
                                    method: 'post',
                                    url: toTestUrl("access"),
                                    data: {
                                        apiKey: storage.apiKey + '2',
                                        secretKey: storage.secretKey,
                                        key: 'test_key',
                                        action: 'get'
                                    }
                                }), 404);
                        });

                        it('return 400 on any missing param or invalid action', async () =>
                        {
                            let storages = await user.storagesManager(type);
                            let storage = await storages.get(existingStorageId);
                            await storage.set("test_key", {"foo": "bar"});

                            await checkErrorCode(async () => await axios.request(
                                {
                                    method: 'post',
                                    url: toTestUrl("access"),
                                    data: {
                                        secretKey: storage.secretKey,
                                        key: 'test_key',
                                        action: 'get'
                                    }
                                }), 400);
                                
                            await checkErrorCode(async () => await axios.request(
                                {
                                    method: 'post',
                                    url: toTestUrl("access"),
                                    data: {
                                        apiKey: storage.apiKey,
                                        //secretKey: storage.secretKey,
                                        key: 'test_key',
                                        action: 'get'
                                    }
                                }), 400);
                                
                            await checkErrorCode(async () => await axios.request(
                                {
                                    method: 'post',
                                    url: toTestUrl("access"),
                                    data: {
                                        apiKey: storage.apiKey,
                                        secretKey: storage.secretKey,
                                        key: 'test_key',
                                        //action: 'get'
                                    }
                                }), 400);
                                
                            await checkErrorCode(async () => await axios.request(
                                {
                                    method: 'post',
                                    url: toTestUrl("access"),
                                    data: {
                                        apiKey: storage.apiKey,
                                        secretKey: storage.secretKey,
                                        key: 'test_key',
                                        action: 'invalid!'
                                    }
                                }), 400);
                        });
                    });

                    
                    describe('randomizer', function() 
                    { 
                        it('storage contains expected set of values after lots of random actions', async () =>
                        {
                            let storages = await user.storagesManager(type);
                            let storage = await storages.get(existingStorageId);
                            await storage.purge();
                            await storage.flush();
                            
                            // expected values
                            var expected = {};

                            // set action
                            var doSetAction = async () => {

                                let optional_values = ["hello", 123, '-', -123, 0, "123", null, {"hello": "world"}, {}, [1,2,3], ["1", "2", "3"], [], ["aa", 11, true], true, false, "abcdefg"];
                                let key = "test_" + Math.floor(Math.random() * 35);
                                let value = optional_values[Math.floor(Math.random() * optional_values.length)];

                                let response = await checkSuccessCode(async () => await axios.request(
                                    {
                                        method: 'post',
                                        url: toTestUrl("access"),
                                        data: {
                                            apiKey: storage.apiKey,
                                            secretKey: storage.secretKey,
                                            key: key,
                                            data: value,
                                            action: 'set'
                                        }
                                    })
                                );
    
                                assert.deepEqual(response.data, {success: true});
                                if (typeof value === "object") {
                                    assert.deepEqual(await storage.get(key), value);
                                }
                                else {
                                    assert.strictEqual(await storage.get(key), value);
                                }

                                expected[key] = value;
                            }

                            // get action
                            var doGetAction = async () => {

                                // pick random key to get (and skip if empty)
                                let keys = Object.keys(expected);
                                if (keys.length === 0) {
                                    return;
                                }
                                var key = keys[Math.floor(Math.random() * keys.length)];

                                let response = await checkSuccessCode(async () => await axios.request(
                                    {
                                        method: 'post',
                                        url: toTestUrl("access"),
                                        data: {
                                            apiKey: storage.apiKey,
                                            secretKey: storage.secretKey,
                                            key: key,
                                            action: 'get'
                                        }
                                    })
                                );
    
                                assert.deepEqual(response.data, {success: true, data: expected[key]});
                            }

                            // delete action
                            var doDeleteAction = async () => {

                                // pick random key to get (and skip if empty)
                                let keys = Object.keys(expected);
                                if (keys.length === 0) {
                                    return;
                                }
                                var key = keys[Math.floor(Math.random() * keys.length)];

                                let response = await checkSuccessCode(async () => await axios.request(
                                    {
                                        method: 'post',
                                        url: toTestUrl("access"),
                                        data: {
                                            apiKey: storage.apiKey,
                                            secretKey: storage.secretKey,
                                            key: key,
                                            action: 'delete'
                                        }
                                    })
                                );
    
                                assert.deepEqual(response.data, {success: true, deleted: true});
                                delete expected[key];
                            }

                            // purge action
                            var doPurgeAction = async () => {

                                let response = await checkSuccessCode(async () => await axios.request(
                                    {
                                        method: 'post',
                                        url: toTestUrl("access"),
                                        data: {
                                            apiKey: storage.apiKey,
                                            secretKey: storage.secretKey,
                                            action: 'purge'
                                        }
                                    })
                                );
    
                                assert.deepEqual(response.data, {success: true, purged: true});
                                expected = {};
                            }

                            // perform actions randomly
                            for (let i = 0; i < 200; ++i) {

                                // half way - do purge
                                if (i === 100) {
                                    let existingKeys = await storage.list();
                                    assert.deepEqual(existingKeys.sort(), Object.keys(expected).sort());
                                    await doPurgeAction();
                                }

                                // do random actions
                                let action = Math.floor(Math.random() * 5);
                                if (action === 0) {
                                    await doGetAction();
                                }
                                else if (action === 1) {
                                    await doDeleteAction();
                                }
                                else {
                                    await doSetAction();
                                }
                            }
                            await doSetAction();
                            await doSetAction();
                            await doSetAction();

                            // validations
                            let existingKeys = await storage.list();
                            assert.ok(existingKeys.length > 0);
                            assert.deepEqual(existingKeys.sort(), Object.keys(expected).sort());
                            for (let key in expected) {
                                assert.deepEqual(await storage.get(key), expected[key]);
                            }
                        });
                    });


                    describe('get', function() 
                    { 
                        it('return value from storage if found, using secret key', async () =>
                        {
                            let storages = await user.storagesManager(type);
                            let storage = await storages.get(existingStorageId);
                            await storage.set("test_key", {"foo": "bar"});

                            let response = await checkSuccessCode(async () => await axios.request(
                                {
                                    method: 'post',
                                    url: toTestUrl("access"),
                                    data: {
                                        apiKey: storage.apiKey,
                                        secretKey: storage.secretKey,
                                        key: 'test_key',
                                        action: 'get'
                                    }
                                })
                            );

                            assert.deepEqual(response.data, {data: {"foo": "bar"}, success: true});
                        });

                        it('return value from storage if found, using the readonly key', async () =>
                        {
                            let storages = await user.storagesManager(type);
                            let storage = await storages.get(existingStorageId);
                            await storage.set("test_key", {"foo": "bar"});

                            let response = await checkSuccessCode(async () => await axios.request(
                                {
                                    method: 'post',
                                    url: toTestUrl("access"),
                                    data: {
                                        apiKey: storage.apiKey,
                                        readonlyKey: storage.readonlyKey,
                                        key: 'test_key',
                                        action: 'get'
                                    }
                                })
                            );

                            assert.deepEqual(response.data, {data: {"foo": "bar"}, success: true});
                        });


                        it('get can handle dictionary values', async () =>
                        {
                            let storages = await user.storagesManager(type);
                            let storage = await storages.get(existingStorageId);
                            await storage.set('test_key', {"foo": "bar"})

                            let response = await checkSuccessCode(async () => await axios.request(
                                {
                                    method: 'post',
                                    url: toTestUrl("access"),
                                    data: {
                                        apiKey: storage.apiKey,
                                        secretKey: storage.secretKey,
                                        key: 'test_key',
                                        action: 'get'
                                    }
                                })
                            );

                            assert.deepEqual(response.data, {success: true, data: {"foo": "bar"}});
                        });

                        
                        it('get can handle array values', async () =>
                        {
                            let storages = await user.storagesManager(type);
                            let storage = await storages.get(existingStorageId);
                            
                            await storage.set('test_key', ["foo", "bar"]);
                            let response = await checkSuccessCode(async () => await axios.request(
                                {
                                    method: 'post',
                                    url: toTestUrl("access"),
                                    data: {
                                        apiKey: storage.apiKey,
                                        secretKey: storage.secretKey,
                                        key: 'test_key',
                                        action: 'get'
                                    }
                                })
                            );

                            assert.deepEqual(response.data, {success: true, data: ["foo", "bar"]});
                            
                            await storage.set('test_key', []);
                            response = await checkSuccessCode(async () => await axios.request(
                                {
                                    method: 'post',
                                    url: toTestUrl("access"),
                                    data: {
                                        apiKey: storage.apiKey,
                                        secretKey: storage.secretKey,
                                        key: 'test_key',
                                        action: 'get'
                                    }
                                })
                            );

                            assert.deepEqual(response.data, {success: true, data: []});
                        });

                                                
                        it('get can handle numeric values', async () =>
                        {
                            let storages = await user.storagesManager(type);
                            let storage = await storages.get(existingStorageId);

                            await storage.set('test_key', 123);
                            let response = await checkSuccessCode(async () => await axios.request(
                                {
                                    method: 'post',
                                    url: toTestUrl("access"),
                                    data: {
                                        apiKey: storage.apiKey,
                                        secretKey: storage.secretKey,
                                        key: 'test_key',
                                        action: 'get'
                                    }
                                })
                            );

                            assert.deepEqual(response.data, {success: true, data: 123});

                            await storage.set('test_key', -123);
                             response = await checkSuccessCode(async () => await axios.request(
                                {
                                    method: 'post',
                                    url: toTestUrl("access"),
                                    data: {
                                        apiKey: storage.apiKey,
                                        secretKey: storage.secretKey,
                                        key: 'test_key',
                                        action: 'get'
                                    }
                                })
                            );

                            assert.deepEqual(response.data, {success: true, data: -123});
                            
                            await storage.set('test_key', 0);
                            response = await checkSuccessCode(async () => await axios.request(
                                {
                                    method: 'post',
                                    url: toTestUrl("access"),
                                    data: {
                                        apiKey: storage.apiKey,
                                        secretKey: storage.secretKey,
                                        key: 'test_key',
                                        action: 'get'
                                    }
                                })
                            );

                            assert.deepEqual(response.data, {success: true, data: 0});
                            
                        });

                                                                        
                        it('get can handle boolean values', async () =>
                        {
                            let storages = await user.storagesManager(type);
                            let storage = await storages.get(existingStorageId);
                            
                            await storage.set('test_key', true);
                            let response = await checkSuccessCode(async () => await axios.request(
                                {
                                    method: 'post',
                                    url: toTestUrl("access"),
                                    data: {
                                        apiKey: storage.apiKey,
                                        secretKey: storage.secretKey,
                                        key: 'test_key',
                                        action: 'get'
                                    }
                                })
                            );

                            assert.deepEqual(response.data, {success: true, data: true});
                                                 
                            await storage.set('test_key', false);
                            response = await checkSuccessCode(async () => await axios.request(
                                {
                                    method: 'post',
                                    url: toTestUrl("access"),
                                    data: {
                                        apiKey: storage.apiKey,
                                        secretKey: storage.secretKey,
                                        key: 'test_key',
                                        action: 'get'
                                    }
                                })
                            );

                            assert.deepEqual(response.data, {success: true, data: false});

                        });
                   
                                                                                                   
                        it('get can handle string values', async () =>
                        {
                            let storages = await user.storagesManager(type);
                            let storage = await storages.get(existingStorageId);
                            await storage.set('test_key', "hello");
                                                        
                            let response = await checkSuccessCode(async () => await axios.request(
                                {
                                    method: 'post',
                                    url: toTestUrl("access"),
                                    data: {
                                        apiKey: storage.apiKey,
                                        secretKey: storage.secretKey,
                                        key: 'test_key',
                                        action: 'get'
                                    }
                                })
                            );
                            assert.deepEqual(response.data, {success: true, data: "hello"});

                            await storage.set('test_key', "");
                            response = await checkSuccessCode(async () => await axios.request(
                                {
                                    method: 'post',
                                    url: toTestUrl("access"),
                                    data: {
                                        apiKey: storage.apiKey,
                                        secretKey: storage.secretKey,
                                        key: 'test_key',
                                        action: 'get'
                                    }
                                })
                            );
                            assert.deepEqual(response.data, {success: true, data: ""});
                        });
                   
                                                                                                   
                        it('get can handle null', async () =>
                        {
                            let storages = await user.storagesManager(type);
                            let storage = await storages.get(existingStorageId);
                            await storage.set('test_key', null);
                                                        
                            let response = await checkSuccessCode(async () => await axios.request(
                                {
                                    method: 'post',
                                    url: toTestUrl("access"),
                                    data: {
                                        apiKey: storage.apiKey,
                                        secretKey: storage.secretKey,
                                        key: 'test_key',
                                        action: 'get'
                                    }
                                })
                            );

                            assert.deepEqual(response.data, {success: true, data: null});
                        });


                        it('return 404 if key not found', async () =>
                        {
                            let storages = await user.storagesManager(type);
                            let storage = await storages.get(existingStorageId);
                            await storage.set("test_key", {"foo": "bar"});

                            await checkErrorCode(async () => await axios.request(
                                {
                                    method: 'post',
                                    url: toTestUrl("access"),
                                    data: {
                                        apiKey: storage.apiKey,
                                        secretKey: storage.secretKey,
                                        key: 'test_key_2',
                                        action: 'get'
                                    }
                                }), 404
                            );
                        });

                        it('return 400 if missing key param from request', async () =>
                        {
                            let storages = await user.storagesManager(type);
                            let storage = await storages.get(existingStorageId);
                            await storage.set("test_key", {"foo": "bar"});

                            await checkErrorCode(async () => await axios.request(
                                {
                                    method: 'post',
                                    url: toTestUrl("access"),
                                    data: {
                                        apiKey: storage.apiKey,
                                        secretKey: storage.secretKey,
                                        action: 'get'
                                    }
                                }), 400);
                        });
                    });

                    describe('exist', function() 
                    { 
                        it('return true if value is found, using secret key', async () =>
                        {
                            let storages = await user.storagesManager(type);
                            let storage = await storages.get(existingStorageId);
                            await storage.set("test_key", {"foo": "bar"});

                            let response = await checkSuccessCode(async () => await axios.request(
                                {
                                    method: 'post',
                                    url: toTestUrl("access"),
                                    data: {
                                        apiKey: storage.apiKey,
                                        secretKey: storage.secretKey,
                                        key: 'test_key',
                                        action: 'exist'
                                    }
                                })
                            );

                            assert.deepEqual(response.data, {exist: true, success: true});
                        });

                        it('return true if value is found, using the readonly key', async () =>
                        {
                            let storages = await user.storagesManager(type);
                            let storage = await storages.get(existingStorageId);
                            await storage.set("test_key", {"foo": "bar"});

                            let response = await checkSuccessCode(async () => await axios.request(
                                {
                                    method: 'post',
                                    url: toTestUrl("access"),
                                    data: {
                                        apiKey: storage.apiKey,
                                        readonlyKey: storage.readonlyKey,
                                        key: 'test_key',
                                        action: 'exist'
                                    }
                                })
                            );

                            assert.deepEqual(response.data, {exist: true, success: true});
                        });

                        it('return exist=false if key not found', async () =>
                        {
                            let storages = await user.storagesManager(type);
                            let storage = await storages.get(existingStorageId);
                            await storage.set("test_key", {"foo": "bar"});

                            let response = await checkSuccessCode(async () => await axios.request(
                                {
                                    method: 'post',
                                    url: toTestUrl("access"),
                                    data: {
                                        apiKey: storage.apiKey,
                                        readonlyKey: storage.readonlyKey,
                                        key: 'test_key_2',
                                        action: 'exist'
                                    }
                                })
                            );

                            assert.deepEqual(response.data, {exist: false, success: true});
                        });

                        it('return 400 if missing key param from request', async () =>
                        {
                            let storages = await user.storagesManager(type);
                            let storage = await storages.get(existingStorageId);
                            await storage.set("test_key", {"foo": "bar"});

                            await checkErrorCode(async () => await axios.request(
                                {
                                    method: 'post',
                                    url: toTestUrl("access"),
                                    data: {
                                        apiKey: storage.apiKey,
                                        secretKey: storage.secretKey,
                                        action: 'exist'
                                    }
                                }), 400);
                        });
                    });

                    describe('set', function() 
                    { 
                        it('set value in storage if params are valid (can override existing)', async () =>
                        {
                            let storages = await user.storagesManager(type);
                            let storage = await storages.get(existingStorageId);
                            assert.ok(await storage.exist("test_key") === false);

                            let response = await checkSuccessCode(async () => await axios.request(
                                {
                                    method: 'post',
                                    url: toTestUrl("access"),
                                    data: {
                                        apiKey: storage.apiKey,
                                        secretKey: storage.secretKey,
                                        key: 'test_key',
                                        data: {"foo": "bar"},
                                        action: 'set'
                                    }
                                })
                            );

                            assert.deepEqual(response.data, {success: true});
                            assert.deepEqual(await storage.get("test_key"), {"foo": "bar"});

                            response = await checkSuccessCode(async () => await axios.request(
                                {
                                    method: 'post',
                                    url: toTestUrl("access"),
                                    data: {
                                        apiKey: storage.apiKey,
                                        secretKey: storage.secretKey,
                                        key: 'test_key',
                                        data: {"foo": "new_bar"},
                                        action: 'set'
                                    }
                                })
                            );

                            assert.deepEqual(response.data, {success: true});
                            assert.deepEqual(await storage.get("test_key"), {"foo": "new_bar"});
                     
                            response = await checkSuccessCode(async () => await axios.request(
                                {
                                    method: 'post',
                                    url: toTestUrl("access"),
                                    data: {
                                        apiKey: storage.apiKey,
                                        secretKey: storage.secretKey,
                                        key: 'test_key2',
                                        data: {"foo2": "new_bar"},
                                        action: 'set'
                                    }
                                })
                            );

                            assert.deepEqual(response.data, {success: true});
                            assert.deepEqual(await storage.get("test_key"), {"foo": "new_bar"});
                            assert.deepEqual(await storage.get("test_key2"), {"foo2": "new_bar"});
                        });


                        it('set can handle dictionary values', async () =>
                        {
                            let storages = await user.storagesManager(type);
                            let storage = await storages.get(existingStorageId);
                            assert.ok(await storage.exist("test_key") === false);

                            let response = await checkSuccessCode(async () => await axios.request(
                                {
                                    method: 'post',
                                    url: toTestUrl("access"),
                                    data: {
                                        apiKey: storage.apiKey,
                                        secretKey: storage.secretKey,
                                        key: 'test_key',
                                        data: {"foo": "bar"},
                                        action: 'set'
                                    }
                                })
                            );

                            assert.deepEqual(response.data, {success: true});
                            assert.deepEqual(await storage.get("test_key"), {"foo": "bar"});

                            response = await checkSuccessCode(async () => await axios.request(
                                {
                                    method: 'post',
                                    url: toTestUrl("access"),
                                    data: {
                                        apiKey: storage.apiKey,
                                        secretKey: storage.secretKey,
                                        key: 'test_key',
                                        data: {},
                                        action: 'set'
                                    }
                                })
                            );

                            assert.deepEqual(response.data, {success: true});
                            assert.deepEqual(await storage.get("test_key"), {});
                        });

                        
                        it('set can handle array values', async () =>
                        {
                            let storages = await user.storagesManager(type);
                            let storage = await storages.get(existingStorageId);
                            assert.ok(await storage.exist("test_key") === false);

                            let response = await checkSuccessCode(async () => await axios.request(
                                {
                                    method: 'post',
                                    url: toTestUrl("access"),
                                    data: {
                                        apiKey: storage.apiKey,
                                        secretKey: storage.secretKey,
                                        key: 'test_key',
                                        data: ["foo", "bar"],
                                        action: 'set'
                                    }
                                })
                            );

                            assert.deepEqual(response.data, {success: true});
                            assert.deepEqual(await storage.get("test_key"), ["foo", "bar"]);
                            
                            response = await checkSuccessCode(async () => await axios.request(
                                {
                                    method: 'post',
                                    url: toTestUrl("access"),
                                    data: {
                                        apiKey: storage.apiKey,
                                        secretKey: storage.secretKey,
                                        key: 'test_key',
                                        data: [],
                                        action: 'set'
                                    }
                                })
                            );

                            assert.deepEqual(response.data, {success: true});
                            assert.deepEqual(await storage.get("test_key"), []);
                        });

                                                
                        it('set can handle numeric values', async () =>
                        {
                            let storages = await user.storagesManager(type);
                            let storage = await storages.get(existingStorageId);
                            assert.ok(await storage.exist("test_key") === false);

                            let response = await checkSuccessCode(async () => await axios.request(
                                {
                                    method: 'post',
                                    url: toTestUrl("access"),
                                    data: {
                                        apiKey: storage.apiKey,
                                        secretKey: storage.secretKey,
                                        key: 'test_key',
                                        data: 123,
                                        action: 'set'
                                    }
                                })
                            );

                            assert.deepEqual(response.data, {success: true});
                            assert.strictEqual(await storage.get("test_key"), 123);

                            response = await checkSuccessCode(async () => await axios.request(
                                {
                                    method: 'post',
                                    url: toTestUrl("access"),
                                    data: {
                                        apiKey: storage.apiKey,
                                        secretKey: storage.secretKey,
                                        key: 'test_key',
                                        data: -123,
                                        action: 'set'
                                    }
                                })
                            );

                            assert.deepEqual(response.data, {success: true});
                            assert.strictEqual(await storage.get("test_key"), -123);

                            response = await checkSuccessCode(async () => await axios.request(
                                {
                                    method: 'post',
                                    url: toTestUrl("access"),
                                    data: {
                                        apiKey: storage.apiKey,
                                        secretKey: storage.secretKey,
                                        key: 'test_key',
                                        data: 0,
                                        action: 'set'
                                    }
                                })
                            );

                            assert.deepEqual(response.data, {success: true});
                            assert.strictEqual(await storage.get("test_key"), 0);
                        });

                                                                        
                        it('set can handle boolean values', async () =>
                        {
                            let storages = await user.storagesManager(type);
                            let storage = await storages.get(existingStorageId);
                            assert.ok(await storage.exist("test_key") === false);
                                                        
                            let response = await checkSuccessCode(async () => await axios.request(
                                {
                                    method: 'post',
                                    url: toTestUrl("access"),
                                    data: {
                                        apiKey: storage.apiKey,
                                        secretKey: storage.secretKey,
                                        key: 'test_key',
                                        data: true,
                                        action: 'set'
                                    }
                                })
                            );

                            assert.deepEqual(response.data, {success: true});
                            assert.strictEqual(await storage.get("test_key"), true);
                                                                                    
                            response = await checkSuccessCode(async () => await axios.request(
                                {
                                    method: 'post',
                                    url: toTestUrl("access"),
                                    data: {
                                        apiKey: storage.apiKey,
                                        secretKey: storage.secretKey,
                                        key: 'test_key',
                                        data: false,
                                        action: 'set'
                                    }
                                })
                            );

                            assert.deepEqual(response.data, {success: true});
                            assert.strictEqual(await storage.get("test_key"), false);

                        });
                   
                                                                                                   
                        it('set can handle string values', async () =>
                        {
                            let storages = await user.storagesManager(type);
                            let storage = await storages.get(existingStorageId);
                            assert.ok(await storage.exist("test_key") === false);
                                                        
                            let response = await checkSuccessCode(async () => await axios.request(
                                {
                                    method: 'post',
                                    url: toTestUrl("access"),
                                    data: {
                                        apiKey: storage.apiKey,
                                        secretKey: storage.secretKey,
                                        key: 'test_key',
                                        data: "hello",
                                        action: 'set'
                                    }
                                })
                            );

                            assert.deepEqual(response.data, {success: true});
                            assert.strictEqual(await storage.get("test_key"), "hello");

                            response = await checkSuccessCode(async () => await axios.request(
                                {
                                    method: 'post',
                                    url: toTestUrl("access"),
                                    data: {
                                        apiKey: storage.apiKey,
                                        secretKey: storage.secretKey,
                                        key: 'test_key',
                                        data: "",
                                        action: 'set'
                                    }
                                })
                            );

                            assert.deepEqual(response.data, {success: true});
                            assert.strictEqual(await storage.get("test_key"), "");
                        });
                   
                                                                                                   
                        it('set can handle null', async () =>
                        {
                            let storages = await user.storagesManager(type);
                            let storage = await storages.get(existingStorageId);
                            assert.ok(await storage.exist("test_key") === false);
                                                        
                            let response = await checkSuccessCode(async () => await axios.request(
                                {
                                    method: 'post',
                                    url: toTestUrl("access"),
                                    data: {
                                        apiKey: storage.apiKey,
                                        secretKey: storage.secretKey,
                                        key: 'test_key',
                                        data: null,
                                        action: 'set'
                                    }
                                })
                            );

                            assert.deepEqual(response.data, {success: true});
                            assert.strictEqual(await storage.get("test_key"), null);
                        });


                        it('return 400 if missing key param from request', async () =>
                        {
                            let storages = await user.storagesManager(type);
                            let storage = await storages.get(existingStorageId);

                            await checkErrorCode(async () => await axios.request(
                                {
                                    method: 'post',
                                    url: toTestUrl("access"),
                                    data: {
                                        apiKey: storage.apiKey,
                                        secretKey: storage.secretKey,
                                        data: {"foo": "bar"},
                                        action: 'set'
                                    }
                                }), 400);
                        });

                        it('return 403 if missing secret key from request, even if readonly key is provided', async () =>
                        {
                            let storages = await user.storagesManager(type);
                            let storage = await storages.get(existingStorageId);

                            await checkErrorCode(async () => await axios.request(
                                {
                                    method: 'post',
                                    url: toTestUrl("access"),
                                    data: {
                                        apiKey: storage.apiKey,
                                        readonlyKey: storage.readonlyKey,
                                        key: 'test_key',
                                        data: {"foo": "bar"},
                                        action: 'set'
                                    }
                                }), 403);
                        });

                        it('return 400 if missing data param from request', async () =>
                        {
                            let storages = await user.storagesManager(type);
                            let storage = await storages.get(existingStorageId);

                            await checkErrorCode(async () => await axios.request(
                                {
                                    method: 'post',
                                    url: toTestUrl("access"),
                                    data: {
                                        apiKey: storage.apiKey,
                                        key: 'test_key',
                                        secretKey: storage.secretKey,
                                        action: 'set'
                                    }
                                }), 400);
                        });    
                    });

                    
                    describe('update', function() 
                    { 
                        it('update will create a new value if it doesn\'t exist', async () =>
                        {
                            let storages = await user.storagesManager(type);
                            let storage = await storages.get(existingStorageId);
                            assert.ok(await storage.exist("test_key") === false);

                            let response = await checkSuccessCode(async () => await axios.request(
                                {
                                    method: 'post',
                                    url: toTestUrl("access"),
                                    data: {
                                        apiKey: storage.apiKey,
                                        secretKey: storage.secretKey,
                                        key: 'test_key',
                                        data: {"foo": "bar"},
                                        action: 'update'
                                    }
                                })
                            );

                            assert.deepEqual(response.data, {success: true, data: {"foo": "bar"}, new: true});
                            assert.deepEqual(await storage.get("test_key"), {"foo": "bar"});
                        });

                        it('update will update a single key in existing value', async () =>
                        {
                            let storages = await user.storagesManager(type);
                            let storage = await storages.get(existingStorageId);
                            await storage.set("test_key", {"foo": "123", "hello": "world"});

                            let response = await checkSuccessCode(async () => await axios.request(
                                {
                                    method: 'post',
                                    url: toTestUrl("access"),
                                    data: {
                                        apiKey: storage.apiKey,
                                        secretKey: storage.secretKey,
                                        key: 'test_key',
                                        data: {"foo": "bar"},
                                        action: 'update'
                                    }
                                })
                            );

                            assert.deepEqual(response.data, {success: true, data: {"foo": "bar", "hello": "world"}, new: false});
                            assert.deepEqual(await storage.get("test_key"), {"foo": "bar", "hello": "world"});
                        });

                        it('update will return 400 if existing value is not a dictionary', async () =>
                        {
                            let storages = await user.storagesManager(type);
                            let storage = await storages.get(existingStorageId);

                            await storage.set("test_key", 123);
                            await checkErrorCode(async () => await axios.request(
                                {
                                    method: 'post',
                                    url: toTestUrl("access"),
                                    data: {
                                        apiKey: storage.apiKey,
                                        secretKey: storage.secretKey,
                                        key: 'test_key',
                                        data: {"foo": "bar"},
                                        action: 'update'
                                    }
                                }), 400
                            );

                            await storage.set("test_key", [1,2,3]);
                            await checkErrorCode(async () => await axios.request(
                                {
                                    method: 'post',
                                    url: toTestUrl("access"),
                                    data: {
                                        apiKey: storage.apiKey,
                                        secretKey: storage.secretKey,
                                        key: 'test_key',
                                        data: {"foo": "bar"},
                                        action: 'update'
                                    }
                                }), 400
                            );

                            await storage.set("test_key", "hello");
                            await checkErrorCode(async () => await axios.request(
                                {
                                    method: 'post',
                                    url: toTestUrl("access"),
                                    data: {
                                        apiKey: storage.apiKey,
                                        secretKey: storage.secretKey,
                                        key: 'test_key',
                                        data: {"foo": "bar"},
                                        action: 'update'
                                    }
                                }), 400
                            );
                        });

                        it('return 403 if missing secret key from request, even if readonly key is provided', async () =>
                        {
                            let storages = await user.storagesManager(type);
                            let storage = await storages.get(existingStorageId);

                            await checkErrorCode(async () => await axios.request(
                                {
                                    method: 'post',
                                    url: toTestUrl("access"),
                                    data: {
                                        apiKey: storage.apiKey,
                                        readonlyKey: storage.readonlyKey,
                                        key: 'test_key',
                                        data: {"foo": "bar"},
                                        action: 'update'
                                    }
                                }), 403);
                        });

                        it('return 400 if missing data param from request', async () =>
                        {
                            let storages = await user.storagesManager(type);
                            let storage = await storages.get(existingStorageId);

                            await checkErrorCode(async () => await axios.request(
                                {
                                    method: 'post',
                                    url: toTestUrl("access"),
                                    data: {
                                        apiKey: storage.apiKey,
                                        key: 'test_key',
                                        secretKey: storage.secretKey,
                                        action: 'update'
                                    }
                                }), 400);
                        }); 
                    });

                    describe('delete', function() 
                    { 
                        it('return success and delete value from storage if found', async () =>
                        {
                            let storages = await user.storagesManager(type);
                            let storage = await storages.get(existingStorageId);
                            await storage.set("test_key", {"foo": "bar"});
                            assert.strictEqual(await storage.exist("test_key"), true);

                            let response = await checkSuccessCode(async () => await axios.request(
                                {
                                    method: 'post',
                                    url: toTestUrl("access"),
                                    data: {
                                        apiKey: storage.apiKey,
                                        secretKey: storage.secretKey,
                                        key: 'test_key',
                                        action: 'delete'
                                    }
                                })
                            );

                            assert.deepEqual(response.data, {deleted: true, success: true});
                            assert.strictEqual(await storage.exist("test_key"), false);
                        });

                        it('return 403 if missing secret key from request, even if readonly key is provided', async () =>
                        {
                            let storages = await user.storagesManager(type);
                            let storage = await storages.get(existingStorageId);

                            await checkErrorCode(async () => await axios.request(
                                {
                                    method: 'post',
                                    url: toTestUrl("access"),
                                    data: {
                                        apiKey: storage.apiKey,
                                        readonlyKey: storage.readonlyKey,
                                        key: 'test_key',
                                        action: 'delete'
                                    }
                                }), 403);
                        });

                        it('return 404 if key to delete not found', async () =>
                        {
                            let storages = await user.storagesManager(type);
                            let storage = await storages.get(existingStorageId);
                            await storage.set("test_key", {"foo": "bar"});
                            assert.strictEqual(await storage.exist("test_key"), true);

                            await checkErrorCode(async () => await axios.request(
                                {
                                    method: 'post',
                                    url: toTestUrl("access"),
                                    data: {
                                        apiKey: storage.apiKey,
                                        secretKey: storage.secretKey,
                                        key: 'test_key_2',
                                        action: 'delete'
                                    }
                                }), 404
                            );
                        });

                        it('return 400 if missing key param from request', async () =>
                        {
                            let storages = await user.storagesManager(type);
                            let storage = await storages.get(existingStorageId);

                            await checkErrorCode(async () => await axios.request(
                                {
                                    method: 'post',
                                    url: toTestUrl("access"),
                                    data: {
                                        apiKey: storage.apiKey,
                                        secretKey: storage.secretKey,
                                        action: 'delete'
                                    }
                                }), 400);
                        });
                    });

                    describe('list', function() 
                    { 
                        it('return list of keys in storage', async () =>
                        {
                            let storages = await user.storagesManager(type);
                            let storage = await storages.get(existingStorageId);
                            await storage.set("test_key", {"foo": "bar"});
                            await storage.set("test_key_2", {"foo": "bar"});
                            await storage.set("foo", {"foo": "bar"});

                            let response = await checkSuccessCode(async () => await axios.request(
                                {
                                    method: 'post',
                                    url: toTestUrl("access"),
                                    data: {
                                        apiKey: storage.apiKey,
                                        secretKey: storage.secretKey,
                                        action: 'list'
                                    }
                                })
                            );

                            assert.strictEqual(response.data.success, true);
                            assert.deepEqual(response.data.keys.sort(), ["test_key", "test_key_2", "foo"].sort());
                        });

                        it('return list of keys in storage, using the readonly key', async () =>
                        {
                            let storages = await user.storagesManager(type);
                            let storage = await storages.get(existingStorageId);
                            await storage.purge();
                            await storage.set("test_key", {"foo": "bar"});
                            await storage.set("test_key_2", {"foo": "bar"});
                            await storage.set("foo", {"foo": "bar"});

                            let response = await checkSuccessCode(async () => await axios.request(
                                {
                                    method: 'post',
                                    url: toTestUrl("access"),
                                    data: {
                                        apiKey: storage.apiKey,
                                        readonlyKey: storage.readonlyKey,
                                        action: 'list'
                                    }
                                })
                            );

                            assert.strictEqual(response.data.success, true);
                            assert.deepEqual(response.data.keys.sort(), ["test_key", "test_key_2", "foo"].sort());
                        });
                    });

                    describe('purge', function() 
                    { 
                        it('delete all values from storage', async () =>
                        {
                            let storages = await user.storagesManager(type);
                            let storage = await storages.get(existingStorageId);
                            await storage.set("test_key", {"foo": "bar"});
                            await storage.set("test_key_2", {"foo": "bar"});
                            await storage.set("foo", {"foo": "bar"});
                            assert.deepEqual((await storage.list()).sort(), ["test_key", "test_key_2", "foo"].sort());

                            let response = await checkSuccessCode(async () => await axios.request(
                                {
                                    method: 'post',
                                    url: toTestUrl("access"),
                                    data: {
                                        apiKey: storage.apiKey,
                                        secretKey: storage.secretKey,
                                        action: 'purge'
                                    }
                                })
                            );

                            assert.deepEqual(response.data, {purged: true, success: true});
                            assert.deepEqual((await storage.list()).sort(), []);
                        });

                        it('return 403 if missing secret key from request, even if readonly key is provided', async () =>
                        {
                            let storages = await user.storagesManager(type);
                            let storage = await storages.get(existingStorageId);

                            await checkErrorCode(async () => await axios.request(
                                {
                                    method: 'post',
                                    url: toTestUrl("access"),
                                    data: {
                                        apiKey: storage.apiKey,
                                        readonlyKey: storage.readonlyKey,
                                        action: 'purge'
                                    }
                                }), 403);
                        });
                    });

                    describe('new_secret_key', function() 
                    { 
                        it('regenerate a new secret key', async () =>
                        {
                            let storages = await user.storagesManager(type);
                            let storage = await storages.get(existingStorageId);
                            let oldKey = storage.secretKey;

                            let response = await checkSuccessCode(async () => await axios.request(
                                {
                                    method: 'post',
                                    url: toTestUrl("access"),
                                    data: {
                                        apiKey: storage.apiKey,
                                        secretKey: storage.secretKey,
                                        action: 'new_secret_key'
                                    }
                                })
                            );

                            assert.deepEqual(response.data, {newSecretKey: storage.secretKey, success: true});
                            assert.notEqual(oldKey, storage.secretKey);
                        });

                        it('return 403 if missing secret key from request, even if readonly key is provided', async () =>
                        {
                            let storages = await user.storagesManager(type);
                            let storage = await storages.get(existingStorageId);

                            await checkErrorCode(async () => await axios.request(
                                {
                                    method: 'post',
                                    url: toTestUrl("access"),
                                    data: {
                                        apiKey: storage.apiKey,
                                        readonlyKey: storage.readonlyKey,
                                        action: 'new_secret_key'
                                    }
                                }), 403);
                        });
                    });

                    
                    describe('new_readonly_key', function() 
                    { 
                        it('regenerate a new readonly key', async () =>
                        {
                            let storages = await user.storagesManager(type);
                            let storage = await storages.get(existingStorageId);
                            let oldKey = storage.readonlyKey;

                            let response = await checkSuccessCode(async () => await axios.request(
                                {
                                    method: 'post',
                                    url: toTestUrl("access"),
                                    data: {
                                        apiKey: storage.apiKey,
                                        secretKey: storage.secretKey,
                                        action: 'new_readonly_key'
                                    }
                                })
                            );

                            assert.deepEqual(response.data, {newReadonlyKey: storage.readonlyKey, success: true});
                            assert.notEqual(oldKey, storage.readonlyKey);
                        });

                        it('return 403 if missing secret key from request, even if readonly key is provided', async () =>
                        {
                            let storages = await user.storagesManager(type);
                            let storage = await storages.get(existingStorageId);

                            await checkErrorCode(async () => await axios.request(
                                {
                                    method: 'post',
                                    url: toTestUrl("access"),
                                    data: {
                                        apiKey: storage.apiKey,
                                        readonlyKey: storage.readonlyKey,
                                        action: 'new_readonly_key'
                                    }
                                }), 403);
                        });
                    });


                    
                    describe('destroy', function() 
                    { 
                        it('deletes a whole storage', async () =>
                        {
                            let storages = await user.storagesManager(type);
                            let storage, _isNew
                            [storage, _isNew] = await storages.getOrCreate('new_storage');

                            let response = await checkSuccessCode(async () => await axios.request(
                                {
                                    method: 'post',
                                    url: toTestUrl("access"),
                                    data: {
                                        apiKey: storage.apiKey,
                                        secretKey: storage.secretKey,
                                        action: 'destroy'
                                    }
                                })
                            );

                            assert.deepEqual(response.data, {destroyed: true, success: true});
                            assert.strictEqual(await storages.exist('new_storage'), false);
                        });

                        it('return 403 if missing secret key from request, even if readonly key is provided', async () =>
                        {
                            let storages = await user.storagesManager(type);
                            let storage = await storages.get(existingStorageId);

                            await checkErrorCode(async () => await axios.request(
                                {
                                    method: 'post',
                                    url: toTestUrl("access"),
                                    data: {
                                        apiKey: storage.apiKey,
                                        readonlyKey: storage.readonlyKey,
                                        action: 'destroy'
                                    }
                                }), 403);
                        });
                    });

                });
            })(_types[_ti]);
        }
    });
});