var path = require('path');
var reloadCount = 0;

exports.fetch = function(req, res, dataType) {
    console.log('Running index');
    var appDir = path.dirname(require.main.filename)
        ,fileLocation = 'node '+appDir+'/lib/utils/metadata/'+dataType+'-metadata.js'
        , exec = require('child_process').exec
        , child = exec(fileLocation, { maxBuffer: 9000*1024 }, function(err, stdout, stderror) {
            if (err) {
                console.log('Metadata fetcher error: ',err) ;
            }
        });

    child.stdout.on('data', function(data) {
        console.log(data.toString());
    });
    child.stderr.on('data', function(data) {
        console.log(data.toString());
    });

    child.on('exit', function() {
        console.error('Child process exited');

        if(reloadCount === 0 ){
            console.log('sending Done.');
            res.send('Done');
            reloadCount++;
        }

    });

}
