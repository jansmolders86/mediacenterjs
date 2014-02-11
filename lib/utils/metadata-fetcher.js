exports.fetch = function(dataType) {
    var rootPath = path.dirname(module.parent.parent.parent.filename)
        , fileLocation = 'node '+rootPath+'/lib/utils/metadata/'+dataType+'-metadata.js'
        , exec = require('child_process').exec
        , child = exec(fileLocation, { maxBuffer: 9000*1024 }, function(err, stdout, stderr) {
            if (err) {
                console.log('Metadata fetcher error: ',err) ;
            } else{
                console.log('Done scraping ',dataType);
            }
        });

    child.stdout.on('data', function(data) { console.log(data.toString()); });
    child.stderr.on('data', function(data) { console.log(data.toString()); });
}
