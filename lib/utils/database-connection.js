// Init Database
var os = require('os');
var dblite = require('dblite');

// Use packaged binaries if OS is Windows.
if(os.platform() === 'win32'){
    dblite.bin = "./bin/sqlite3/sqlite3";
}
var db = dblite('./lib/database/mcjs.sqlite');

db.on('info', function (text) { console.log('Database info:', text) });
db.on('error', function (err) { console.error('Database error: ' + err) });
db.ignoreErrors = true;
exports.db = db;