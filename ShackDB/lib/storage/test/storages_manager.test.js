/**
 * Test the storages manager class.
 * |-- copyright and license --|
 * @package    ShackDB
 * @file       storages_manager.test.js
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
const StoragesManager = require('../lib/storages_manager');
const IStorage = require('../lib/storage.interface');

// create storages manager class on test folder
const config = require('../../config');
const storagesManager = new StoragesManager(config.paths.storagesDataRoot);


// test storages manager
describe('StoragesManager', function() 
{
    beforeEach(async () => {
        await storagesManager.purge();
    });

    describe('#exist()', function() 
    { 
        it('return false when the storage is not present', async () =>
        {
            let exist = await storagesManager.exist('storage_id');
            assert.strictEqual(exist, false);
        });

        it('return true when the storage is present', async () =>
        {
            assert.ok(await storagesManager.create('storage_id') instanceof IStorage);
            assert.ok(await storagesManager.exist('storage_id'));
            await storagesManager.purge();
        });
        
        it("throw exception when id is not provided",async () =>
        {
            assert.throws(() => storagesManager.exist());
        });
    });
    
    describe('#list()', function() 
    {
        it("list all existing storages", async () =>
        {
            assert.deepEqual(await storagesManager.list(), []);
            await storagesManager.create('storage_1');
            await storagesManager.create('storage_2');
            await storagesManager.create('storage_3');
            assert.deepEqual((await storagesManager.list()).sort(), ['storage_1', 'storage_2', 'storage_3'].sort());
        });
    });

    describe('#get()', function() 
    {
        it("throw error (reject) when the storage is not present", async () =>
        {
            await storagesManager.create('wrong_id');
            await assert.rejects(storagesManager.get('storage_id'));
        });

        it("return a storage instance when the storage is present", async () =>
        {
            await storagesManager.create('storage_id');
            assert.ok(await storagesManager.get('storage_id') instanceof IStorage);
        });

        it("throw exception when id is not provided", async () => 
        {
            assert.throws(() => storagesManager.get());
        });

    });

    describe('#delete()', function() 
    {
        it("return false when deleting a storage that doesn't exist", async () => 
        {
            await storagesManager.create('wrong_id');
            await assert.rejects(storagesManager.delete('storage_id'));
        });

        it("delete storage and return true when successfully deleting a storage", async () =>
        {
            await storagesManager.create('storage_id');
            assert.strictEqual(await storagesManager.exist('storage_id'), true);
            assert.ok(await storagesManager.delete('storage_id'));
            assert.strictEqual(await storagesManager.exist('storage_id'), false);
        });
        
        it("throw exception when id is not provided", async () =>
        {
            assert.throws(() => storagesManager.delete() );
        });
    });

    describe('#create()', function() 
    {
        it('reject if storage already exists', async () =>
        {
            assert.strictEqual(await storagesManager.exist('storage_id'), false);
            await storagesManager.create('storage_id');
            assert.strictEqual(await storagesManager.exist('storage_id'), true);
            await assert.rejects(storagesManager.create('storage_id'));
            await storagesManager.purge();
        });

        it('create storage and return the storage instance on successful call', async () =>
        {
            assert.ok(await storagesManager.create('storage_id') instanceof IStorage);
            assert.strictEqual(await storagesManager.exist('storage_id'), true);
            await storagesManager.purge();
        });

        it("throw exception on illegal id", async () => 
        {
            assert.throws(() => storagesManager.create("?/.\\"),);
            assert.throws(() => storagesManager.create("?"),);
        });

        it("throw exception when id is not provided", async () =>
        {
            assert.throws(() => storagesManager.create());
        });
    });

    describe('#getOrCreate()', function() 
    {
        it('return an existing storage instance if storage is found', async () =>
        {
            let origStorage = await storagesManager.create('storage_id');
            let [storage, isNew] = await storagesManager.getOrCreate('storage_id');
            assert.strictEqual(storage, origStorage);
            assert.strictEqual(isNew, false);

            storagesManager.clearCache();
            [storage, isNew] = await storagesManager.getOrCreate('storage_id');
            assert.strictEqual(isNew, false);
        });

        it('return a new storage instance if storage is not found', async () =>
        {
            assert.strictEqual(await storagesManager.exist('storage_id'), false);
            let [user, isNew] = await storagesManager.getOrCreate('storage_id');
            assert.ok(user instanceof IStorage);
            assert.strictEqual(isNew, true);
            assert.strictEqual(await storagesManager.exist('storage_id'), true);
        });

        it("throw exception when id is not provided", () =>
        {
            assert.throws(() => { storagesManager.getOrCreate() });
        });
    });

    describe('#purge()', function() 
    {
        it('delete all storage instances', async () =>
        {
            assert.ok(await storagesManager.create('storage_id') instanceof IStorage);
            assert.strictEqual(await storagesManager.exist('storage_id'), true);
            await storagesManager.purge();
            assert.strictEqual(await storagesManager.exist('storage_id'), false);
        });
    });

});