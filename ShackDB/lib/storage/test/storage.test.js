/**
 * Test the storage class.
 * |-- copyright and license --|
 * @package    ShackDB
 * @file       storage.test.js
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

// create storages manager class on test folder
const config = require('../../config');

// storage instance
let storage;

for (let storageType in config.storageDriversGenerator) {

    const storagesManager = new StoragesManager(config.paths.storagesDataRoot, storageType);

    (function(storageType, storagesManager) {

        // test storages manager
        describe('Storage [' + storageType + ']', function() 
        {
            // perform a strict exist check for key, using assert
            async function strictExist(key, shouldExist) {
                let exist = await storage.exist(key);
                assert.strictEqual(exist, Boolean(shouldExist));
            }

            beforeEach(async () => {
                await storagesManager.purge();
                let isNew;
                [storage, isNew] = await storagesManager.getOrCreate('storage_id');
                storage.storeValuesMd = false;
            });

            describe('#exist()', function() 
            { 
                it('return false when the key is not present', async () =>
                {
                    await strictExist('some_key', false);
                });

                it('return true when the key is present', async () =>
                {
                    assert.ok(await storage.set('some_key', {}));
                    await strictExist('some_key', true);
                    await storage.purge();
                });
                
                it("throw exception when key is not provided", () =>
                {
                    assert.throws(() => storage.exist());
                });
            });

            describe('#set()', function() 
            { 
                it('set a value when given valid key', async () =>
                {
                    assert.ok(await storage.set('some_key', {'foo': 'bar'}));
                    await strictExist('some_key', true);
                    await storage.purge();
                });
                
                it("throw exception when key is invalid",async () =>
                {
                    assert.throws(() => storage.set('\\', {}));
                });

                it("throw exception when key or value are not provided", () =>
                {
                    assert.throws(() => storage.set());
                    assert.throws(() => storage.set('some_key'));
                });
                
                it("throw exception when value is not serializable", () =>
                {
                    let unserializable = { "data":1 };
                    unserializable.circular = unserializable;
                    assert.throws(() => storage.set(testPath, unserializable));
                });
            });
            
            describe('#get()', function() 
            { 
                it('return a value when given key exists', async () =>
                {
                    assert.ok(await storage.set('some_key', {'foo': 'bar'}));
                    assert.deepEqual(await storage.get('some_key'), {'foo': 'bar'});
                    await storage.purge();
                });
                
                if (config.storageTypeToCacheName[storageType]) {

                    it('cached keys increase after get', async () =>
                    {
                        assert.ok(await storage.set('some_key', {'foo': 'bar'}));
                        assert.deepEqual(await storage.get('some_key'), {'foo': 'bar'});
                        assert.strictEqual(storage.cachedKeys, 1);
                        assert.deepEqual(await storage.get('some_key'), {'foo': 'bar'});
                        await storage.purge();
                    });

                    it('cached keys increase after multiple gets', async () =>
                    {
                        assert.ok(await storage.set('some_key', {'foo': 'bar'}));
                        assert.ok(await storage.set('some_key2', {'foo': 'bar'}));
                        assert.ok(await storage.set('some_key3', {'foo': 'bar'}));
                        assert.ok(await storage.set('some_key4', {'foo': 'bar'}));
                        assert.deepEqual(await storage.get('some_key'), {'foo': 'bar'});
                        assert.strictEqual(storage.cachedKeys, 4);
                        assert.deepEqual(await storage.get('some_key'), {'foo': 'bar'});
                        await storage.purge();
                    });

                    it('cached keys update after set', async () =>
                    {
                        assert.ok(await storage.set('some_key', {'foo': 'bar'}));
                        assert.strictEqual(storage.cachedKeys, 1);
                        assert.deepEqual(await storage.get('some_key'), {'foo': 'bar'});
                        assert.ok(await storage.set('some_key', {'foo': 'bar2'}));
                        assert.strictEqual(storage.cachedKeys, 1);
                        assert.deepEqual(await storage.get('some_key'), {'foo': 'bar2'});
                        await storage.purge();
                    });
                    
                    it('cached keys update after delete', async () =>
                    {
                        assert.ok(await storage.set('some_key', {'foo': 'bar'}));
                        assert.strictEqual(storage.cachedKeys, 1);
                        assert.deepEqual(await storage.get('some_key'), {'foo': 'bar'});
                        await storage.delete('some_key');
                        assert.strictEqual(storage.cachedKeys, 0);
                        assert.strictEqual(await storage.exist('some_key'), false);
                        await storage.purge();
                    });

                    it('cached keys update after purge', async () =>
                    {
                        assert.ok(await storage.set('some_key', {'foo': 'bar'}));
                        assert.strictEqual(storage.cachedKeys, 1);
                        assert.deepEqual(await storage.get('some_key'), {'foo': 'bar'});
                        await storage.purge();
                        assert.strictEqual(storage.cachedKeys, 0);
                        assert.strictEqual(await storage.exist('some_key'), false);
                        await storage.purge();
                    });
                }

                it("throw error (reject) when the key is not found", async () =>
                {
                    await storage.set('wrong_key', {'foo': 'bar'});
                    await assert.rejects(storage.get('some_key'));
                });
                
                it("throw exception when key is invalid", () =>
                {
                    assert.throws(() => storage.get('\\'));
                });

                it("throw exception when key is not provided", () =>
                {
                    assert.throws(() => storage.get());
                });
            });

            describe('#getTotalSizeBytes()', function() 
            { 
                it('return storage total size', async () =>
                {
                    assert.ok(await storage.set('some_key', {'foo': 'bar'}));
                    await storage._drivers.flush();
                    assert.strictEqual(await storage.getTotalSizeBytes(), 'some_key'.length + JSON.stringify({_d: {'foo': 'bar'}}).length);

                    assert.ok(await storage.set('some_key_2', {'foo': 'bar'}));
                    await storage._drivers.flush();
                    assert.strictEqual(await storage.getTotalSizeBytes(), 
                    'some_key'.length + JSON.stringify({_d: {'foo': 'bar'}}).length + 
                    'some_key_2'.length + JSON.stringify({_d: {'foo': 'bar'}}).length);
                    
                    assert.ok(await storage.delete('some_key'));
                    await storage._drivers.flush();
                    assert.strictEqual(await storage.getTotalSizeBytes(), 'some_key_2'.length + JSON.stringify({_d: {'foo': 'bar'}}).length);

                    assert.ok(await storage.set('some_key_2', {'foo': 'bar'}));
                    await storage._drivers.flush();
                    assert.strictEqual(await storage.getTotalSizeBytes(), 'some_key_2'.length + JSON.stringify({_d: {'foo': 'bar'}}).length);

                    assert.ok(await storage.set('some_key_2', {'foo': 'bar123'}));
                    await storage._drivers.flush();
                    assert.strictEqual(await storage.getTotalSizeBytes(), 'some_key_2'.length + JSON.stringify({_d: {'foo': 'bar123'}}).length);

                    assert.ok(await storage.set('some_key_2', {'foo': '1'}));
                    await storage._drivers.flush();
                    assert.strictEqual(await storage.getTotalSizeBytes(), 'some_key_2'.length + JSON.stringify({_d: {'foo': '1'}}).length);

                    assert.ok(await storage.purge());
                    await storage._drivers.flush();
                    assert.strictEqual(await storage.getTotalSizeBytes(), 0);
                });

            });
                
            describe('#generateSecretKey()', function() 
            { 
                it('generate new api secret key', async () =>
                {
                    let oldSecret = storage.secretKey;
                    assert.ok(storage.secretKey);

                    assert.ok(await storage.generateSecretKey());
                    assert.ok(Boolean(storage.secretKey));
                    assert.notEqual(storage.secretKey, oldSecret);

                    oldSecret = storage.secretKey;
                    assert.ok(await storage.generateSecretKey());
                    assert.notEqual(storage.secretKey, oldSecret);
                });

                it('keep generated keys after reloading storage', async () =>
                {
                    assert.ok(await storage.generateSecretKey());
                    assert.ok(Boolean(storage.secretKey));
                    assert.ok(storage.secretKey.length > 8);
                    storagesManager.clearCache();
                    let reloadedStorage = await storagesManager.get('storage_id');
                    assert.strictEqual(storage.secretKey, reloadedStorage.secretKey);
                });
            });
            
                            
            describe('#generateReadonlyKey()', function() 
            { 
                it('generate new api readonly key', async () =>
                {
                    let oldSecret = storage.readonlyKey;
                    assert.ok(storage.readonlyKey);

                    assert.ok(await storage.generateReadonlyKey());
                    assert.ok(Boolean(storage.readonlyKey));
                    assert.notEqual(storage.readonlyKey, oldSecret);

                    oldSecret = storage.readonlyKey;
                    assert.ok(await storage.generateReadonlyKey());
                    assert.notEqual(storage.readonlyKey, oldSecret);
                });

                it('keep generated keys after reloading storage', async () =>
                {
                    assert.ok(await storage.generateReadonlyKey());
                    assert.ok(Boolean(storage.readonlyKey));
                    assert.ok(storage.readonlyKey.length > 8);
                    storagesManager.clearCache();
                    let reloadedStorage = await storagesManager.get('storage_id');
                    assert.strictEqual(storage.readonlyKey, reloadedStorage.readonlyKey);
                });
            });
            
            describe('#delete()', function() 
            { 
                it('delete a value when given key exists', async () =>
                {
                    assert.ok(await storage.set('some_key', {'foo': 'bar'}));
                    assert.deepEqual(await storage.get('some_key'), {'foo': 'bar'});
                    assert.ok(await storage.delete('some_key'));
                    await assert.rejects(storage.get('some_key'));
                    await storage.purge();
                });

                it('throw error (reject) when given key does not exist', async () =>
                {
                    await strictExist('some_key', false);
                    await assert.rejects(storage.delete('some_key'));
                });

                it("throw exception when key is not provided",async () =>
                {
                    assert.throws(() => storage.delete());
                });
            });
                    
            describe('#list()', function() 
            {
                it("list all existing keys", async () =>
                {
                    assert.deepEqual(await storage.list(), []);
                    await storage.set('key_1', {});
                    await storage.set('key_2', {});
                    await storage.set('key_3', {});
                    await storage.set('key_3', {}); // <-- add same key multiple times
                    await storage.set('key_3', {}); // <-- add same key multiple times
                    assert.deepEqual((await storage.list()).sort(), ['key_1', 'key_2', 'key_3'].sort());

                    // get list again, this time its cached
                    await storage.set('key_3', {}); // <-- add same key multiple times
                    await storage.set('key_3', {}); // <-- add same key multiple times
                    assert.deepEqual((await storage.list()).sort(), ['key_1', 'key_2', 'key_3'].sort());

                    await storage.delete('key_2', {});
                    assert.deepEqual((await storage.list()).sort(), ['key_1', 'key_3'].sort());

                    await storage.delete('key_1', {});
                    assert.deepEqual((await storage.list()).sort(), ['key_3'].sort());

                    await storage.set('foo', {});
                    assert.deepEqual((await storage.list()).sort(), ['key_3', 'foo'].sort());

                    await storage.purge();
                    assert.deepEqual(await storage.list(), []);
                });
            });

            describe('#purge()', function() 
            { 
                it('delete all keys', async () =>
                {
                    assert.ok(await storage.set('some_key_1', {'foo': 'bar'}));
                    assert.ok(await storage.set('some_key_2', {'foo2': 'bar2'}));
                    await strictExist('some_key_1', true);
                    await strictExist('some_key_2', true);
                    await storage.purge();
                    await strictExist('some_key_1', false);
                    await strictExist('some_key_2', false);
                });

                it('not destroy readonly and secret keys', async () =>
                {
                    assert.ok(await storage.generateSecretKey());
                    assert.ok(Boolean(storage.secretKey));
                    await storage.purge();
                    assert.ok(Boolean(storage.secretKey));

                    assert.ok(await storage.generateReadonlyKey());
                    assert.ok(Boolean(storage.readonlyKey));
                    await storage.purge();
                    assert.ok(Boolean(storage.readonlyKey));
                });
            });
        });
    })(storageType, storagesManager);
}