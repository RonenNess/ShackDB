/**
 * Test the users class.
 * |-- copyright and license --|
 * @package    ShackDB
 * @file       user.test.js
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

// get main classes to test
const usersManager = require('../lib/users_manager');
const { StoragesManager } = require('../../storage');
const appConfig = require('../../config');

// new user details
const userDetails = {email:"test@gmail.com", "password": "123456"};

// user instance for tests
let user;

// test users manager
describe('User', function() 
{
    beforeEach(async () => {
        await usersManager.purge();
        let _isNew;
        [user, _isNew] = await usersManager.getOrCreate('user_id', userDetails);
    });

    describe('#email', function() 
    {
        it("return the user's email", async () =>
        {
            assert.strictEqual(user.email, userDetails.email);
        });
    });

    describe('#id', function() 
    {
        it("return the user's id", async () =>
        {
            assert.strictEqual(user.id, 'user_id');
        });
    });

    describe('#storagesManager', function() 
    {
        it("return the user's Storages Manager instance", async () =>
        {
            assert.ok(user.storagesManager(appConfig.defaultStorageType) instanceof StoragesManager);
        });

        it("have unique root for different users", async () =>
        {
            let otherUser = await usersManager.create('other_user', {password: 'foo', email: 'bar'});
            assert.notEqual(user.storagesManager(), otherUser.storagesManager());
            assert.notEqual(user.storagesManager().root, otherUser.storagesManager().root);
        });
    });

    describe('#authenticate()', function() 
    {
        it("return true if provided the right password", async () =>
        {
            assert.strictEqual(user.authenticate(userDetails.password), true);
        });

        it("return false if provided a wrong password", async () =>
        {
            assert.strictEqual(user.authenticate("wrong!"), false);
        });
    });
});