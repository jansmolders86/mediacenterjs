$(function(){
    //Remote QR code
    // TODO: make this angular
    $('#tiles').append('<li class="tile remote mcjs-rc-controllable col-md-2 col-xs-1"><a href="" id="qrcode" class="mcjs-rc-clickable"><span>Remote</span></a></li>');
    $('.tile.remote').hide();
    $.ajax({
        url: '/ip',
        type: 'get',
        dataType: 'json'
    }).done(function(data){
        var url = location.protocol + '//' + data[0] + ':' + location.port + '/remote/';
        $('#qrcode').attr('href', url);
        new QRCode(document.getElementById("qrcode"), url);
        $('.tile.remote').show();
    });
});
