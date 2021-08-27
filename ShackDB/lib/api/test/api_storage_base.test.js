/**
 * Test the storage api - base tests for all storage types.
 * |-- copyright and license --|
 * @package    ShackDB
 * @file       api_storage_base.test.js
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
const { Console } = require('console');

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
const {axios, toTestUrl, checkErrorCode, checkSuccessCode, addAuthToken} = require('./utils');

// users
var user, user2, admin;



/**
 * Method to generate all storage api tests for a given drivers type.
 * @param {Function} type storage type.
 */
 const generateStorageApiTests = (type) => {

    beforeEach(async () => {
        AuthManager.clearTokens();
        let _isNew;
        [user, _isNew] = await UsersManager.getOrCreate(userId, userDetails);
        [user2, _isNew] = await UsersManager.getOrCreate(userId + '_2', userDetails);
        [admin, _isNew] = await UsersManager.getOrCreate(adminId, adminDetails);
        await user.storagesManager(type).purge();
        await user.storagesManager(type).getOrCreate(existingStorageId);
    });

    describe('GET', function() 
    { 
        it('return list of storages of given type', async () =>
        {
            let storages = await user.storagesManager(type);

            let response = await checkSuccessCode(async () => await axios.request(
                addAuthToken({
                    method: 'get',
                    url: toTestUrl("storages/" + type),
                    data: {}
                }, user))
            );

            assert.ok(response.data.length > 0);
            assert.deepEqual(response.data, await storages.list());
        });
                
        it('return 401 if not logged in', async () =>
        {
            await checkErrorCode(async () => await axios.request(
                {
                    method: 'get',
                    url: toTestUrl("storages/" + type),
                    data: {}
                })
            , 401);
        });
    });

    describe('DELETE', function() 
    { 
        it('delete all storages of a given type', async () =>
        {
            let storages = await user.storagesManager(type);
            let existedBefore = await storages.list();
            assert.ok(existedBefore.length > 0);

            let response = await checkSuccessCode(async () => await axios.request(
                addAuthToken({
                    method: 'delete',
                    url: toTestUrl("storages/" + type),
                    data: {}
                }, user))
            );

            assert.deepEqual(await storages.list(), []);
        });
        
        it('return 401 if not logged in', async () =>
        {
            await checkErrorCode(async () => await axios.request(
                {
                    method: 'delete',
                    url: toTestUrl("storages/" + type),
                    data: {}
                })
            , 401);
        });
    });

    describe('<id> GET', function() 
    { 
        it('return storage keys', async () =>
        {
            let storage = await user.storagesManager(type).get(existingStorageId);
            await storage.set("test", {});
            await storage.set("foo", {});
            await storage.set("bar", {});

            let response = await checkSuccessCode(async () => await axios.request(
                addAuthToken({
                    method: 'get',
                    url: toTestUrl("storages/" + type + '/' + existingStorageId),
                    data: {}
                }, user))
            );

            assert.deepEqual(response.data, await storage.list());
        });

        it('return 401 if not logged in', async () =>
        {
            await checkErrorCode(async () => await axios.request(
                {
                    method: 'get',
                    url: toTestUrl("storages/" + type + '/' + existingStorageId),
                    data: {}
                })
            , 401);
        });

        it('return 404 if storage id is not found', async () =>
        {
            // wrong user
            await checkErrorCode(async () => await axios.request(
                addAuthToken({
                    method: 'get',
                    url: toTestUrl("storages/" + type + '/' + existingStorageId),
                    data: {}
                }, user2))
            , 404);

            // wrong storage id
            await checkErrorCode(async () => await axios.request(
                addAuthToken({
                    method: 'get',
                    url: toTestUrl("storages/" + type + '/' + existingStorageId + '_2'),
                    data: {}
                }, user))
            , 404);
        }); 
    });

    describe('<id> HEAD', function() 
    { 
        it('return get header if storage exist', async () =>
        {
            await checkSuccessCode(async () => await axios.request(
                addAuthToken({
                    method: 'head',
                    url: toTestUrl("storages/" + type + '/' + existingStorageId),
                    data: {}
                }, user))
            );
        });

        it('return 401 if not logged in', async () =>
        {
            await checkErrorCode(async () => await axios.request(
                {
                    method: 'head',
                    url: toTestUrl("storages/" + type + '/' + existingStorageId),
                    data: {}
                })
            , 401);
        });

        it('return 404 if storage id is not found', async () =>
        {
            // wrong user
            await checkErrorCode(async () => await axios.request(
                addAuthToken({
                    method: 'head',
                    url: toTestUrl("storages/" + type + '/' + existingStorageId),
                    data: {}
                }, user2))
            , 404);

            // wrong storage id
            await checkErrorCode(async () => await axios.request(
                addAuthToken({
                    method: 'head',
                    url: toTestUrl("storages/" + type + '/' + existingStorageId + '_2'),
                    data: {}
                }, user))
            , 404);
        }); 
    });

    describe('<id> DELETE', function() 
    { 
        it('delete storage and return 200 when storage found under the logged in user', async () =>
        {
            await checkSuccessCode(async () => await axios.request(
                addAuthToken({
                    method: 'get',
                    url: toTestUrl("storages/" + type + '/' + existingStorageId),
                    data: {}
                }, user))
            );

            await checkSuccessCode(async () => await axios.request(
                addAuthToken({
                    method: 'delete',
                    url: toTestUrl("storages/" + type + '/' + existingStorageId),
                    data: {}
                }, user))
            );

            await checkErrorCode(async () => await axios.request(
                addAuthToken({
                    method: 'get',
                    url: toTestUrl("storages/" + type + '/' + existingStorageId),
                    data: {}
                }, user))
            , 404);
        });

        it('return 401 if not logged in', async () =>
        {
            await checkErrorCode(async () => await axios.request(
                {
                    method: 'delete',
                    url: toTestUrl("storages/" + type + '/' + existingStorageId),
                    data: {}
                }), 401
            );
        });

        it('return 404 if storage id is not found', async () =>
        {
            // wrong user
            await checkErrorCode(async () => await axios.request(
                addAuthToken({
                    method: 'delete',
                    url: toTestUrl("storages/" + type + '/' + existingStorageId),
                    data: {}
                }, user2))
            , 404);

            // wrong storage id
            await checkErrorCode(async () => await axios.request(
                addAuthToken({
                    method: 'delete',
                    url: toTestUrl("storages/" + type + '/' + existingStorageId + "_new1234"),
                    data: {}
                }, user))
            , 404);
        }); 
    });

    describe('<id> POST', function() 
    { 
        it('create new storage and return 200 if logged in', async () =>
        {
            await checkSuccessCode(async () => await axios.request(
                addAuthToken({
                    method: 'post',
                    url: toTestUrl("storages/" + type + "/new_storage"),
                    data: {}
                }, user))
            );

            await checkSuccessCode(async () => await axios.request(
                addAuthToken({
                    method: 'get',
                    url: toTestUrl("storages/" + type + "/new_storage"),
                    data: {}
                }, user))
            );
        });

        it('return 401 if not logged in', async () =>
        {
            await checkErrorCode(async () => await axios.request(
                {
                    method: 'post',
                    url: toTestUrl("storages/" + type + "/new_storage"),
                    data: {}
                }), 401);
        });

        it('return 400 if storage id is invalid', async () =>
        {
            await checkErrorCode(async () => await axios.request(
                addAuthToken({
                    method: 'post',
                    url: toTestUrl("storages/" + type + "/new_s>torage?"),
                    data: {}
                }, user)), 
                400);
        }); 

        it('return 409 if storage by this name already exist', async () =>
        {
            await checkSuccessCode(async () => await axios.request(
                addAuthToken({
                    method: 'post',
                    url: toTestUrl("storages/" + type + "/new_storage"),
                    data: {}
                }, user))
            );

            await checkErrorCode(async () => await axios.request(
                addAuthToken({
                    method: 'post',
                    url: toTestUrl("storages/" + type + "/new_storage"),
                    data: {}
                }, user)), 
                409);
        });
    });
}

// export tests generator
module.exports = generateStorageApiTests;