$(function(){
    //Remote QR code
    // TODO: make this angular
    //$('#tiles').append('<li mcjs-library-item class="tile remote mcjs-rc-controllable col-md-2 col-xs-1"><a href="" id="qrcode" class="mcjs-rc-clickable"><span>Remote</span></a></li>');
    $('.tile.remote').hide();
    $.ajax({
        url: '/ip',
        type: 'get',
        dataType: 'json'
    }).done(function(data){
        var url = location.protocol + '//' + data[0] + ':' + location.port + '/remote/';
        var a = $('.tile.remote a');
        a.attr('href', url);
        new QRCode(a[0], url);
        $('.tile.remote').show();
    });
});
