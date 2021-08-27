/**
 * Policies - a struct to hold storage policies (limit size, keys length, etc).
 * |-- copyright and license --|
 * @package    ShackDB
 * @file       policies.js
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

const validKeys = ["maxSizeBytes", "maxKeys", "maxKeyLength", "maxValueSizeBytes"]

/**
 * Define different policies we can attach to storage types.
 */
class StoragePolicies
{
    /**
     * Create the storage policies object.
     * @param {*} policies Dictionary with policies values.
     */
    constructor(policies)
    {
        this._policies = policies;
        for (let key in policies) {
            if (validKeys.indexOf(key) === -1) {
                throw new Error("Invalid policies key: " + key);
            }
        }
    }

    /**
     * Max storage size in bytes.
     */
    get maxSizeBytes()
    {
        return this._policies.maxSizeBytes;
    }
    
    /**
     * Max storage keys count.
     */
    get maxKeys()
    {
        return this._policies.maxKeys;
    }
        
    /**
     * Max keys length.
     */
    get maxKeyLength()
    {
        return this._policies.maxKeyLength;
    }
        
    /**
     * Max size of a single value in bytes.
     */
    get maxValueSizeBytes()
    {
        return this._policies.maxValueSizeBytes;
    }
}


// export the main class
module.exports = StoragePolicies;