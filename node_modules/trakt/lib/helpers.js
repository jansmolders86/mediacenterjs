var api = require('./api-actions.js');

module.exports = {
	apiMethod: function(action, method) {
		if (!api[action]) return undefined;

		for (var i = 0; i < api[action].length; i++) {
			if (api[action][i].method == method) {
				return api[action][i]
			}
		}
		return undefined
	}
}

