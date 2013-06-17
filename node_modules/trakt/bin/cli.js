#!/usr/bin/env node
var Trakt = require('../index.js');
var Helper = require('../lib/helpers.js')
var pjson = require('../package.json');
var api = require('../lib/api-actions.js')
var optimist = require('optimist')
	.usage('Usage: $0 [options] <action> <method> [--<argument> <value>]')
	.alias('u', 'user')
	.alias('p', 'pass')
	.alias('h', 'help')
	.alias('v', 'version')

optimist.usage('Node wrapper for Trakt API\n\nUsage: $0 [options] <action> <method> [--<parameter> <value>]', {
	'version': {
		description: 'output version information',
		short: 'v'
	},
	'help': {
		description: 'this help text',
		short: 'h'
	},
	'user': {
		description: 'Trakt username to use with API calls',
		short: 'u'
	},
	'pass': {
		description: 'Trakt password to use with API calls',
		short: 'p'
	},
	'passhash': {
		description: 'indicates that password is in sha1 format',
	},
	'pretty': {
		description: 'pretty print result json'
	}
})
var argv = optimist.argv

if (argv.v) {
	console.log(pjson.version)
	process.exit()
}
if (argv.h) {
	showHelp()
	process.exit()
}
if (argv._.length < 2) {
	console.error('Missing actions or method');
	showHelp()
	process.exit(1);
}

var action = undefined
var method = undefined

if (api[argv._[0]]) {
	var a = Helper.apiMethod(argv._[0], argv._[1])
	if (a) {
		action = argv._[0]
		method = argv._[1]

	} else {
		console.error('Invalid method')
		process.exit(1)
	}
} else {
	console.error('Invalid action');
	process.exit(1)
}

var trakt = new Trakt({username: argv.user, password: argv.pass, pass_hash: argv.passhash}); 

trakt.on('error', function(err) {
	console.log("Trakt error: " + err.message)
})

trakt.request(action, method, argv, function(err, result) {
	if (argv.pretty) {
		result = JSON.stringify(result, null, 4)
	}
	if (err) {
		console.log(err);
		if (result) {
			console.log(result);
		}
	} else {
		console.log(result);
	}
})


function showHelp() {
	optimist.showHelp()
	console.log("Commands:")
	console.log("  <action>\tBase name of the method in API call")
	console.log("  <method>\tRest of the method name")
	console.log("  <argument>\tName of the argument for API call")
	console.log("  <value>\tValue for the argument")
	console.log()
	console.log("Examples:")
	console.log(" $ trakt search shows --query 'american dad'")
	console.log("\t- Searches Trakt for shows named 'continuum' and 'american dad'")
	console.log(" $ trakt -u username -p password account settings")
	console.log("\t- Fetches users settings")

}
