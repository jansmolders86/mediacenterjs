$(function() {




    if($('body').hasClass('homepage')){

        $('.tile[class*=mediacenterjs-]').addClass('plugin');

        $('.tile a').on('click', function(e){
            e.preventDefault();
            var that = $(this);
            that.parent().addClass('grow');
            setTimeout(function(){
                var url = that.attr('href');
                window.location.href = url;
            },100);
        });

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
