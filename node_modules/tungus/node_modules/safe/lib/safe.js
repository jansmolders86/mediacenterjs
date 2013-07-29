/**
 * Module provides set of handy function to deal with thrown errors, callbacks and
 * nodejs alike error passing (first function argument). 
 * 
 * The goal is to make code more stable (by catching thrown exception) and avoid
 * some routine calls. Idea is inspired in Step library which catches error and
 * convert them into callback function calls. Async library which appears more
 * handy for dealing with async functions (has reacher functionality)  missing this.
 * With safe library it is easy to plug-in this when required.
 * 
 * Function are kind of chainable, so instead of `safe.trap(safe.sure(function () {} ))`
 * it is possible to use `safe.trap_sure(function() {})`
 * 
 * ### Plain poor code:
 * 	async.series([
 * 		function (callback) {
 * 			// .. do something that can throw error
 * 			// BAD: some dirty code can throw exception here
 * 			// which breaks nodejs server
 * 			async.forEach(array, function (e, callback2) {
 * 				some.getSome(e.id, function (err, some) {
 * 					// BAD: err is not checked 
 * 					// .. process some
 * 					// BAD: boring code
 * 					callback2();
 * 				})
 * 			},callback)
 * 		}]
 * 
 * 
 * ### Plain good code:
 * 	async.series([
 * 		function (callback) {
 * 			try {
 * 				// .. do something that can throw error
 * 				// .. note ANY CODE CAN DO in some conditions
 * 				async.forEach(array, function (e, callback2) {
 * 					some.getSome(e.id, function (err, some) {
 * 						try {
 * 							if (err) return callback2(err);
 * 							// .. process some
 * 							callback2();
 * 						} catch (err) {
 * 							callback2(err);
 * 						}
 * 					})
 * 				},callback)
 * 			} catch (err) {
 * 				callback(err);
 * 			}
 * 		}]
 * 
 * ###  Safe enhanced good code:
 * 	async.series([
 * 		safe.trap(function (callback) {
 * 			async.forEach(array, function (e, callback2) {
 * 				some.getSome(e.id, safe.trap_sure_results(callback2, function (some) {
 * 					// .. process some
 * 				});
 * 			},callback)
 * 		}
 */

/**
 * Transform synchronious function call result to callback
 * 
 * _callback is optional, when omited (function get one parameter) it assumes
 * callback as last parameter of wrapped function_
 *
 * @param {Function} callback or wrapped function
 * @param {Function} fn wrapped function
 */
function result(callback,fn) {
	return function () {
		if (fn == undefined) {
			fn = callback;
			callback = arguments[arguments.length-1];
		}
		
		var result = fn.apply(this, arguments);
		if (result != undefined)
			callback(null, result);
		else
			callback(null);
	}
}


/**
 * Strip (hide) first parameter from wrapped function and ensure that
 * controll is passed to it when no error happpens. I.e. it does do
 * routine error check `if (err) return callback(err)`
 *
 * _callback is optional, when omited (function get one parameter) it assumes
 * callback as last parameter of wrapped function_
 *
 * @param {Function} callback or wrapped function
 * @param {Function} wrapped function
 */
function sure (callback,fn) {
	return function () {
		if (fn == undefined) {
			fn = callback;
			callback = arguments[arguments.length-1];
		}
		if (arguments[0])
			callback(arguments[0])
		else
			fn.apply(this, Array.prototype.slice.call(arguments,1));
	}
}

/**
 * Wrap function call into try catch, pass thrown error to callback
 * 
 * _callback is optional, when omited (function get one parameter) it assumes
 * callback as last parameter of wrapped function_
 *
 * @param {Function} callback or wrapped function
 * @param {Function} fn wrapped function
 */
function trap (callback,fn) {
	return function () {
		if (fn == undefined) {
			fn = callback;
			callback = arguments[arguments.length-1];
		}
		try {
			fn.apply(this, arguments);
		}
		catch (err) {
			callback(err);
		}
	}
}

/**
 * Run function with provided callback. Just help to have better readability.
 *
 * @param {Function} wrapped function
 * @param {Function} callback
 */
module.exports.run = function (fn,cb) {
	return fn.apply(this, [cb])
}

var later = (typeof setImmediate === "undefined")? (typeof process === "undefined" ? function (cb) {setTimeout(cb,0)} : process.nextTick):setImmediate;

/**
 * Run provided callback in next tick of event loop. This is what for
 * process.nextTick was usually used. However for very strange reason
 * starting from node v10 it fails when called recursively. 
 * 
 * To be honest its failry stupid because now process.nextTick became
 * useless because will it work or not depends on callee. It was honest
 * just to say to stop use process.nextTick.
 * 
 * Anyway it usually was used to break recursion or to maintain async
 * behavior when function return something right away without calling
 * trully async function (IO mostly). It was required to write something
 * like:
 * 
 *	if (cached)
 * 		return process.nextTick(function () {callback(null,cached})
 * 
 * with back:
 * 
 *	if (cached)
 *		return safe.back(cb,null,cached) 
 *
 * @param {Function} callback
 * @param argument1
 * @param argumentN
 */
module.exports.back = function () {
    var cb = arguments[0];
    var args = 	Array.prototype.slice.call(arguments,1,arguments.length);
    later(function () {
		cb.apply(this,args)
    })
}

/**
 * Empty function, does nothing
 */
module.exports.noop = function () {}

/**
 * Yields execution of function giving chance to other stuff run
 * 
 * @param {Function} callback
 */
module.exports.yield = later;

/**
Psevdo chains
*/
module.exports.trap_sure = function (callback,fn) {
	return function () {
		if (fn == undefined) {
			fn = callback;
			callback = arguments[arguments.length-1];
		}
		if (arguments[0])
			return callback(arguments[0])
		try {
			fn.apply(this, Array.prototype.slice.call(arguments,1));
		}
		catch (err) {
			callback(err);
		}
	}	
}

module.exports.trap_sure_result = function (callback, fn) {
	return function () {
		if (fn == undefined) {
			fn = callback;
			callback = arguments[arguments.length-1];
		}
		if (arguments[0])
			return callback(arguments[0])
		var result;
		try {
			result = fn.apply(this, Array.prototype.slice.call(arguments,1));
		}
		catch (err) {
			return callback(err);
		}
		if (result != undefined)
			callback(null, result);
		else
			callback(null);
	}	
}

module.exports.sure_result = function (callback,fn) {
	return function () {
		if (fn == undefined) {
			fn = callback;
			callback = arguments[arguments.length-1];
		}
		if (arguments[0])
			return callback(arguments[0])
		var result = fn.apply(this, Array.prototype.slice.call(arguments,1));
		if (result != undefined)
			callback(null, result);
		else
			callback(null);
	}	
}

/**
Module exports
*/ 
module.exports.trap = trap;
module.exports.sure = sure;
module.exports.result = result;
