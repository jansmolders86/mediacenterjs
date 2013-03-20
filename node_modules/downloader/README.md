
# HTTP Downloader

Node.js event driven downloader.

# Install

    npm install downloader

# Usage

    var downloader = require('downloader');
    
    var downloadDir = __dirname + '/downloads/';
    
    downloader.on('done', function(msg) {
    	console.log(msg);
    });

    downloader.on('error', function(msg) {
    	console.log(msg);
    });
    
    downloader.download("http://site.com/file1.txt", downloadDir);
    
    

# License

@2012 Hendrix Tavarez
MIT License http://www.opensource.org/licenses/MIT 
