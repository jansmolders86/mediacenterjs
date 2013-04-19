/*
<OWNER> = revolunet
<ORGANIZATION> = revolunet - Julien Bouquillon
<YEAR> = 2010

Copyright (c) 2010, revolunet
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met :


 Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer. 
 Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution. 
 Neither the name of the <ORGANIZATION> nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission. 
THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES ; LOSS OF USE, DATA, OR PROFITS ; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.


*/


// can be overriden



/*


	MODIFIED FOR FRONTBOX BY Jan Smolders


*/

if (typeof(VLC_STATUS)=='undefined') {
    VLC_STATUS = {
        0:'standby'
        ,1:'opening'
        ,2:'buffering'
        ,3:'playing'
        ,4:'paused'
        ,5:'stopped'
        ,6:'ended'
        
    }
}

            var VLCobject = {
                     VLC_PLUGIN:"VLC Multimedia Plug-in"
                    ,VLC_AX:"VideoLAN.VLCPlugin.2"
                    ,VLC_MIME_TYPE:"application/x-vlc-plugin"
                    ,TOOLBAR_HEIGHT:10
                    ,INSTANCES:{}           // holds multiples instances
                    ,UNICODES:{
                        PLAY:'\u25ba'
                       ,PAUSE:'\u2590  \u258c'
                       ,STOP:'\u2588'
                    }
                    ,ua:function() {
                        // browser detection  stuff
                            var w3cdom = typeof document.getElementById != 'undefined' && typeof document.getElementsByTagName != 'undefined' && typeof document.createElement != 'undefined',
                                    u = navigator.userAgent.toLowerCase(),
                                    p = navigator.platform.toLowerCase(),
                                    windows = p ? /win/.test(p) : /win/.test(u),
                                    mac = p ? /mac/.test(p) : /mac/.test(u),
                                    webkit = /webkit/.test(u) ? parseFloat(u.replace(/^.*webkit\/(\d+(\.\d+)?).*$/, "$1")) : false, // returns either the webkit version or false if not webkit
                                    ie = !+"\v1", // feature detection based on Andrea Giammarchi's solution: http://webreflection.blogspot.com/2009/01/32-bytes-to-know-if-your-browser-is-ie.html
                                    playerVersion = [0,0,0],
                                    d = null;
                            if (typeof navigator.plugins != 'undefined' && typeof navigator.plugins[this.VLC_PLUGIN] == 'object') {
                                    d = navigator.plugins[this.VLC_PLUGIN].description;
                                    if (d && !(typeof navigator.mimeTypes != 'undefined' && navigator.mimeTypes[this.VLC_MIME_TYPE] && !navigator.mimeTypes[this.VLC_MIME_TYPE].enabledPlugin)) { // navigator.mimeTypes[VLC_MIME_TYPE].enabledPlugin indicates whether plug-ins are enabled or disabled in Safari 3+
                                            plugin = true;
                                            ie = false; // cascaded feature detection for Internet Explorer
                                            d = d.replace(/^.*\s+(\S+\s+\S+$)/, "$1");
                                            playerVersion[0] = parseInt(d.replace(/^(.*)\..*$/, "$1"), 10);
                                            playerVersion[1] = parseInt(d.replace(/^.*\.(.*)\s.*$/, "$1"), 10);
                                            playerVersion[2] = /[a-zA-Z]/.test(d) ? parseInt(d.replace(/^.*[a-zA-Z]+(.*)$/, "$1"), 10) : 0;
                                    }
                            }
                            else if (typeof window.ActiveXObject != 'undefined') {
                                    try {
                                            var a = new ActiveXObject(this.VLC_AX);
                                            if (a) { // a will return null when ActiveX is disabled
                                                    d = a.GetVariable("$version");
                                                    if (d) {
                                                            ie = true; // cascaded feature detection for Internet Explorer
                                                            d = d.split(" ")[1].split(",");
                                                            playerVersion = [parseInt(d[0], 10), parseInt(d[1], 10), parseInt(d[2], 10)];
                                                    }
                                            }
                                    }
                                    catch(e) {}
                            }
                            return { w3:w3cdom, pv:playerVersion, wk:webkit, ie:ie, win:windows, mac:mac };
                        }()
                        
                    ,createVLC:function(attObj, parObj, id) {
                            var r, el = document.getElementById(id);
                            if (el) {
                                    if (typeof attObj.id == 'undefined') { // if no 'id' is defined for the object element, it will inherit the 'id' from the alternative content
                                            attObj.id = id;
                                    }
                                    if (this.ua.ie && this.ua.win) { // Internet Explorer + the HTML object element + W3C DOM methods do not combine: fall back to outerHTML
                                            var att = "";
                                            for (var i in attObj) {
                                                    if (attObj[i] != Object.prototype[i]) { // filter out prototype additions from other potential libraries
                                                            if (i.toLowerCase() == "data") {
                                                                    parObj.movie = attObj[i];
                                                            }
                                                            else if (i.toLowerCase() == "styleclass") { // 'class' is an ECMA4 reserved keyword
                                                                    att += ' class="' + attObj[i] + '"';
                                                            }
                                                            else if (i.toLowerCase() != "classid") {
                                                                    att += ' ' + i + '="' + attObj[i] + '"';
                                                            }
                                                    }
                                            }
                                            var par = "";
                                            for (var j in parObj) {
                                                    if (parObj[j] != Object.prototype[j]) { // filter out prototype additions from other potential libraries
                                                            par += '<param name="' + j + '" value="' + parObj[j] + '" />';
                                                    }
                                            }
                                            el.outerHTML = '<object classid="clsid:9BE31822-FDAD-461B-AD51-BE1D1C159921"' + att + '>' + par + '</object>';
                                            r = document.getElementById(attObj.id);  
                                    }
                                    else { // well-behaving browsers
                                            var o = document.createElement('object');
                                            o.setAttribute("type", this.VLC_MIME_TYPE);
                                            for (var m in attObj) {
                                                    if (attObj[m] != Object.prototype[m]) { // filter out prototype additions from other potential libraries
                                                            if (m.toLowerCase() == "styleclass") { // 'class' is an ECMA4 reserved keyword
                                                                    o.setAttribute("class", attObj[m]);
                                                            }
                                                            else if (m.toLowerCase() != "classid") { // filter out IE specific attribute
                                                                    o.setAttribute(m, attObj[m]);
                                                            }
                                                    }
                                            }
                                            for (var n in parObj) {
                                                    if (parObj[n] != Object.prototype[n] && n.toLowerCase() != "movie") { // filter out prototype additions from other potential libraries and IE specific param element
                                                            this.createObjParam(o, n, parObj[n]);
                                                    }
                                            }
                                            el.parentNode.replaceChild(o, el);
                                            r = o;
                                    }
                            }
                            return r;
                    }

                    ,createObjParam:function(el, pName, pValue) {
                            var p = document.createElement("param");
                            p.setAttribute("name", pName);  
                            p.setAttribute("value", pValue);
                            el.appendChild(p);
                    }

                    /* Cross-browser SWF removal
                            - Especially needed to safely and completely remove a SWF in Internet Explorer
                    */
                    ,removeVLC:function(id) {
                            var obj = document.getElementById(id);
                            if (obj && obj.nodeName == "OBJECT") {
                                    if (this.ua.ie && this.ua.win) {
                                            obj.style.display = "none";
                                            (function(){
                                                    if (obj.readyState == 4) {
                                                            this.removeObjectInIE(id);
                                                    }
                                                    else {
                                                            setTimeout(arguments.callee, 10);
                                                    }
                                            })();
                                    }
                                    else {
                                            obj.parentNode.removeChild(obj);
                                    }
                            }
                    }

                    ,removeObjectInIE:function(id) {
                            var obj = document.getElementById(id);
                            if (obj) {
                                    for (var i in obj) {
                                            if (typeof obj[i] == "function") {
                                                    obj[i] = null;
                                            }
                                    }
                                    obj.parentNode.removeChild(obj);
                            }
                    }
                    
                    ,embedVLC:function(replaceElemIdStr, widthStr, heightStr, vlcVersionStr, flashvarsObj, parObj, attObj, callbackFn) {
                                        var callbackObj = {success:false, id:replaceElemIdStr};
                                        if (this.ua.w3 && !(this.ua.wk && this.ua.wk < 312) && replaceElemIdStr && widthStr && heightStr) {
                                                //setVisibility(replaceElemIdStr, false);
                                               // addDomLoadEvent(function() {
                                                        widthStr += ""; // auto-convert to string
                                                        heightStr += "";
                                                        var att = {};
                                                        if (attObj && typeof attObj === 'object') {
                                                                for (var i in attObj) { // copy object to avoid the use of references, because web authors often reuse attObj for multiple SWFs
                                                                        att[i] = attObj[i];
                                                                }
                                                        }
                                                     //   att.data = swfUrlStr;
                                                        att.width = widthStr;
                                                        att.height = heightStr;
														att.toolbar = "no"
                                                        var par = {}; 
                                                        if (parObj && typeof parObj === 'object') {
                                                                for (var j in parObj) { // copy object to avoid the use of references, because web authors often reuse parObj for multiple SWFs
                                                                        par[j] = parObj[j];
                                                                }
                                                        }
                                                        if (flashvarsObj && typeof flashvarsObj === 'object') {
                                                                for (var k in flashvarsObj) { // copy object to avoid the use of references, because web authors often reuse flashvarsObj for multiple SWFs
                                                                        if (typeof par.flashvars != 'undefined') {
                                                                                par.flashvars += "&" + k + "=" + flashvarsObj[k];
                                                                        }
                                                                        else {
                                                                                par.flashvars = k + "=" + flashvarsObj[k];
                                                                        }
                                                                }
                                                        }
                                                        if (!vlcVersionStr || hasPlayerVersion(vlcVersionStr)) { // create SWF
                                                                var obj = this.createVLC(att, par, replaceElemIdStr);
                                                                	if (document.all) {
                                                                    
                                                                        obj.style.width = widthStr;
                                                                        obj.style.height= heightStr;
                                                                     }
                                                                if (att.id == replaceElemIdStr) {
                                                                        //setVisibility(replaceElemIdStr, true);
                                                                }
                                                                callbackObj.success = true;
                                                                callbackObj.ref = obj;
                                                        }
                                                       
                                                        else { // show alternative content
                                                                //setVisibility(replaceElemIdStr, true);
                                                        }
                                                        if (callbackFn) { callbackFn(callbackObj); }
                                               // });
                                        }
                                        else if (callbackFn) { callbackFn(callbackObj); }
                                }
                    
                    ,embedPlayer:function(replaceElemIdStr, widthStr, heightStr, add_toolbar) {
                            var tbHeight = add_toolbar?this.TOOLBAR_HEIGHT:0;
                            
                            var plugin_height = (parseInt(heightStr) - tbHeight);
                            $('#' + replaceElemIdStr).html('');
                            $('#' + replaceElemIdStr).height(parseInt(heightStr));
                            var tbar =  "<div id='" + replaceElemIdStr + "-main'  class='x-vlc-main' style='width:" + widthStr + "px;height:" + heightStr + "px' >";
                            tbar += "<div id='" + replaceElemIdStr + "_plugin' class='x-vlc-plugin'></div>";
                            tbar += "<div style='overflow:hide;width:" + widthStr + ";height:" + tbHeight + "' id='" + replaceElemIdStr + "_toolbar', class='x-vlc-toolbar' ></div>";
                            tbar += "</div>";
                            $('#' + replaceElemIdStr).append(tbar )
                            this.embedVLC(replaceElemIdStr + '_plugin', widthStr, plugin_height.toString());
                            if (typeof(this.INSTANCES[replaceElemIdStr]) == 'undefined') {
                                this.INSTANCES[replaceElemIdStr] = playerInstance(replaceElemIdStr);
                            }
                         
                            if (add_toolbar) {
                                this.addToolbar(replaceElemIdStr);
                            }
                            else {
                                $('#' + replaceElemIdStr + '_toolbar').hide(); //default hide toolba
                            }
                             //this.INSTANCES[replaceElemIdStr].addEvents();
                            return this.INSTANCES[replaceElemIdStr];
             
                       }
       
                      
                       ,addToolbar:function(playerId) {
                            if(!playerId) playerId=this.INSTANCES[0];
                            var instance = this.INSTANCES[playerId];
                            var tgt = $('#' + playerId + '_toolbar');
                            tgt.html('');
                            this.createButton(playerId, '&nbsp;&nbsp;', 'x-vlc-btn-play', function(event) {
                                //alert('play '+  event.data.instance.playerId);
                                event.data.instance.togglePlay();
                            });
                            this.createButton(playerId, '&nbsp;&nbsp;', 'x-vlc-btn-stop', function(event) {
                                //alert('stop '+  event.data.instance.playerId);
                                event.data.instance.stop();
                            });
                            instance.createSlider();
                            this.getInstance(playerId).statusChanged();
                            this.createTimer(playerId);
                            this.createButton(playerId, '&nbsp;&nbsp;', 'x-vlc-btn-fullscreen', function(event) {
                                //alert('stop '+  event.data.instance.playerId);
                                event.data.instance.toggleFullscreen();
                            });
                             this.createButton(playerId, '&nbsp;&nbsp;', 'x-vlc-btn-plus', function(event) {
                                //alert('stop '+  event.data.instance.playerId);
                               // event.data.instance.stop();
                               $('#' + instance.playerId + '_about').slideToggle(0);
                            });
                            aboutTxt = "";
                            if (instance.version()) {
                                aboutTxt = 'version de VLC installée : ' + instance.version();
                                
                            }
                            else {
                                var url = "http://www.videolan.org/vlc/";
                                aboutTxt = "VLC non detecté. <a href='" + url + "' target='blank'>cliquez ici pour l'installer</a>";
                              //  console.log("VLC n'a pas été détécté\n\nRendez vous sur http://www.videolan.org/vlc pour le télécharger et l'installer.\n\nCochez les cases Activex/Mozilla pendant l'install");
                            }
                            
                            aboutTxt += '<br>widget crée par <a href="http://www.revolunet.com" target="blank" title="conseil intranet">revolunet</a>. &nbsp;&nbsp;&nbsp;&nbsp;<a href="#" target="blank" >aide</a>';
                            tgt.append('<div id="' + playerId + '_about" class="x-vlc-about" style="display:none" class="x-vlc-about">' + aboutTxt + '</div>');
                            tgt.show();
                       }
                       ,remove:function(playerId) {
                            if(!playerId) playerId=this.INSTANCES[0];
                            delete this.INSTANCES[playerId] ;
                       }
                       ,createButton:function(playerId, html, cls, handler) {
                            var tgt =   $('#' + playerId + '_toolbar');
                            var id = playerId + '_toolbar_btn' + tgt[0].childNodes.length;
                            var btn = "<div id='" + id + "' style='float:left;width:16px;text-align:center;cursor:pointer' class='x-vlc-btn "+cls+"' >" + html + "</div>";
                            tgt.append(btn);
                            var instance = this.getInstance(playerId);
                            if (handler) {
                                $('#' + id).bind('click', {instance: instance}, handler);
                            }
                       }
              
                      
                       
                       ,createTimer:function(playerId) {
                            var tgt =   $('#' + playerId + '_toolbar' );
                            var timer = "<div id='" + playerId + "_timer' style='float:left;text-align:center;width:100px' class='x-vlc-timer'>&nbsp;00:00/00:00&nbsp;</div>"
                            tgt.append(timer);
                       }
                       
                       ,getInstance:function(playerId) {
                            return this.INSTANCES[playerId];
                       }
                        
                
            }
            
            function playerInstance(playerId) {
                var instance = {
                    playerId:playerId
                    ,toolbar: + '_toolbar'
                    ,slider:playerId + '_toolbar_slider'
                    ,sliderCreated:false
                    ,btn_play:playerId + '_toolbar_btn0'
                    ,plugin:playerId + '_plugin'
                    ,timer:playerId + '_timer'
                    ,status:null
                    
                    ,__getPlugin:function() {
                        return $('#' + this.plugin)[0];
                    }
                    
                    // JS API
                    ,version:function() {
                        var plugin = this.__getPlugin();
                        var version = null;
                        if (!plugin) return false;
                        
                           if(navigator.plugins && navigator.mimeTypes.length){
                            var x = navigator.plugins["VLC Multimedia Plug-in"];
                            if(!x) {
                                // test with "old" plugin name
                                x = navigator.plugins["VLC Multimedia Plugin"];
                                }
                            if(!x) {
                                // 0.8.6a at least
                                x = navigator.plugins["VLC multimedia plugin"];
                            }

                            if(x && x.description) {			
                                version = x.description.substring(7, x.description.indexOf(','));
                                
                            }
                          }
                          else {
                              
                             version = plugin.versionInfo;
                            if(typeof(version)=="function") version = plugin.versionInfo();
                            }
                        //alert(version);
                        return version;
                        
                    }
                    ,queue:function(uri) {
                         var plugin = this.__getPlugin();
                         if (!plugin) {
                            setTimeout("VLCobject.getInstance('" + this.playerId + "').play('" + uri + "');", 500);
                            return;
                        }
                        var options = this.options.get();
                        var id = plugin.playlist.add(uri, uri, options);
                       // plugin.playlist.playItem(id);
                         
                    }
                    ,play:function(uri) {
                        var plugin = this.__getPlugin();
                        if (!plugin) {
                            setTimeout("VLCobject.getInstance('" + this.playerId + "').play('" + uri + "');", 500);
                            return;
                        }
                        var options = this.options.get();
                        this.statusCheckStart();
                        if (uri) {
                            var id = plugin.playlist.add(uri, uri, options);
                        
                            plugin.playlist.playItem(id);
                            }
                        else {
                            plugin.playlist.play();
                        }
                        
                    }
                    ,seek:function(percentage) {
                        var plugin = this.__getPlugin();
                        if (plugin.input.length > 0) {
                            plugin.input.time = plugin.input.length * percentage / 100;
                        }
                    }
                    ,toggleFullscreen:function() {
                        var plugin = this.__getPlugin();
                        plugin.video.toggleFullscreen();
                        //plugin.video.fullscreen();
                    }
                    ,togglePlay:function() {
                        var plugin = this.__getPlugin();
                        if (plugin.playlist.isPlaying) {
                             plugin.playlist.togglePause();
                        }
                        else {
                             plugin.playlist.play();
                        }
                        this.statusCheckStart();
                        //plugin.playlist.togglePause();
                        
                    }
                    ,stop:function() {
                        var plugin = this.__getPlugin();
                        plugin.playlist.stop();
                        //this.statusCheckStop();
                        // timeout to ensure to get last events
                        
                        setTimeout("VLCobject.getInstance('" + this.playerId + "').statusCheckStop();", 1000);
                    }
                    ,options:{
                         set:function(name, value) {
                             this.items[name] = value || null;
                        }
                        ,del:function(name) {
                             delete this.items[name];
                            }

                        ,clear:function() {
                              this.items = new Array();
                            }
                            
                        // internal use only
                        ,items:{}
                        ,get:function() {
                            var tmp_array = new Array();
                            var debug_str = "";
                            var idx = 0;
                            for (var i in this.items)
                            {
                                var option_str = ":" + i;
                                if (this.items[i]) option_str += "=" + this.items[i];
                                tmp_array[idx] = option_str;
                                debug_str += option_str + " ";
                                idx += 1;
                            }
                            if (document.all) return tmp_array;
                            return debug_str;
                        }
                    
                    }
                    
          
                    // private status stuff
                   
                    ,statusChanged:function() {
                        if (!this.status) {
                            this.setStatusText(VLC_STATUS[0]);
                            var width = this.getSliderLength();
                            var tb =   $('#' +this.playerId + '_toolbar_slider' );
                            tb.width(width);
                            
                            return;
                        }
                        if (this.status == 3) {
                            // playing
                            //if(!this.sliderCreated)  this.setStatusText('playing');
                            this.setPlaying(true);
                        }
                        else {
                            this.setPlaying(false);
                            if (this.sliderCreated && this.status != 4) {
                                 this.updateSlider(0);
                            }
                            if ((this.status == 0 || this.status == 5 || this.status == 6) ) {
                                this.setStatusText(VLC_STATUS[this.status]);
                                this.sliderCreated  = false;
                            }
                            
                     }
               
                        if(!this.sliderCreated)  this.setStatusText(VLC_STATUS[this.status]);
                        return;
       
                    }
                     ,setPlaying:function(playing) {
                            var tgt = $('#' + this.playerId + '_toolbar_btn0');
                               
                                if (playing) {
                                     tgt.removeClass( 'x-vlc-btn-play' );
                                    tgt.addClass( 'x-vlc-btn-pause' );
                                   if(!this.sliderCreated)  this.setStatusText('playing');
                                }
                                else {
                                    tgt.removeClass( 'x-vlc-btn-pause' );
                                    tgt.addClass( 'x-vlc-btn-play' );
                                   if(!this.sliderCreated)  this.setStatusText('paused');
                                }
                            
                             
                       }
                    ,statusCheck:function() {
                   
                        var plugin = this.__getPlugin();
                        if (!plugin.input) return;
                         var status = plugin.input.state;
                            if (status != this.status) {
                                 this.status = status;
                                 this.statusChanged();
                            }
                        if (plugin.playlist.isPlaying) {
                             
                            this.updatePosition(plugin.input.time / 1000, plugin.input.length / 1000)
                
                            }
                           
                    }
                    ,statusCheckStart:function() {
                        this.statusCheckStop();
                        this.statusCheckTimer = setInterval("VLCobject.getInstance('" + this.playerId + "').statusCheck();", 300);
                    }
                    ,statusCheckStop:function() {
                        clearTimeout(this.statusCheckTimer);
                    }   
                    ,secsToTime:function(secs)  {
                        if (secs == 0) {
                            return '00:00'
                        }
                        var secs = parseInt(secs );
                        var mins = 0;
               
                        if (secs > 60) {
                            mins = Math.floor(secs / 60);
                            secs = parseInt((secs - (mins*60)));
                        }
 
                    
                        return this.pad(mins,2) + ':' + this.pad(secs, 2) ;
                    }
                    ,pad:function(number, length) {
                           
                            var str = '' + number;
                            while (str.length < length) {
                                str = '0' + str;
                            }

                            return str;

                        }
                    ,getSliderLength:function() {
                        var l = ($('#'+this.plugin).width() - (105 + 100) ); 
                        return l;
                    }
                    ,updateSlider:function(percentage) {
                        var td1 = $('#' + this.slider +' :first-child  :first-child :first-child');
                        var td3 = $('#' + this.slider +' :first-child  :first-child :last-child');
                       
                        var offset = this.getSliderLength();
                        var w= offset  * percentage ;
                        td1.width(w);
                        w= offset  * (1-percentage) ;
                        td3.width(w);
                    }
                    ,setStatusText:function(txt) {
                        this.sliderCreated = false;
                        var tb =   $('#' +this.playerId + '_toolbar_slider' );
                        tb.html(txt); 
                    }
                    ,updatePosition:function(position, length) {
                        // update timer
                         $('#' + this.timer).html(this.secsToTime(position) + '/' + this.secsToTime(length));
                        var tb =   $('#' +this.playerId + '_toolbar_slider' );
                        if (length == 0) {
                            //var width = ($('#'+this.plugin).width() - 4 - 50 - $('#'+this.timer).width() );
                            var width = this.getSliderLength();
                            tb.width(width);
                            this.sliderCreated = false
                            if (position<1) this.statusChanged(); // force display stattus at startup
                        }
                        else {
                            this.createSlider(); 
                            this.updateSlider(position/length);
                        }
                    }
                    // UI
                  
                    ,onSliderClick:function(event) {
                            var slider = $('#' + event.data.instance.slider);
                            var x = event.pageX;
                            var y = event.pageY;
                            var x_offset = x - slider.position().left;
                            var percentage = x_offset * 100 / slider.width();
                            event.data.instance.updateSlider(x_offset/slider.width());
                            event.data.instance.seek(percentage);
                           
                            
                       }
                    ,createSlider:function() {
                           if ($('#' + slider_id).length > 0 && $('#' + table_id).length > 0) return;
                            var offset = this.getSliderLength();
                            var slider_id=  this.playerId + '_toolbar_slider'; 
                            var table_id=  this.playerId + '_toolbar_slider_tb'; 
                            
                            var progress = "<table id='" + table_id + "' border=0 style='margin-top:5px;height:10px;cursor:pointer;display:inline' cellpadding=0 cellspacing=0 ><tr ><td width='0' class='x-vlc-slider'></td><td class='x-vlc-slider-thumb'></td><td width='" + (offset) + "' class='x-vlc-slider'></td></tr></table>";
                            
                            if ($('#' + slider_id).length == 0) {
                                // div not preset exists
                                var tgt =   $('#' + this.playerId + '_toolbar' );
                                var slider = "<div id='" + slider_id + "' width='" + (offset + 4)+"'  style='text-align:center;float:left;height:10px'>";
                                //slider += progress
                                slider += "</div>";
                                tgt.append(slider);
                                $('#' + slider_id).bind('click', {instance:this}, this.onSliderClick);
                            }
                            
                            if ($('#' + table_id).length == 0) {
                                var slider = $('#' + slider_id );
                                slider.html('');
                                slider.append(progress);
                            }
                            
                            this.sliderCreated = true;
                       }
                    
                    
                }
                
                return instance;
            }
            
                
          if (!window.opera && document.all ) {
                if (!VLCobject.unloadSet) {
                    VLCobject.prepUnload = function() {
                        __vlc_unloadHandler = function(){};
                        __vlc_savedUnloadHandler = function(){};
                            window.attachEvent("onunload", VLCobject.cleanupVLCs);
                    }
                    window.attachEvent("onbeforeunload", VLCobject.prepUnload);
                    VLCobject.unloadSet = true;
                }
            }
            
           VLCobject.cleanupVLCs = function() {
                for (i in this.INSTANCES) {
                    i.stop();
                }
                var objects = document.getElementsByTagName("OBJECT");
                for (var i = objects.length - 1; i >= 0; i--) {
                    objects[i].style.display = 'none';
                    for (var x in objects[i]) {
                        if (typeof objects[i][x] == 'function') {
                            objects[i][x] = function(){};
                        }
                    }
                }
            }
            