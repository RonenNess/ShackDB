import os

def replaceTextBetween(originalText, delimeterA, delimterB, replacementText):
    leadingText = originalText.split(delimeterA)[0]
    trailingText = originalText.split(delimterB)[1]

    return leadingText + delimeterA + replacementText + delimterB + trailingText


missing = []
for root, subdirs, files in os.walk('.'):

    if 'node_modules' in root or 'views\\public\\' in root:
        continue

    for filename in files:

        if not filename.lower().endswith('.js'):
            continue

        file_path = os.path.join(root, filename)
        content = open(file_path, 'r').read()

        if '* |-- copyright and license --|' in content:

            to_push = """
 * @package    ShackDB
 * @file       __file__
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
""".replace('__file__', filename)
            content = replaceTextBetween(content, ' * |-- copyright and license --|', ' * |-- end copyright and license --|', to_push)

            open(file_path, 'w').write(content)
            print(file_path)
    
        else:
            missing.append(file_path)

print ("Files without license header: ")
print (missing)