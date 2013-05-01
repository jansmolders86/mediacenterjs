module.exports = function(obj, name) {
	for (var key in obj) {
		switch (key) {	
			case 'play':
			method = 'get';
			path = '/' + name + '/video/:filename';
			break;
		}
	}
}