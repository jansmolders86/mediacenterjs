exports.storeUserInfo = function(req) {

    var userLocalIp         = getLocalIp(req)
        , userPlatform      = getPlatform(req)
        , deviceID          = userPlatform+'_'+userLocalIp
        , currentDate       = getDateTime()
        , os                = require('os');

    var dblite = require('dblite')
    if(os.platform() === 'win32'){
        dblite.bin = "./bin/sqlite3/sqlite3";
    }
    var db = dblite('./lib/database/mcjs.sqlite');
    db.on('info', function (text) { console.log(text) });
    db.on('error', function (err) { console.error('Database error: ' + err) });

    console.log('Storing device data '+ deviceID +' '+ currentDate)
    db.query("CREATE TABLE IF NOT EXISTS devices (device_id text PRIMARY KEY, last_seen text)");
    db.query('INSERT OR REPLACE INTO devices VALUES(?,?)', [ deviceID, currentDate ]);

}


function getPlatform(req){
    var userAgent = req.headers['user-agent'];

    if(userAgent.toLowerCase().indexOf("windows") > -1){
        var userPlatform = 'windows';
        console.log('This is Windows')
    } else if(userAgent.toLowerCase().indexOf("mac") > -1){
        var userPlatform = 'mac';
        console.log('This is mac')
    } else if(userAgent.toLowerCase().indexOf("android") > -1){
        var userPlatform = 'android';
        console.log('This is android')
    } else if(userAgent.toLowerCase().indexOf("ipad") > -1){
        var userPlatform = 'ipad';
        console.log('This is ipad')
    } else if(userAgent.toLowerCase().indexOf("iphone") > -1){
        var userPlatform = 'iphone';
        console.log('This is iphone')
    } else if(userAgent.toLowerCase().indexOf("fedora") > -1){
        var userPlatform = 'fedora';
        console.log('This is fedora')
    } else if(userAgent.toLowerCase().indexOf("ubuntu") > -1){
        var userPlatform = 'ubuntu';
        console.log('This is ubuntu')
    } else if(userAgent.toLowerCase().indexOf("debian") > -1){
        var userPlatform = 'debian';
        console.log('This is debian')
    }

    return userPlatform;
}


function getLocalIp(req){
    var ipAddress;
    var forwardedIpsStr = req.header('x-forwarded-for');
    if (forwardedIpsStr) {
        var forwardedIps = forwardedIpsStr.split(',');
        ipAddress = forwardedIps[0];
    }
    if (!ipAddress) {
        ipAddress = req.connection.remoteAddress;
    }

    console.log('IP Address', ipAddress);
    return ipAddress;
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