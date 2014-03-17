
addEventListener('load', function () {
    var url= '/tv/loadItems';

    doAjaxCall(url, function(data){
        var incommingDataFromServer = data;
        if(incommingDataFromServer === null ||  incommingDataFromServer == '') {
            console.log('Waiting...')
        }
        else if(incommingDataFromServer === 'Done' ){
            location.reload();
        }  else {
            var dataFromServer = ko.utils.parseJson(incommingDataFromServer);

            mappedData = ko.utils.arrayMap(dataFromServer, function(item) {
                return new tvShow(item);
            });

            viewModel = {
                tvShows: ko.observableArray([])
            };

            viewModel.tvShows(mappedData);

            ko.applyBindings(viewModel);
            $('body').mcjstv();
            $('body').mcjsplay();
        }
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

function tvShow(item) {
    var that = this;
    this.title 	        = ko.observable(item.title);
    this.banner         = ko.observable(item.banner);
    this.genre 	        = ko.observable(item.genre);
    this.certification	= ko.observable(item.certification);
    this.showEpisodes = function () {
        var showTitle = that.title();
        $('body').mcjstv('getEpisodes',showTitle);
    };
}
