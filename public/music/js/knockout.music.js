
addEventListener('load', function () {
    var url= '/music/loadItems';

    doAjaxCall(url, function(data){
        var incommingDataFromServer = data;
        console.log(incommingDataFromServer)

        var dataFromServer = ko.utils.parseJson(incommingDataFromServer);

        mappedData = ko.utils.arrayMap(dataFromServer, function(item) {
            return new Album(item);
        });

        viewModel = {
            album: ko.observableArray([])
        };

        viewModel.album(mappedData);

        ko.applyBindings(viewModel);

        // Init Jquery plugins
        $('body').mcjsm();
        $('body').mcjsplay();

    });
});


function doAjaxCall(url, callback){
    var xmlhttp;
    xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function(){
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200){
            callback(xmlhttp.responseText);
        }
    }
    xmlhttp.open("GET", url, true);
    xmlhttp.send();
}

function Album(item) {
    var that            = this;
    this.localName 	    = ko.observable(item.localName);
    this.cover  	    = ko.observable(item.cover);
    this.title		    = ko.observable(item.title);
    this.year 		    = ko.observable(item.year);
    this.genre 		    = ko.observable(item.genre);
    this.viewDetails    = ko.observable(false);
    this.tracks 	    = ko.observableArray(item);
    this.showAlbum  = function () {
        that.viewDetails(false);
        var album = that.localName();
        o.currentAlbum = album;

        if(that.isSingle() === true){
            _playSingle(o, album);
        } else {
            that.viewDetails(true);
            if(that.viewDetails(true) ){
                $(o.musicListSelector+' > li').hide();
            }

        }
    };
}r