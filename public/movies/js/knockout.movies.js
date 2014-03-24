
addEventListener('load', function () {
    var url= '/movies/loadItems';

    doAjaxCall(url, function(data){
        var incommingDataFromServer = data;
        var dataFromServer = ko.utils.parseJson(incommingDataFromServer);

        mappedData = ko.utils.arrayMap(dataFromServer, function(item) {
            return new Movie(item);
        });

        viewModel = {
            movies: ko.observableArray([])
        };

        viewModel.movies(mappedData);

        ko.applyBindings(viewModel);

        // Init Jquery plugin
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

function Movie(item) {
    var that = this;
    this.original_name 	= ko.observable(item.original_name);
    this.movieTitle     = ko.observable(item.title);
    this.posterImage 	= ko.observable(item.poster_path);
    this.backdropImage	= ko.observable(item.backdrop_path);
    this.genre 			= ko.observable(item.genre);
    this.runtime 		= ko.observable(item.runtime);
    this.overview 		= ko.observable(item.overview);
    this.cdNumber 		= ko.observable(item.cdNumber);
    this.adult   		= ko.observable(item.adult);
    this.isActive 		= ko.observable();
    this.playMovie = function () {
        that.isActive('active');
        var movieTitle = that.original_name();
        $('body').mcjsplay('playMovie',movieTitle);
    };
}