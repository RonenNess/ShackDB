/**
 * Utility method to check if a given string is a valid filename.
 * Code taken from: https://stackoverflow.com/questions/11100821/javascript-regex-for-validating-filenames
 */
var isValid=(function(){
    var rg1=/^[^\\/:\*\?"<>\|]+$/; // forbidden characters \ / : * ? " < > |
    var rg2=/^\./; // cannot start with dot (.)
    var rg3=/^(nul|prn|con|lpt[0-9]|com[0-9])(\.|$)/i; // forbidden file names
    return function isValid(fname){
      return rg1.test(fname)&&!rg2.test(fname)&&!rg3.test(fname);
    }
})();

module.exports = isValid;