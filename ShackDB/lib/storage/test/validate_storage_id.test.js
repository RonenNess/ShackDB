/**
 * Test the valid-filename utility method.
 * |-- copyright and license --|
 * @package    ShackDB
 * @file       validate_storage_id.test.js
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

// get method to test
const validateStorageId = require('../lib/validate_storage_id');

// test valid-filename utility method
describe('validateStorageId', function() 
{
    it('return true for valid filenames', async () =>
    {
        assert.ok(validateStorageId("test.foo"));
        assert.ok(validateStorageId("test"));
        assert.ok(validateStorageId("test123"));
        assert.ok(validateStorageId("test_foo"));
        assert.ok(validateStorageId("_"));
        assert.ok(validateStorageId(" "));
        assert.ok(validateStorageId("test-foo"));
        assert.ok(validateStorageId("test+foo"));
        assert.ok(validateStorageId("test foo"));
    });

    it('return false for invalid filenames', async () =>
    {
        assert.strictEqual(validateStorageId("test?"), false);
        assert.strictEqual(validateStorageId("."), false);
        assert.strictEqual(validateStorageId(".test"), false);
        assert.strictEqual(validateStorageId("test\\a"), false);
        assert.strictEqual(validateStorageId("test/aa"), false);
        assert.strictEqual(validateStorageId(""), false);
        assert.strictEqual(validateStorageId("test:a"), false);
        assert.strictEqual(validateStorageId("test*a"), false);
        assert.strictEqual(validateStorageId('test"a'), false);
        assert.strictEqual(validateStorageId("test|a"), false);
        assert.strictEqual(validateStorageId("test>a"), false);
        assert.strictEqual(validateStorageId("test<a"), false);
    });
});