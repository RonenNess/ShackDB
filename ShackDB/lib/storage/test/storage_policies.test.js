/**
 * Test the storage class.
 * |-- copyright and license --|
 * @package    ShackDB
 * @file       storage_policies.test.js
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

const storageTypes = ["files_limited", "memory_limited"];
for (let _i = 0; _i < storageTypes.length; ++_i) {

    let storageType = storageTypes[_i];
    const storagesManager = new StoragesManager(config.paths.storagesDataRoot, storageType);

    (function(storageType, storagesManager) {

        // test storages manager
        describe('StoragePolicies [' + storageType + ']', function() 
        {
            // get policies
            const policies = config.storageTypeToPolicy[storageType];

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

            describe('#maxKeys [' + policies.maxKeys + ']', function() 
            { 
                it('reject when trying to set too many keys', async () =>
                {
                    let prevLimit = storage.policies._policies.maxSizeBytes;
                    storage.policies._policies.maxSizeBytes = 0;
                    for (let i = 0; i < policies.maxKeys; ++i) {
                        await storage.set('k' + i, {});
                    }
                    await assert.rejects(storage.set('this_will_break', {}));
                    storage.policies._policies.maxSizeBytes = prevLimit;
                });
            });

            describe('#maxKeyLength [' + policies.maxKeyLength + ']', function() 
            { 
                it('reject when key length is too long', async () =>
                {
                    await assert.rejects(storage.set("a".repeat(policies.maxKeyLength + 1), {'a':'b'}));
                });
            });

            describe('#maxValueSizeBytes [' + policies.maxValueSizeBytes + ']', function() 
            { 
                it('reject when data is too big', async () =>
                {
                    await assert.rejects(storage.set("too_big", {'a': "a".repeat(policies.maxValueSizeBytes)}));
                });
            });

            describe('#maxSizeBytes [' + policies.maxSizeBytes + ']', function() 
            { 
                it('reject when total size is too big', async () =>
                {
                    for (let i = 0; i < policies.maxSizeBytes / 100; ++i) {
                        await storage.set("almost_" + i, {'a': "a".repeat(70)});
                    }
                    await assert.rejects(storage.set("break", {'a': "a".repeat(85)}));
                });
            });
        });
    })(storageType, storagesManager);
}