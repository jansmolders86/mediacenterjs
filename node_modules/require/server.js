var http = require('http')
var fs = require('fs')
var path = require('path')
var extend = require('std/extend')
var isObject = require('std/isObject')
var getDependencyLevels = require('./lib/getDependencyLevels')
var getRequireStatements = require('./lib/getRequireStatements')
var getCode = require('./lib/getCode')
var resolve = require('./lib/resolve')

module.exports = {
	listen: listen,
	mount: mount,
	connect: connect,
	isRequireRequest: isRequireRequest,
	handleRequest: handleRequest
}

function listen(portOrOpts) {
	var _opts = (isObject(portOrOpts) ? portOrOpts : { port:portOrOpts || 1234 })
	opts.handleAllRequests = true
	mount(http.createServer(), _opts).listen(opts.port, opts.host)
}

function mount(server, _opts) {
	setOpts(_opts)
	return server.on('request', _checkRequest)
}

function connect(opts) {
	setOpts(opts)
	return _checkRequest
}

function _checkRequest(req, res, next) {
	if (isRequireRequest(req) || opts.handleAllRequests) {
		handleRequest(req, res)
	} else {
		next && next()
	}
}

function isRequireRequest(req) {
	return req.url.substr(1, opts.root.length) == opts.root
}

/* options
 *********/
var opts = {
	path: process.cwd(),
	root: 'require',
	port: null,
	host: null
}
function setOpts(_opts) { opts = extend(_opts, opts) }
function getUrlBase() {
	var basePort = (!opts.usePagePort && opts.port)
	if (opts.host && basePort) {
		return '//' + opts.host + ':' + basePort + '/' + opts.root + '/'
	} else {
		return '/' + opts.root + '/'
	}
}

/* request handlers
 ******************/
function handleRequest(req, res) {
	var reqPath = _normalizeURL(req.url).substr(opts.root.length + 2)
	if (reqPath.match(/\.js$/)) {
		_handleModuleRequest(reqPath, res)
	} else {
		_handleMainModuleRequest(reqPath, req, res)
	}

	function _normalizeURL(url) {
		return url.replace(/\?.*/g, '').replace(/\/js$/, '.js')
	}
}

function _handleMainModuleRequest(reqPath, req, res) {
	var mainModulePath = resolve.path('./' + reqPath, opts.path)
	if (!mainModulePath) { return _sendError(res, 'Could not find module "'+reqPath+'" from "'+opts.path+'"') }

	try { var dependencyTree = getDependencyLevels(mainModulePath) }
	catch(err) { return _sendError(res, 'in getDependencyLevels: ' + (err.message || err)) }

	var response = [
		'__require__ = {',
		'	urlBase: "'+getUrlBase()+'",',
		'	levels: '+JSON.stringify(dependencyTree)+',',
		'	loadNextLevel: '+(function() {
				if (!__require__.levels.length) { return } // all done!
				var modules = __require__.currentLevel = __require__.levels.shift()
				var head = document.getElementsByTagName('head')[0]
				for (var i=0; i<modules.length; i++) {
					var url = location.protocol + '//' + location.host + __require__.urlBase + modules[i]
					head.appendChild(document.createElement('script')).src = url
				}
			}).toString()+',',
		'	onModuleLoaded: '+(function() {
				__require__.currentLevel.pop()
				if (__require__.currentLevel.length) { return }
				__require__.loadNextLevel()
			}).toString()+',',
		'}',
		'__require__.loadNextLevel()'
	]

	var buf = new Buffer(response.join('\n'))
	res.writeHead(200, { 'Cache-Control':'no-cache', 'Expires':'Fri, 31 Dec 1998 12:00:00 GMT', 'Content-Length':buf.length, 'Content-Type':'text/javascript' })
	res.end(buf)
}

function _asString(fn) { return fn.toString() }

function _handleModuleRequest(reqPath, res) {
	try { var code = _getModuleCode(res, reqPath) }
	catch(err) { return _sendError(res, err.stack || err) }

	code += '\n\n__require__.onModuleLoaded()'
	
	var buf = new Buffer(code)
	res.writeHead(200, { 'Cache-Control':'no-cache', 'Expires':'Fri, 31 Dec 1998 12:00:00 GMT', 'Content-Length':buf.length, 'Content-Type':'text/javascript' })
	res.end(buf)

	function _getModuleCode(res, reqPath) {
		var code = getCode(reqPath)
		var requireStatements = getRequireStatements(code)

		try {
			each(requireStatements, function(requireStmnt) {
				var depPath = resolve.requireStatement(requireStmnt, reqPath)
				if (!depPath) { throw 'Could not resolve module' }
				code = code.replace(requireStmnt, '__require__["'+depPath+'"]')
			})
		} catch(e) {
			_sendError(res, e.message || e)
		}

		var _closureStart = ';(function() {'
		var _moduleDef = 'var module={exports:{}};var exports=module.exports;'
		var _closureEnd = '})()'
		return _closureStart + _moduleDef + '   ' + code + // all on the first line to make error line number reports correct
			'\n__require__["'+reqPath+'"]=module.exports ' + _closureEnd
	}
}

function _sendError(res, msg) {
	if (msg) { msg = msg.replace(/\n/g, '\\n').replace(/"/g, '\\"') }
	res.writeHead(200)
	res.end('alert("error: ' + msg + '")')
}
