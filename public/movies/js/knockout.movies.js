
addEventListener('load', function () {
    doAjaxCall('/movies/loadItems', function(data){
        var dataFromServer = ko.utils.parseJson(data);

        mappedData = ko.utils.arrayMap(dataFromServer, function(item) {
            return new Movie(item);
        });

        viewModel = {
            movies: ko.observableArray([])
        };

        viewModel.movies(mappedData);

        ko.applyBindings(viewModel);

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
    this.localName 		= ko.observable(item.localName);
    this.posterImage 	= ko.observable(item.poster_path);
    this.backdropImage	= ko.observable(item.backdrop_path);
    this.genre 			= ko.observable(item.genre);
    this.runtime 		= ko.observable(item.runtime);
    this.overview 		= ko.observable(item.overview);
    this.title 			= ko.observable(item.title);
    this.cdNumber 		= ko.observable(item.cdNumber);
    this.adult   		= ko.observable(item.adult);
    this.playMovie = function (data, event) {
        var previousCount = this.title();
        console.log('click', previousCount)

        //_playMovie(o,url,movieTitle);
    };
}