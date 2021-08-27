/**
 * Test the users api.
 * |-- copyright and license --|
 * @package    ShackDB
 * @file       api_users.test.js
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

// to create test users
const { AuthManager } = require('../../auth');
const { UsersManager } = require('../../users');
const userId = 'user_id';
const adminId = 'admin_id';
const userDetails = {email:"test@gmail.com", "password": "123456"};
const adminDetails = {email:"admin@gmail.com", "password": "123456", "superuser": true};


// get utility methods
const {axios, toTestUrl, checkErrorCode, addAuthToken} = require('./utils');

// user and admin for tests
var user, admin;


// test users api
describe(config.server.apiUrl, function() 
{
    beforeEach(async () => {
        AuthManager.clearTokens();
        let _isNew;
        [user, _isNew] = await UsersManager.getOrCreate(userId, userDetails);
        [admin, _isNew] = await UsersManager.getOrCreate(adminId, adminDetails);
    });

    describe('users/', function() 
    {
        describe('GET', function() 
        { 
            it('return 200 and users list if logged in as admin', async () =>
            {
                let response = await axios.request(
                    addAuthToken({
                        method: 'get',
                        url: toTestUrl("users"),
                    }, admin));
                let data = response.data;
                assert.deepEqual(data.sort(), ["admin_id", "user_id"].sort());
            });

            it('return 401 if not logged in as admin', async () =>
            {
                await checkErrorCode(async () => await axios.get(toTestUrl("users")), 401);
                await checkErrorCode(async () => await axios.request(
                    addAuthToken({
                        method: 'get',
                        url: toTestUrl("users"),
                    }, user)), 401);
            });
        });

        describe('<username> GET', function() 
        { 
            it('return 404 when the user is not found', async () =>
            {
                await checkErrorCode(async () => await axios.request(
                    addAuthToken({
                        method: 'get',
                        url: toTestUrl("users/wrong_id"),
                    }, admin)), 404);
            });

            it('return 200 and user details when the user is found and is logged in', async () =>
            {
                let response = await axios.request(
                    addAuthToken({
                        method: 'get',
                        url: toTestUrl("users/" + userId),
                    }, user));
                let data = response.data;
                assert.strictEqual(data.email, userDetails.email);
                assert.strictEqual(data.enabled, true);
            });
            
            it('return 200 and user details when the user is found and logged in as admin', async () =>
            {
                let response = await axios.request(
                    addAuthToken({
                        method: 'get',
                        url: toTestUrl("users/" + userId),
                    }, admin));
                let data = response.data;
                assert.strictEqual(data.email, userDetails.email);
            });

            it('return 401 if not logged in as admin nor as the requested user', async () =>
            {
                await checkErrorCode(async () => await axios.get(toTestUrl("users/" + userId)), 401);
            });
        });
        
        describe('<username> HEAD', function() 
        { 
            it('return 404 when the user is not found', async () =>
            {
                await checkErrorCode(async () => await axios.request(
                    addAuthToken({
                        method: 'head',
                        url: toTestUrl("users/wrong_id"),
                    }, admin)), 404);
            });

            it('return 200 when the user is found and is logged in', async () =>
            {
                let response = await axios.request(
                    addAuthToken({
                        method: 'head',
                        url: toTestUrl("users/" + userId),
                    }, user));
            });
            
            it('return 200 when the user is found and logged in as admin', async () =>
            {
                let response = await axios.request(
                    addAuthToken({
                        method: 'head',
                        url: toTestUrl("users/" + userId),
                    }, admin));
            });

            it('return 401 if not logged in as admin nor as the requested user', async () =>
            {
                await checkErrorCode(async () => await axios.head(toTestUrl("users/" + userId)), 401);
            });
        });


         
        describe('<username> DELETE', function() 
        { 
            it('return 404 when the user is not found', async () =>
            {
                await checkErrorCode(async () => await axios.request(
                    addAuthToken({
                        method: 'delete',
                        url: toTestUrl("users/wrong_id"),
                    }, admin)), 404);
            });

            it('return 200 and delete the user when the user is found and logged in', async () =>
            {
                let newUser = await UsersManager.create('temp_user', userDetails);
                assert.strictEqual(await UsersManager.exist('temp_user'), true);

                await axios.request(
                    addAuthToken({
                        method: 'delete',
                        url: toTestUrl("users/" + 'temp_user'),
                    }, newUser));

                assert.strictEqual(await UsersManager.exist('temp_user'), false);
            });
            
            it('return 200 and delete the user when the user is found and source is logged in as admin', async () =>
            {
                let newUser = await UsersManager.create('temp_user', userDetails);
                assert.strictEqual(await UsersManager.exist('temp_user'), true);

                await axios.request(
                    addAuthToken({
                        method: 'delete',
                        url: toTestUrl("users/" + 'temp_user'),
                    }, admin));

                assert.strictEqual(await UsersManager.exist('temp_user'), false);
            });
            
            it('return 401 if not logged in as current user nor admin', async () =>
            {
                await UsersManager.create('temp_user', userDetails);
                assert.strictEqual(await UsersManager.exist('temp_user'), true);

                checkErrorCode(async () => await axios.request(
                    addAuthToken({
                        method: 'delete',
                        url: toTestUrl("users/" + 'temp_user'),
                    }, user)), 401);

                assert.strictEqual(await UsersManager.exist('temp_user'), true);
                await UsersManager.delete('temp_user');
            });

            it('return 401 if not logged in as admin nor as the requested user', async () =>
            {
                await checkErrorCode(async () => await axios.delete(toTestUrl("users/" + userId)), 401);
            });
        });

        describe('<username> POST', function() 
        { 
            it("return 200 and create user successfully when details are valid and user don't exist", async () =>
            {
                let response = await axios.request(
                    addAuthToken({
                        method: 'post',
                        url: toTestUrl("users/" + userId + '_new'),
                        data: {email:"test_new@gmail.com", "password": "123456"}
                    }, admin));
                assert.strictEqual(response.status, 200);

                response = await axios.request(
                    addAuthToken({
                        method: 'get',
                        url: toTestUrl("users/" + userId + '_new'),
                    }, admin));
                let data = response.data;
                assert.strictEqual(data.email, "test_new@gmail.com");
            });
                        
            it('return 409 if user id already exists', async () =>
            {
                await checkErrorCode(async () => await axios.request(
                    addAuthToken({
                        method: 'post',
                        url: toTestUrl("users/" + userId ),
                        data: {email:"test_new@gmail.com", "password": "123456"}
                    }, admin)), 409);
            });
                        
            it('return 401 if must be admin to create user and not logged in as admin', async () =>
            {
                config.security.mustBeAdminToCreateUser = true;

                await checkErrorCode(async () => await axios.request(
                    addAuthToken({
                        method: 'post',
                        url: toTestUrl("users/" + userId + '123' ),
                        data: {email:"test_new@gmail.com", "password": "123456"}
                    }, user)), 401);

                await checkErrorCode(async () => await axios.request(
                    {
                        method: 'post',
                        url: toTestUrl("users/" + userId + '12345' ),
                        data: {email:"test_new@gmail.com", "password": "123456"}
                    }), 401);

                config.security.mustBeAdminToCreateUser = false;
            });

            it('return 400 if missing or invalid params', async () =>
            {
                await checkErrorCode(async () => await axios.request(
                    addAuthToken({
                        method: 'post',
                        url: toTestUrl("users/" + userId + 'new' ),
                        data: {email:"test_new@gmail.com"}
                    }, admin)), 400);
                 
                await checkErrorCode(async () => await axios.request(
                    addAuthToken({
                        method: 'post',
                        url: toTestUrl("users/" + userId + 'new' ),
                        data: {email:"illegalemail.com", "password": "123456"}
                    }, admin)), 400);
            });
        });
    });
});