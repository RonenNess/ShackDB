/**
 * Test the auth api.
 * |-- copyright and license --|
 * @package    ShackDB
 * @file       auth.test.js
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

// get classes we need for tests
const config = require('../../config');
const {UsersManager, IUser} = require('../../users');
const AuthManager = require('../lib/auth_manager');

// user instance for tests
let user;


// test auth api
describe('AuthManager', function() 
{
    beforeEach(async () => {
        let _isNew;
        [user, _isNew] = await UsersManager.getOrCreate("user_id", {email: "test@gmail.com", password: "123456"});
    });

    describe('#authenticate()', function() 
    { 
        it('return user when given correct username and password', async () =>
        {
            let retUser = await AuthManager.authenticate("user_id", "123456");
            assert.ok(retUser instanceof IUser);
        });
        
        it('reject when provided with wrong username or password', async () =>
        {
            await assert.rejects(AuthManager.authenticate("user_id", "1234567"));
            await assert.rejects(AuthManager.authenticate("user_id2", "123456"));
            await assert.rejects(AuthManager.authenticate("user_id2", "1234567"));
        });
        
        it('throw exception when not provided with username or password', async () =>
        {
            assert.throws(() => AuthManager.authenticate() );
            assert.throws(() => AuthManager.authenticate("user_id") );
        });
    });
    
    describe('#userToToken()', function() 
    { 
        it('return a valid authentication token when provided with a user', async () =>
        {
            let token = AuthManager.userToToken(user, "127.0.0.1");
            assert.ok(token);
            assert.ok(token.length > 8);
        });

        it('return the same token unless clear is called', async () =>
        {
            let token1 = AuthManager.userToToken(user, "127.0.0.1");
            assert.ok(token1);
            let token2 = AuthManager.userToToken(user, "127.0.0.1");
            assert.ok(token2);
            assert.strictEqual(token1, token2);
        });

        it('throw error if given invalid user value or missing source', async () =>
        {
            assert.throws(() => AuthManager.userToToken("test", "127.0.0.1"));
            assert.throws(() => AuthManager.userToToken(null, "127.0.0.1"));
            assert.throws(() => AuthManager.userToToken(user));
            assert.throws(() => AuthManager.userToToken());
        });
    });
        
    describe('#tokenToUser()', function() 
    { 
        it('return a user when provided with a valid token', async () =>
        {
            let token = AuthManager.userToToken(user, "127.0.0.1");
            let retrieveUser = AuthManager.tokenToUser(token, "127.0.0.1");
            assert.strictEqual(user, retrieveUser);
        });
                
        it('return null if token not found', async () =>
        {
            let retrieveUser = AuthManager.tokenToUser("123456", "127.0.0.1");
            assert.strictEqual(null, retrieveUser);
        });

        it('throw error if given invalid token value', async () =>
        {
            assert.throws(() => AuthManager.tokenToUser() );
            assert.throws(() => AuthManager.tokenToUser(null, "127.0.0.1") );
        });
    });
        
    describe('#clearTokens()', function() 
    { 
        it('make all existing tokens no longer valid', async () =>
        {
            let token = AuthManager.userToToken(user, "127.0.0.1");
            let retrieveUser = AuthManager.tokenToUser(token, "127.0.0.1");
            assert.strictEqual(user, retrieveUser);

            AuthManager.clearTokens();
            let retrieveUser2 = AuthManager.tokenToUser(token, "127.0.0.1");
            assert.strictEqual(null, retrieveUser2);
        });
    });
});