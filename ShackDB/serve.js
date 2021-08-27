/**
 * Create express app and start listening. Return server instance.
 * |-- copyright and license --|
 * @package    ShackDB
 * @file       serve.js
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
const config = require('./lib/config');
const path = require('path');
const express = require('express');
const http = require('http');
const https = require('https');
const fs = require('fs');
const {UsersManager} = require('./lib');
const nunjucks = require('nunjucks');

// not listening to any port?
if (!config.server.port && !config.server.securedPort) {
    throw new Error("Must provide either port or secured port to listen to.");
}


// set application name
process.title = "ShackDB";

// create express app
const app = express();

// set max payload size
app.use(express.json({limit: '10mb'}));

// for quickly access requests body
app.use(express.urlencoded({extended: true}));
app.use(express.json());

// init and logger
const log4js = require("log4js");
log4js.configure(config.isInTest ? 'config/log4js.test.json' : 'config/log4js.json');
const logger = log4js.getLogger('app');

// print title
logger.info("                                           ");
logger.info(" _____ _                _     ____________ ");
logger.info("/  ___| |              | |    |  _  \\ ___ \\");
logger.info("\\ `--.| |__   __ _  ___| | __ | | | | |_/ /");
logger.info(" `--. \\ '_ \\ / _` |/ __| |/ / | | | | ___ \\");
logger.info("/\\__/ / | | | (_| | (__|   <  | |/ /| |_/ /");
logger.info("\\____/|_| |_|\\__,_|\\___|_|\\_\\ |___/ \\____/ ");
logger.info("                                           ");
logger.info("                                        Ronen Ness / 2021");
logger.info("                                           ");
logger.info("Code hosted at: https://github.com/RonenNess/ShackDB");

// check if production mode
if(!process.env.NODE_ENV || process.env.NODE_ENV.indexOf('production') === -1)
{
    logger.warn("Node is not running in production mode! Please start ShackDB in production for best performance.");
}

// for accessing cookies
let cookie_parser = require('cookie-parser');
app.use(cookie_parser(config.security.cookiesSecret));

require('./security_validations');

// setup nunjucks as view engine
nunjucks.configure('views', {
    express: app,
    autoescape: true
});
app.set('view engine', 'html');

// add api middlewares
const addApiMiddlewares = require('./lib/api/lib/middlewares');
addApiMiddlewares(app);

// set built-in users
var _waitingUsers = config.users.length;
for (let i = 0; i < config.users.length; ++i) {
    
    let userData = config.users[i];
    logger.info(`Set built-in user '${userData.username}' (enabled=${userData.enabled}, superuser=${userData.superuser}).`);
    
    UsersManager.updateOrCreate(userData.username, {enabled: userData.enabled, superuser: userData.superuser, password: userData.password, email: userData.email || ""})
    .catch((err) => {
        logger.error("Failed to create user! Error: ", err);
    })
    .finally(() => {
        _waitingUsers--;
    });
}

// init all existing storages
UsersManager.list().then((users) => {
    for (let i = 0; i < users.length; ++i) {
        logger.debug("Load existing user data: " + users[i]);
        UsersManager.get(users[i]).then((user) => {
            logger.debug("Load user " + user.id + " storages.");
            for (let storageType in config.storageDriversGenerator) {
                let storages = user.storagesManager(storageType);
                storages.list().then((storagesIds) => {
                    for (let j = 0; j < storagesIds.length; ++j) {
                        storages.get(storagesIds[j]);
                    }
                })
            }
        })
    }
})

// init views routes, only after we finish creating / updating users
const initViews = require('./views/web_pages');
function initViewsWhenReady() {
    if (_waitingUsers > 0) {
        return setTimeout(initViewsWhenReady, 10);
    }
    logger.info("Initialize view routes.");
    initViews(app);
}
initViewsWhenReady();

// register all application routes
const Engine = require('./lib');
const { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } = require('constants');
const ApiManager = Engine.ApiManager;
ApiManager.setupRoutes(app);

// load private key and certificate
if (config.server.securedPort) {

    if (!config.security.privateKeyFile || !config.security.certificateFile) {
        throw new Error("Missing private key or certificate path while HTTPS port is enabled.");
    }
    const privateKey  = fs.readFileSync('sslcert/server.key', 'utf8');
    const certificate = fs.readFileSync('sslcert/server.crt', 'utf8');
    const credentials = {key: privateKey, cert: certificate};
}

// create and listen to non secured port
var httpServer;
if (config.server.port) {
    httpServer = http.createServer(app);
    logger.info("Start listening on unsecured port (HTTP): " + config.server.port);
    httpServer.listen(config.server.port, config.server.hostname, () => {
        logger.info(`Listening at http://${config.server.hostname}:${config.server.port}`);
    });
}

// create and listen to secured port
var httpsServer;
if (config.server.securedPort) {
    httpsServer = https.createServer(credentials, app);
    logger.info("Start listening on secured port (HTTPS): " + config.server.securedPort);
    httpsServer.listen(config.server.securedPort, config.server.hostname, () => {
        logger.info(`Listening at http://${config.server.hostname}:${config.server.securedPort}`);
    });
}

// serve statics
app.use(express.static('views/public'))

// stop server and cleanup
function stop() {
    if (httpsServer) httpsServer.close();
    if (httpServer) httpServer.close();
    ApiManager.cleanup();
}

// export server instance and stop method
module.exports = {
    httpServer: httpServer,
    httpsServer: httpsServer,
    stop: stop,
};