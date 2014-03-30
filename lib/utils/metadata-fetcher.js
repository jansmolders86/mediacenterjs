/**
 Get metadata for specific app
 @param dataType    String:     Name of meta data type. (eg. movie or tv)
 @param callback    function
 */

var path = require('path');

exports.fetch = function(req, res, dataType, callback) {
    var appDir = path.dirname(require.main.filename)
        , fileLocation = 'node '+appDir+'/lib/utils/metadata/'+dataType+'-metadata.js'
		, dataType = dataType
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
		console.log('Metadata fetching for '+dataType+ ' complete...')
        callback(dataType);
		console.log('Child process exited for: ', dataType);
    });
}
