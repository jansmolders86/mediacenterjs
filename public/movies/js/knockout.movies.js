
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

    });
});

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
    this.playMovie      = function () {
        that.isActive('active');
        var movieTitle = that.original_name()
            , fileName              =   movieTitle   
            , outputFile            =   fileName.replace(/ /g, "-")
            , extentionlessFile     =   outputFile.replace(/\.[^/.]+$/, "")
            , videoUrl              =   "/data/movies/"+extentionlessFile+".mp4"
            , subtitleUrl           =   "/data/movies/"+extentionlessFile+".srt"  
            , playerID              =   'player'
            , homeURL               =   '/movies/';

        doAjaxCall('/movies/'+movieTitle+'/play', function(data){
            var movieData = JSON.parse(data);     
            videoJSHandler(playerID, movieData, videoUrl, subtitleUrl, movieTitle, homeURL, 5000);
        });
    };
}

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
