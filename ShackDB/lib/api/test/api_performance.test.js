/**
 * Test the storage api - base tests for all storage types.
 * |-- copyright and license --|
 * @package    ShackDB
 * @file       api_performance.test.js
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

const log4js = require("log4js");
const logger = log4js.getLogger('test');

function consoleAndLog(msg) {
    logger.info(msg);
    console.log(msg);
}

// get config
const config = require('../../config');

// to create test users and storage
const { AuthManager } = require('../../auth');
const { UsersManager } = require('../../users');
const userId = 'user_id';
const userDetails = {email:"test@gmail.com", "password": "123456"};
const existingStorageId = 'perf_storage';

// get utility methods
const {axios, toTestUrl, checkSuccessCode} = require('./utils');

// users
var user;


describe(config.server.apiUrl, function() 
{
    describe('access - performance', function() 
    {
        // increase timeout
        this.timeout(15000);

        let _types = ['memory', 'files', 'cached_files', 'files_with_cache', 'cached_files_with_cache'];
        for (let _ti = 0; _ti < _types.length; ++_ti) {

            (function(type) {

                describe('<' + type + '>', function() 
                {
                    beforeEach(async () => {
                        AuthManager.clearTokens();
                        let _isNew;
                        [user, _isNew] = await UsersManager.getOrCreate(userId, userDetails);
                        await user.storagesManager(type).purge();
                        await user.storagesManager(type).getOrCreate(existingStorageId);
                    });

                    var batchSize = 175;
                    var batchesCount = 10;


                    describe('get', function() 
                    { 
                        it('check performance of get api', async () =>
                        {
                            let storages = await user.storagesManager(type);
                            let storage = await storages.get(existingStorageId);
                            await storage.set("test_key", {"foo": "bar"});
                            await storage.flush();

                            let count = 0;
                            let timeBefore = (new Date()).getTime();

                            for (let j = 0; j < batchesCount; ++j)
                            {
                                let requests = [];
                                for (let i = 0; i < batchSize; ++i) {

                                    requests.push(axios.request(
                                    {
                                        method: 'post',
                                        url: toTestUrl("access"),
                                        data: {
                                            apiKey: storage.apiKey,
                                            secretKey: storage.secretKey,
                                            key: 'test_key',
                                            action: 'get'
                                        }
                                    }));
                                    count++;
                                }
                                for (let i = 0; i < requests.length; ++i) {

                                    let response = await requests[i];
                                    assert.strictEqual(response.status, 200);
                                    assert.deepEqual(response.data, {data: {"foo": "bar"}, success: true});
                                }
                            }

                            let timeAfter = (new Date()).getTime();
                            let timeTookMs = timeAfter - timeBefore;
                            let requestsPerSecond = Math.ceil(count / (timeTookMs / 1000));
                            consoleAndLog(`         Time took for ${count} requests: ${timeTookMs} MS (${requestsPerSecond} requests per second).`);
                            assert.ok(timeTookMs < 2500);

                        });
                    });


                    describe('exist', function() 
                    { 
                        it('check performance of exist api', async () =>
                        {
                            let storages = await user.storagesManager(type);
                            let storage = await storages.get(existingStorageId);
                            await storage.set("test_key", {"foo": "bar"});
                            await storage.flush();

                            let count = 0;
                            let timeBefore = (new Date()).getTime();

                            for (let j = 0; j < batchesCount; ++j)
                            {
                                let requests = [];
                                for (let i = 0; i < batchSize; ++i) {

                                    requests.push(axios.request(
                                    {
                                        method: 'post',
                                        url: toTestUrl("access"),
                                        data: {
                                            apiKey: storage.apiKey,
                                            secretKey: storage.secretKey,
                                            key: 'test_key',
                                            action: 'exist'
                                        }
                                    }));
                                    count++;
                                }
                                for (let i = 0; i < requests.length; ++i) {

                                    let response = await requests[i];
                                    assert.strictEqual(response.status, 200);
                                    assert.deepEqual(response.data, {exist: true, success: true});
                                }
                            }

                            let timeAfter = (new Date()).getTime();
                            let timeTookMs = timeAfter - timeBefore;
                            let requestsPerSecond = Math.ceil(count / (timeTookMs / 1000));
                            consoleAndLog(`         Time took for ${count} requests: ${timeTookMs} MS (${requestsPerSecond} requests per second).`);
                            assert.ok(timeTookMs < 2500);

                        });
                    });

                    
                    describe('set', function() 
                    { 
                        it('check performance of set api', async () =>
                        {
                            let storages = await user.storagesManager(type);
                            let storage = await storages.get(existingStorageId);

                            let count = 0;
                            let timeBefore = (new Date()).getTime();

                            for (let j = 0; j < batchesCount; ++j)
                            {
                                let requests = [];
                                for (let i = 0; i < batchSize; ++i) {

                                    requests.push(axios.request(
                                    {
                                        method: 'post',
                                        url: toTestUrl("access"),
                                        data: {
                                            apiKey: storage.apiKey,
                                            secretKey: storage.secretKey,
                                            key: 'test_key',
                                            data: 'hello world',
                                            action: 'set'
                                        }
                                    }));
                                    count++;
                                }
                                for (let i = 0; i < requests.length; ++i) {

                                    let response = await requests[i];
                                    assert.strictEqual(response.status, 200);
                                }
                            }

                            let timeAfter = (new Date()).getTime();
                            let timeTookMs = timeAfter - timeBefore;
                            let requestsPerSecond = Math.ceil(count / (timeTookMs / 1000));
                            consoleAndLog(`         Time took for ${count} requests: ${timeTookMs} MS (${requestsPerSecond} requests per second).`);
                            assert.ok(timeTookMs < 2500);

                        });
                    });

                    
                    describe('delete', function() 
                    { 
                        it('check performance of delete api', async () =>
                        {
                            let storages = await user.storagesManager(type);
                            let storage = await storages.get(existingStorageId);

                            let count = batchSize * batchesCount;
                            for (let i = 0; i < count; ++i) {
                                await storage.set("test_key" + i, "hello world!");
                            }

                            count = 0;
                            let timeBefore = (new Date()).getTime();
                            
                            for (let j = 0; j < batchesCount; ++j)
                            {
                                let requests = [];
                                for (let i = 0; i < batchSize; ++i) {

                                    requests.push(axios.request(
                                    {
                                        method: 'post',
                                        url: toTestUrl("access"),
                                        data: {
                                            apiKey: storage.apiKey,
                                            secretKey: storage.secretKey,
                                            key: 'test_key' + count,
                                            action: 'delete'
                                        }
                                    }));
                                    count++;
                                }
                                for (let i = 0; i < requests.length; ++i) {

                                    let response = await requests[i];
                                    assert.strictEqual(response.status, 200);
                                }
                            }

                            let timeAfter = (new Date()).getTime();
                            let timeTookMs = timeAfter - timeBefore;
                            let requestsPerSecond = Math.ceil(count / (timeTookMs / 1000));
                            consoleAndLog(`         Time took for ${count} requests: ${timeTookMs} MS (${requestsPerSecond} requests per second).`);
                            assert.ok(timeTookMs < 2500);

                        });
                    });
                });

            })(_types[_ti]);
        }
    });
});