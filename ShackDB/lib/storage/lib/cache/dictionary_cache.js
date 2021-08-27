/**
 * Implement a simple dictionary based cache.
 * |-- copyright and license --|
 * @package    ShackDB
 * @file       dictionary_cache.js
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
const ICache = require("./cache.interface");


/**
 * Implement a simple dictionary based cache.
 */
class DictionaryCache extends ICache
{
    constructor(config)
    {
        super(config);
        this._values = {};
        this._maxKeys = config.maxKeys || 1000;
        this._keysToReduceTo = config.keysToReduceTo || 800;
        if (this._keysToReduceTo > this._maxKeys) {
            throw new Error("Dictionary storage maxKeys must be bigger than keysToReduceTo!");
        }
        this._keysCount = 0;
    }

    get keysCount()
    {
        return this._keysCount;
    }

    clear()
    {
        this._values = {};
        this._keysCount = 0;
    }

    get(key)
    {
        return this._values[key];
    }

    set(key, value)
    {
        // set value
        if (this._values[key] === undefined) { this._keysCount++; }
        this._values[key] = value;

        // check if exceed max keys
        if (this._keysCount > this._maxKeys) 
        {
            let keys = Object.keys(this._values);
            while (keys.length > this._keysToReduceTo) {
                let removeIndex = Math.floor(Math.random() * keys.length);
                delete this._values[keys[removeIndex]];
                keys.splice(removeIndex, 1);
            }
            this._keysCount = keys.length;
        }
    }

    delete(key)
    {
        if (this._values[key] !== undefined) { 
            this._keysCount--; 
        }

        delete this._values[key];
    }
}
 
// export the cache.
module.exports = DictionaryCache;