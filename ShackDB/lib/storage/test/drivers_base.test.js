/**
 * Generic storage drivers tests.
 * |-- copyright and license --|
 * @package    ShackDB
 * @file       drivers_base.test.js
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

// get main classes to test
const config = require('../../config');
const path = require('path');

// drivers instance
const rootPath = path.join(config.paths.dataRoot, 'test_drivers');
const testPath = path.join(rootPath, 'some_path_key');


/**
 * Method to generate all tests for a given drivers type.
 * @param {Function} getDrivers Method to get drivers instance before each test.
 * @param {String} driversName drivers identifier.
 */
const generateDriversTest = (getDrivers, driversName) => {

    var drivers;

    // perform a strict exist check for key, using assert
    async function strictExist(key, shouldExist) {
        let exist = await drivers.exist(key);
        assert.strictEqual(exist, Boolean(shouldExist));
    }

    beforeEach(async () => {
        if (drivers) { await drivers.purge(rootPath); }
        drivers = getDrivers();
        drivers.initSync(rootPath);
    });

    describe('#exist()', function() 
    { 
        it('return false when the key is not present', async () =>
        {
            await strictExist(testPath, false);
        });

        it('return true when the key is present', async () =>
        {
            assert.ok(await drivers.set(testPath, "hello"));
            await strictExist(testPath, true);
            await drivers.purge(rootPath);
        });
    });

    describe('#set()', function() 
    { 
        it('set a value when given valid key and value', async () =>
        {
            assert.ok(await drivers.set(testPath, "hello"));
            await strictExist(testPath, true);
            await drivers.purge(rootPath);
        });

        it('does not change values under a different key when setting a value', async () =>
        {
            assert.ok(await drivers.set(testPath, "hello world"));
            await strictExist(testPath, true);
            assert.strictEqual(await drivers.get(testPath), "hello world");

            assert.ok(await drivers.set(testPath + '2', "foo bar"));
            await strictExist(testPath + '2', true);
            assert.strictEqual(await drivers.get(testPath), "hello world");
            assert.strictEqual(await drivers.get(testPath + '2'), "foo bar");

            await drivers.purge(rootPath);
        });
    });
    
    describe('#get()', function() 
    { 
        it('return a value when given key exists', async () =>
        {
            assert.ok(await drivers.set(testPath, "hello world!"));
            assert.strictEqual(await drivers.get(testPath), "hello world!");
            await drivers.purge(rootPath);
        });

        it("throw error (reject) when the key is not found", async () =>
        {
            await drivers.set(path.join(rootPath, 'wrong_key'), "hello world!");
            await assert.rejects(drivers.get(testPath));
        });
    });
        
    describe('#getTotalSizeBytes()', function() 
    { 
        it('return storage total size in bytes', async () =>
        {
            assert.ok(await drivers.set(testPath, "hello world!"));
            await drivers.flush();
            assert.strictEqual(await drivers.getTotalSizeBytes(rootPath), "hello world!".length + "some_path_key".length);
        });
    });
      
    describe('#getSync()', function() 
    { 
        it('return a value when given key exists', async () =>
        {
            assert.ok(await drivers.set(testPath, "hello world!"));
            assert.strictEqual(drivers.getSync(testPath), "hello world!");
            await drivers.purge(rootPath);
        });

        it("throw error (reject) when the key is not found", async () =>
        {
            await drivers.set(path.join(rootPath, 'wrong_key'), "hello world!");
            assert.throws(() => drivers.getSync(testPath));
        });
    });

    describe('#delete()', function() 
    { 
        it('delete a value when given key exists', async () =>
        {
            assert.ok(await drivers.set(testPath, "hello world!"));
            assert.ok(await drivers.set(testPath + '2', "hello world 123!"));
            assert.strictEqual(await drivers.get(testPath), "hello world!");
            assert.strictEqual(await drivers.get(testPath + '2'), "hello world 123!");

            assert.ok(await drivers.delete(testPath));
            await assert.rejects(drivers.get(testPath));

            assert.ok(await drivers.set(testPath, "hello world!"));
            assert.ok(await drivers.delete(testPath));
            await assert.rejects(drivers.get(testPath));
            assert.strictEqual(await drivers.get(testPath + '2'), "hello world 123!");

            await drivers.purge(rootPath);
        });

        it('delete one value does not affect another value', async () =>
        {
            assert.ok(await drivers.set(testPath, "hello world!"));
            assert.strictEqual(await drivers.get(testPath), "hello world!");

            assert.ok(await drivers.set(testPath + '2', "abcdefg"));
            assert.strictEqual(await drivers.get(testPath + '2'), "abcdefg");

            assert.ok(await drivers.delete(testPath));
            await assert.rejects(drivers.get(testPath));

            assert.strictEqual(await drivers.get(testPath + '2'), "abcdefg");

            await drivers.purge(rootPath);
        });

        it('throw error (reject) when given key does not exist', async () =>
        {
            await strictExist(testPath, false);
            await assert.rejects(drivers.delete(testPath));
        });
    });
               
    describe('#list()', function() 
    {
        it("list all existing keys", async () =>
        {
            assert.deepEqual(await drivers.list(rootPath), []);
            await drivers.set(path.join(rootPath, 'key_1'), {});
            await drivers.set(path.join(rootPath, 'key_2'), {});
            await drivers.set(path.join(rootPath, 'key_3'), {});
            assert.deepEqual((await drivers.list(rootPath)).sort(), ['key_1', 'key_2', 'key_3'].sort());

            await drivers.delete(path.join(rootPath, 'key_2'), {});
            assert.deepEqual((await drivers.list(rootPath)).sort(), ['key_1', 'key_3'].sort());

            await drivers.delete(path.join(rootPath, 'key_1'), {});
            assert.deepEqual((await drivers.list(rootPath)).sort(), ['key_3'].sort());

            await drivers.set(path.join(rootPath, 'foo'), {});
            assert.deepEqual((await drivers.list(rootPath)).sort(), ['key_3', 'foo'].sort());

            await drivers.purge(rootPath);
            assert.deepEqual((await drivers.list(rootPath)).sort(), [].sort());
        });
    });

    describe('#purge()', function() 
    { 
        it('delete all keys', async () =>
        {
            assert.ok(await drivers.set(path.join(rootPath, 'some_key_1'), "hello world!"));
            assert.ok(await drivers.set(path.join(rootPath, 'some_key_2'), "abcdefg"));
            await strictExist(path.join(rootPath, 'some_key_1'), true);
            await strictExist(path.join(rootPath, 'some_key_2'), true);
            await drivers.purge(rootPath);
            await strictExist(path.join(rootPath, 'some_key_1'), false);
            await strictExist(path.join(rootPath, 'some_key_2'), false);
        });
    });
}

// export the test method
module.exports = generateDriversTest;