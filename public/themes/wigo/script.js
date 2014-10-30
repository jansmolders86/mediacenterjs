$(function() {


    if($('body').hasClass('homepage')){

        $('.tile[class*=mediacenterjs-]').addClass('plugin')

        var index = 0;
        var length = $("ul").children().length;
        var delays = [
            200,
            100,
            200,
            100
        ];

        function delayNext(){
            setTimeout(function() {
                $("ul li:eq(" + index + ")").show().addClass("flipin");
                index++;

                if (index == length)
                    index = 0;

                delayNext();
            }, delays[index]);
        }

        delayNext();
    }


});
