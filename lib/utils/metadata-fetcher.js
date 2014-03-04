var path = require('path');

exports.fetch = function(dataType) {
    console.log('Running index');
    var appDir = path.dirname(require.main.filename)
        ,fileLocation = 'node '+appDir+'/lib/utils/metadata/'+dataType+'-metadata.js'
        , exec = require('child_process').exec
        , child = exec(fileLocation, { maxBuffer: 9000*1024 }, function(err, stdout, stderr) {
            if (err) {
                console.log('Metadata fetcher error: ',err) ;
            } else{
                console.log('Done scraping ',dataType);
            }
        });

    child.stdout.on('data', function(data) {
        console.log(data.toString());
    });
    child.stderr.on('data', function(data) {
        console.log(data.toString());
    });
}
