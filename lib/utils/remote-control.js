/*
    MediaCenterJS - A NodeJS based mediacenter solution

    Copyright (C) 2014 - Jan Smolders

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
exports.remoteControl = function() {
    var ss;
    var io = require('./setup-socket').io;
    var logger = require('winston');

    io.set('log level', 1);

    io.sockets.on('connection', function (socket) {
        socket.on("screen", function(data){
            socket.type = "screen";
            ss = socket;
            logger.info("Screen ready...");
        });

        socket.on("remote", function(data){
            socket.type = "remote";
            logger.info("Remote ready...");
        });

        socket.on("control", function(data){
            if(socket.type === "remote"){
                switch(data.action) {
                    case "enter" :
                        if(ss !== undefined){
                            ss.emit("controlling", {action:"enter"});
                        }
                    break;
                    case "dashboard" :
                        if(ss !== undefined){
                            ss.emit("controlling", {action:"dashboard"});
                        }
                    break;
                    case "mute" :
                        if(ss !== undefined){
                            ss.emit("controlling", {action:"mute"});
                        }
                    break;
                    case "shuffle" :
                        if(ss !== undefined){
                            ss.emit("controlling", {action:"shuffle"});
                        }
                    break;
                    case "back" :
                        if(ss !== undefined){
                            ss.emit("controlling", {action:"back"});
                        }
                    break;
                    case "pause" :
                        if(ss !== undefined){
                            ss.emit("controlling", {action:"pause"});
                        }
                    break;
                    case "fullscreen" :
                        if(ss !== undefined){
                            ss.emit("controlling", {action:"fullscreen"});
                        }
                    break;
                    case "goLeft" :
                        if(ss !== undefined){
                            ss.emit("controlling", {action:"goLeft"});
                        }
                    break;
                    case "goRight" :
                        if(ss !== undefined){
                            ss.emit("controlling", {action:"goRight"});
                        }
                    break;
                }
            }
        });

        socket.on("message", function(data){
            if(socket.type === "remote"){
                if(ss !== undefined){
                    ss.emit("sending", data);
                }
            }
        });


    });
}
