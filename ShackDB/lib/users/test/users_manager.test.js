/**
 * Test the users manager class.
 * |-- copyright and license --|
 * @package    ShackDB
 * @file       users_manager.test.js
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
const IUser = require('../lib/user.interface');

// new user details
const userDetails = {email:"test@gmail.com", password: "123456", superuser: false};
const userDetailsNoPassword = {email:"test@gmail.com", superuser: false};


// test users manager
describe('UsersManager', function() 
{
    beforeEach(async () => {
        await usersManager.purge();
    });

    describe('#exist()', function() 
    { 
        it('return false when the user is not present', async () =>
        {
            let exist = await usersManager.exist('user_id');
            assert.strictEqual(exist, false);
        });

        it('return true when the user is present', async () =>
        {
            assert.ok(await usersManager.create('user_id', userDetails) instanceof IUser);
            assert.ok(await usersManager.exist('user_id'));
            await usersManager.purge();
        });
        
        it("throw exception when id is not provided", async () =>
        {
            assert.throws(() => usersManager.exist());
        });
    });
    
    describe('#list()', function() 
    {
        it("list all existing users", async () =>
        {
            assert.deepEqual(await usersManager.list(), []);
            await usersManager.create('user_1', userDetails);
            await usersManager.create('user_2', userDetails);
            await usersManager.create('user_3', userDetails);
            assert.deepEqual((await usersManager.list()).sort(), ['user_1', 'user_2', 'user_3'].sort());
        });
    });

    describe('#get()', function() 
    {
        it("throw error (reject) when the user is not present", async () =>
        {
            await usersManager.create('wrong_id', userDetails);
            await assert.rejects(usersManager.get('user_id'));
        });

        it("return a user instance when the user is present", async () =>
        {
            await usersManager.create('user_id', userDetails);
            assert.ok(await usersManager.get('user_id') instanceof IUser);
        });

        it("throw exception when id is not provided", async () => 
        {
            assert.throws(() => usersManager.get());
        });

    });

    describe('#update()', function() 
    {
        it("update user details and update cache", async () =>
        {
            await usersManager.create('user_id', userDetails);
            let user = await usersManager.get('user_id');

            assert.ok(user instanceof IUser);
            assert.strictEqual(user.data.email, userDetailsNoPassword.email);

            await usersManager.update('user_id', {email: "newemail@gmail.com", superuser: true});
            user = await usersManager.get('user_id');
            assert.strictEqual(user.data.email, "newemail@gmail.com");
            assert.strictEqual(user.data.superuser, true);
        });

        it("throw exception when id or data is not provided", async () => 
        {
            assert.throws(() => usersManager.update());
            assert.throws(() => usersManager.update('user_id'));
        });

        it("reject when user is not found", async () => 
        {
            await assert.rejects(usersManager.update('not_found_user', {}));
        });
    });

    describe('#delete()', function() 
    {
        it("return false when deleting a user that doesn't exist", async () => 
        {
            await usersManager.create('wrong_id', userDetails);
            await assert.rejects(usersManager.delete('user_id'));
        });

        it("delete user and return true when successfully deleting a user", async () =>
        {
            await usersManager.create('user_id', userDetails);
            assert.strictEqual(await usersManager.exist('user_id'), true);
            assert.ok(await usersManager.delete('user_id'));
            assert.strictEqual(await usersManager.exist('user_id'), false);
        });
        
        it("throw exception when id is not provided", async () =>
        {
            assert.throws(() => usersManager.delete() );
        });
    });

    describe('#create()', function() 
    {
        it('reject if user already exists', async () =>
        {
            assert.strictEqual(await usersManager.exist('user_id'), false);
            await usersManager.create('user_id', userDetails);
            assert.strictEqual(await usersManager.exist('user_id'), true);
            
            let user = await usersManager.get('user_id');
            assert.strictEqual(user.data.email, userDetailsNoPassword.email);

            await assert.rejects(usersManager.create('user_id', userDetails));
            await usersManager.purge();
        });

        it('create user and return the user instance on successful call', async () =>
        {
            assert.ok(await usersManager.create('user_id', userDetails) instanceof IUser);
            assert.strictEqual(await usersManager.exist('user_id'), true);
            await usersManager.purge();
        });

        it("throw exception when id is not provided", async () =>
        {
            assert.throws(() => usersManager.create());
        });
    });

    describe('#getOrCreate()', function() 
    {
        it('return an existing user instance if user is found', async () =>
        {
            let origUser = await usersManager.create('user_id', userDetails);
            let [user, isNew] = await usersManager.getOrCreate('user_id', userDetails);
            assert.strictEqual(user, origUser);
            assert.strictEqual(isNew, false);
            
            user = await usersManager.get('user_id');
            assert.strictEqual(user.data.email, userDetailsNoPassword.email);

            usersManager.clearCache();
            [user, isNew] = await usersManager.getOrCreate('user_id', userDetails);
            assert.strictEqual(isNew, false);
        });

        it('return a new user instance if user is not found', async () =>
        {
            assert.strictEqual(await usersManager.exist('user_id'), false);
            let [user, isNew] = await usersManager.getOrCreate('user_id', userDetails);
            assert.ok(user instanceof IUser);
            assert.strictEqual(isNew, true);
            assert.strictEqual(await usersManager.exist('user_id'), true);
        });

        it("throw exception when id or data are not provided", () =>
        {
            assert.throws(() => { usersManager.getOrCreate() });
            assert.throws(() => { usersManager.getOrCreate('id') });
        });
    });

    describe('#purge()', function() 
    {
        it('delete all user instances', async () =>
        {
            assert.ok(await usersManager.create('user_id', userDetails) instanceof IUser);
            assert.strictEqual(await usersManager.exist('user_id'), true);
            await usersManager.purge();
            assert.strictEqual(await usersManager.exist('user_id'), false);
        });
    });

});