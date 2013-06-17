module.exports = process.env.TEST_COV
	? require('./lib-cov/trakt.js')
	: require('./lib/trakt.js')
	