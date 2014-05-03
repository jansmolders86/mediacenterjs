$(function() {
    
    var plugins = []
    $('.tile').each(function(){
       var plugin = $(this).find('span:contains("mediacenterjs-")').text();
       plugins.push(plugin);
       $(this).find('span:contains("mediacenterjs-")').parent().parent().remove();
    });
    

    $('.tile').find('span:contains("plugins")').parent().append('<ul id="pluginlist"></ul>');
    
    
    for(vari=0; i<plugins.length;i++){
        $('#pluginlist').append('<li><a href="'+plugins[i]+'">'+plugins[i]+'</a></li>')
    }


});