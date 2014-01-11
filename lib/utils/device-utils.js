var dblite = require('dblite')
    , os   = require('os');
if(os.platform() === 'win32'){
    dblite.bin = "./bin/sqlite3/sqlite3";
}
var db = dblite('./lib/database/mcjs.sqlite');
db.on('info', function (text) { console.log(text) });
db.on('error', function (err) { console.error('Database error: ' + err) });

exports.storeDeviceInfo = function(req) {

        var deviceLocalIp;
        var devicePlatform;

        getLocalIp(req, function(localIP){
            deviceLocalIp  = localIP;
            getPlatform(req, function(devicePlatfrm){
                devicePlatform = devicePlatfrm;

                var deviceID          = devicePlatform+'_'+deviceLocalIp
                var currentDate       = getDateTime();

                getDeviceStatus(deviceID, function(isAllowed){
                    db.query('INSERT OR REPLACE INTO devices VALUES(?,?,?)', [ deviceID, currentDate, isAllowed ]);
                });
            })
        })

}

exports.isDeviceAllowed = function(req,callback) {
    var deviceLocalIp;
    var devicePlatform;

    getLocalIp(req, function(localIP){
        deviceLocalIp  = localIP;
        getPlatform(req, function(devicePlatfrm){
            devicePlatform = devicePlatfrm;
            var deviceID          = devicePlatform+'_'+deviceLocalIp;
            getDeviceStatus(deviceID, function(isAllowed){
                callback(isAllowed);
            });
        })
    })
}

exports.lockDevice = function(req,res,deviceID) {
    var currentDate  = getDateTime();
    db.query('INSERT OR REPLACE INTO devices VALUES(?,?,?)', [ deviceID, currentDate, 'no' ]);

    res.send('done');
}

exports.unlockDevice = function(req,res,deviceID) {
    var currentDate  = getDateTime();
    db.query('INSERT OR REPLACE INTO devices VALUES(?,?,?)', [ deviceID, currentDate, 'yes' ]);

    res.send('done');
}


function getDeviceStatus(deviceID, callback){
    db.query("CREATE TABLE IF NOT EXISTS devices (device_id text PRIMARY KEY, last_seen text, is_active text)");
    db.query('SELECT * FROM devices WHERE device_id =? ', [ deviceID ], {
        device_id: String,
        last_seen: String,
        is_active: String
    }, function(rows) {
        if (typeof rows !== undefined && rows.length > 0){
            callback(rows[0].is_active);
        } else {
            callback('yes');
        }
    });
}


function getPlatform(req, callback){
    var userAgent = req.headers['user-agent'];

    if(userAgent.toLowerCase().indexOf("windows") > -1){
        var userPlatform = 'windows';
    } else if(userAgent.toLowerCase().indexOf("OS X") > -1){
        var userPlatform = 'mac';
    } else if(userAgent.toLowerCase().indexOf("android") > -1){
        var userPlatform = 'android';
    } else if(userAgent.toLowerCase().indexOf("ipad") > -1){
        var userPlatform = 'ipad';
    } else if(userAgent.toLowerCase().indexOf("iphone") > -1){
        var userPlatform = 'iphone';
    } else if(userAgent.toLowerCase().indexOf("fedora") > -1){
        var userPlatform = 'fedora';
    } else if(userAgent.toLowerCase().indexOf("ubuntu") > -1){
        var userPlatform = 'ubuntu';
    } else if(userAgent.toLowerCase().indexOf("debian") > -1){
        var userPlatform = 'debian';
    }

    callback(userPlatform);
}


function getLocalIp(req, callback){
    var ipAddress;
    var forwardedIpsStr = req.header('x-forwarded-for');
    if (forwardedIpsStr) {
        var forwardedIps = forwardedIpsStr.split(',');
        ipAddress = forwardedIps[0];
    }
    if (!ipAddress) {
        ipAddress = req.connection.remoteAddress;
    }

    callback(ipAddress);
}


function getDateTime() {

    var date = new Date();

    var hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;

    var min  = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;

    var sec  = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;

    var year = date.getFullYear();

    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;

    var day  = date.getDate();
    day = (day < 10 ? "0" : "") + day;

    return year + "-" + month + "-" + day + " " + hour + ":" + min + ":" + sec;

}
