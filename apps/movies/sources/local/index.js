exports.serviceName = "local";
exports.requiredSettings = [
    { name : 'path', type : 'text'}
];
exports.retrieveMovies = function (callback, settings) {
    if (!settings) {
        callback(null);
        return;
    }
	callback();
}