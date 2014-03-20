
addEventListener('load', function () {
    var url= '/music/loadItems';

    doAjaxCall(url, function(data){
        var incommingDataFromServer = data;
        var dataFromServer = ko.utils.parseJson(incommingDataFromServer);

        mappedData = ko.utils.arrayMap(dataFromServer, function(item) {
            return new Album(item);
        });

        viewModel = {
            album: ko.observableArray([])
        };

        viewModel.album(mappedData);

        ko.applyBindings(viewModel);

        //  Init Jquery plugins
            $('body').mcjsm();
        //  $('body').mcjsplay();

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
    this.album 	        = ko.observable(item.album);
    this.artist  	    = ko.observable(item.artist);
    this.year		    = ko.observable(item.year);
    this.cover 		    = ko.observable(item.cover);
    this.tracks 		= ko.observableArray(item.tracks);
}