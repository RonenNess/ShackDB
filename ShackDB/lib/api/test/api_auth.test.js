/**
 * Test the auth api.
 * |-- copyright and license --|
 * @package    ShackDB
 * @file       api_auth.test.js
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
const userDetails = {email:"test@gmail.com", "password": "123456"};


// get utility methods
const {axios, toTestUrl, checkErrorCode, checkSuccessCode, extractTokenFromCookieHeader, addAuthToken} = require('./utils');
const ApiAuth = require('../lib/api_auth');


// test auth api
describe(config.server.apiUrl, function() 
{

    beforeEach(async () => {
        AuthManager.clearTokens();
        let _isNew;
        [user, _isNew] = await UsersManager.getOrCreate(userId, userDetails);
        ApiAuth.clearLockedAccounts();
    });

    describe('auth/', function() 
    {

        describe('login POST', function() 
        { 
            it('return 200 and set authentication token when successfully login', async () =>
            {
                let oldSign = config.security.signCookies;
                config.security.signCookies = false;
                let response = await checkSuccessCode(async () => await axios.post(toTestUrl("auth/login"), {username: userId, password: userDetails.password}));
                let token = AuthManager.userToToken(user, "127.0.0.1");
                let resToken = extractTokenFromCookieHeader(response);
                assert.strictEqual(token, resToken);
                config.security.signCookies = oldSign;
            });
            
            it('return 400 if missing user id or password in request', async () =>
            {
                await checkErrorCode(async () => await axios.post(toTestUrl("auth/login"), {}), 400);
                await checkErrorCode(async () => await axios.post(toTestUrl("auth/login"), {username: userId}), 400);
                await checkErrorCode(async () => await axios.post(toTestUrl("auth/login"), {password: userDetails.password}), 400);
            });
            
            it('return 401 when the user is not found', async () =>
            {
                await checkErrorCode(async () => await axios.post(toTestUrl("auth/login"), {username: userId + '2', password: userDetails.password}), 401);
            });

            it('return 401 if password is wrong', async () =>
            {
                await checkErrorCode(async () => await axios.post(toTestUrl("auth/login"), {username: userId, password: userDetails.password + '2'}), 401);
            });
            
            it('lock user and return 429 code after too many failed attempts', async () =>
            {
                for (let i = 0; i < config.security.maxFailedLoginAttempts + 1; ++i) {
                    await checkErrorCode(async () => await axios.post(toTestUrl("auth/login"), {username: userId, password: userDetails.password + '2'}), 401);
                }
                await checkErrorCode(async () => await axios.post(toTestUrl("auth/login"), {username: userId, password: userDetails.password + '2'}), 429);
            });
        });
        
        describe('logout POST', function() 
        { 
            it("return 200 and logout if currently logged in", async () =>
            {
                // login
                await checkSuccessCode(async () => await axios.post(toTestUrl("auth/login"), {username: userId, password: userDetails.password}));

                // logout with token
                response = await checkSuccessCode(async () => await axios.request(
                addAuthToken({
                    method: 'post',
                    url: toTestUrl("auth/logout"),
                }, user)));

                // make sure lost the auth cookie
                let resToken = extractTokenFromCookieHeader(response);
                assert.strictEqual(null, resToken);
            });
            
            it('return 400 if not logged in', async () =>
            {
                await checkErrorCode(async () => await axios.post(toTestUrl("auth/logout")), 400);
            });
        });
    });
});