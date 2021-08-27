
/**
 * Api tests utils.
 * |-- copyright and license --|
 * @package    ShackDB
 * @file       utils.js
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

// for sending requests
const axios = require('axios');
const { AuthManager } = require('../../auth');

// attach authentication token to request data dictionary
function addAuthToken(requestData, user)
{
    let token = AuthManager.userToToken(user, "127.0.0.1");
    requestData.headers = {
        Cookie: "auth-token=" + token
    };
    return requestData;
}

// get absolute url
function toTestUrl(url)
{
    let fullUrl = "http://127.0.0.1:" + config.server.port + config.server.apiUrl + url;
    return fullUrl;
}

// extract cookie from response cookies header
function extractTokenFromCookieHeader(response) 
{
    let data = response.headers['set-cookie'][0];
    if (data.indexOf('auth-token=') === -1) { return null; }
    data = data.substr(data.indexOf('auth-token=') + 'auth-token='.length);
    data = data.substr(0, data.indexOf(';'));
    return data ? unescape(data) : null;
}

// catch error code from axios and compare it to expected error
async function checkErrorCode(invocation, expectedError)
{
    try {
        var response = await invocation();
    }
    catch (e) {
        assert.strictEqual(e.response.status, expectedError);
        return;
    }
    assert.strictEqual(response.status, expectedError);
}

// catch success code from axios and compare it to expected code (defaults to 200)
async function checkSuccessCode(invocation, expectedCode)
{
    return new Promise(async (resolve, reject) => {
        try {
            expectedCode = expectedCode || 200;
            let res = await invocation();
            assert.strictEqual(res.status, expectedCode);
            resolve(res);
        }
        catch (e) {
            reject(e);
        }
    });
}

// export everything
module.exports = {
    axios: axios,
    addAuthToken: addAuthToken,
    toTestUrl: toTestUrl,
    extractTokenFromCookieHeader: extractTokenFromCookieHeader,
    checkSuccessCode: checkSuccessCode,
    checkErrorCode: checkErrorCode,
};