/**
 * Tests entry point - import all modules private tests.
 * |-- copyright and license --|
 * @package    ShackDB
 * @file       test.js
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
const fs = require('fs');
const config = require('./lib/config');

// not in test mode? don't continue so we won't delete data by accident!
if (!config.isInTest) {
    throw new Error("Running test but did not identify we are in test mode!");
}

// delete previous data
console.log("Delete previous test data folder: ", config.paths.dataRoot);
fs.rmdirSync(config.paths.dataRoot, { recursive: true });

// start listening on apis
const {server, stop} = require('./serve');

const log4js = require("log4js");
const logger = log4js.getLogger('test');


// print test header to log before every test
beforeEach(function(){

    let curr = this.currentTest;
    let title = curr.title;
    

    while (curr.parent) {
        curr = curr.parent;
        title = curr.title + ' --> ' + title;
    }

    logger.info("-------------------------------------------------------------------");
    logger.info("TEST " + title);
    logger.info("-------------------------------------------------------------------");
})

// include all tests
console.log("\n\n!!! BEGIN TESTS !!!\n\n");
logger.info("\n\n!!! BEGIN TESTS !!!\n\n");
require('./lib/test');

// delete temp data folder and close server when done with tests
after(function () {

    // check if need to keep storage
    var keepStorageWhenDone = true;
    console.log("Keep storage after tests done: " + keepStorageWhenDone);

    // clear storage and stop server
    if (!keepStorageWhenDone) {
        fs.rmdirSync(config.paths.dataRoot, { recursive: true });
    }
    stop();
});