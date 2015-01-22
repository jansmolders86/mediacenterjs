/**
 * Created by jonathan on 18/01/15.
 */

var deviceInfo = require('../../lib/utils/device-utils')
  , config = require('../../lib/handlers/configuration-handler').getConfiguration()
  , apps = require('../../lib/utils/apps.js');
exports.index = function(req, res) {
    var searchAbleApps = apps.getApps().filter(function(app) {
        return app.search;
    });
    var appScripts = searchAbleApps.map(function (app) {
       return app.search.js;
    });
    var appStyleSheets = searchAbleApps.map(function (app) {
        return app.search.css;
    });
    deviceInfo.isDeviceAllowed(req, function(allowed){
        res.render('search', {
            title: 'Search',
            selectedTheme: config.theme,
            allowed: allowed,
            appScripts: appScripts,
            appStyleSheets: appStyleSheets
        });
    });
};