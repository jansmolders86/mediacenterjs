/*
	MediaCenterJS - A NodeJS based mediacenter solution
	
    Copyright (C) 2013 - Jan Smolders

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
	
	////////////////\\\\\\\\\\\\\\\
	
	File based on Spludo Framework. Copyright (c) 2009-2010 DracoBlue, http://dracoblue.net/
	Licensed under the terms of MIT License.
	
*/


var child_process = require('child_process')
, fs = require("fs")
, sys = require("sys")
, colors = require('colors')
, npm = require('npm');


var checkCurrentVersion = function(){
	var info = {};
	var data = fs.readFileSync('./package.json' , 'utf8');

	try{
		info = JSON.parse(data);
	}catch(e){
		console.log('JSON Parse Error', e);
	}
	return info;
};

function versionUpdate(){
    npm.load([], function (err, npm) {
        npm.commands.search(["mediacenterjs"], function(err, data){
            if (err){
                console.log('NPM search error ' + err);
                return;
            } else{
                var currentInfo = checkCurrentVersion();
                for (var key in data) {
                    var obj = data[key];
                    if(obj.name === 'mediacenterjs' && obj.version > currentInfo.version){
                        npm.commands.install([obj.name], function(err, data){
                            if (err){
                                console.log('NPM install error ' + err);
                                return;
                            } else{
                                console.log('Update successfull');
                                server.start();
                            }
                        });
                    } else {
                        console.log('Current version up to date, starting server...')
                        server.start();
                    }
                }
            }
        });
    });
}


server = {
    process: null,
    files: [],
    restarting: false,
    update:false,

    "restart": function() {
        this.restarting = true;
        console.log('Stopping server for restart' .yellow.bold);
        this.process.kill();
        console.log('KILL')
    },
    "start": function() {
        console.log('start')
        var that = this;
        console.log('Starting server' .green.bold);
        that.watchFile();

        this.process = child_process.spawn(process.argv[0], ['index.js']);

        this.process.stdout.addListener('data', function (data) {
            process.stdout.write(data);
        });

        this.process.stderr.addListener('data', function (data) {
            sys.print(data);
        });

        this.process.addListener('exit', function (code) {
            console.log('Child process exited' .yellow.bold);
            this.process = null;
            if (that.restarting) {
                that.restarting === true;
                if(that.update === true){
                    versionUpdate();
                } else {
                    that.start();
                }
            }
        });
    },
    "watchFile": function() {
        var that = this;
		fs.watchFile('./configuration/config.ini', {interval : 500}, function(curr, prev) {
			if (curr.mtime.valueOf() != prev.mtime.valueOf() || curr.ctime.valueOf() != prev.ctime.valueOf()) {
				console.log('Restarting because of changed file' .yellow.bold);
				// give browser time to load finsh page
				setTimeout(function(){
					server.restart();
				},2000);
			}
		});	
		fs.watchFile('./configuration/update.js', {interval : 500}, function(curr, prev) {
			if (curr.mtime.valueOf() != prev.mtime.valueOf() || curr.ctime.valueOf() != prev.ctime.valueOf()) {
				console.log('Restarting because of changed file' .yellow.bold);
                that.update = true;
                console.log('file ipdate', that.update)
				server.restart();
			}
		});	
	}
}

server.start();




