/*jslint indent: 2*/
/*global require: true*/
/*
 * For more details about the ClientLogin authentication check out this:
 * http://code.google.com/apis/accounts/docs/AuthForInstalledApps.html
 */
var EventEmitter = require('events').EventEmitter,
    util = require('util');

// useragent string
const userAgent = 'GCLNodejs';
// version string
const ver = '0.2.2';

const loginURL = '/accounts/ClientLogin';
const googleHost = 'www.google.com';
const captchaRequiredError = 'CaptchaRequired';

// error messages
const errors = {
  captchaMissing: 'User entered captcha is missing',
  tokenMissing: 'Login token is missing',
  loginFailed: 'Login failed'
};

const events = {
  login: 'login',
  error: 'error'
};

// Google account types 
const accountTypes = {
  google: 'GOOGLE', // get authorization for a Google account only
  hosted: 'HOSTED', // get authorization for a hosted account only
  hostedOrGoogle: 'HOSTED_OR_GOOGLE' // get authorization first for a hosted account; if attempt fails, get authorization for a Google account
};
// http://code.google.com/apis/gdata/faq.html#clientlogin
const services = {
  adwords: 'adwords',
  analytics: 'analytics',
  apps: 'apps',
  base: 'gbase',
  sites: 'jotspot',
  blogger: 'blogger',
  book: 'print',
  calendar: 'cl',
  codesearch: 'codesearch',
  contacts: 'cp',
  docs: 'writely',
  finance: 'finance',
  mail: 'mail',
  health: 'health',
  weaver: 'weaver',
  maps: 'local',
  picasaweb: 'lh2',
  reader: 'reader',
  sidewiki: 'annotateweb',
  spreadsheets: 'wise',
  webmastertools: 'sitemaps',
  youtube: 'youtube',
  c2dm: 'ac2dm',
  voice: 'grandcentral',
  fusiontables: 'fusiontables',
  sj: 'sj' // undocumented features
};


/**
 * Helps to log in to any google service with the clientlogin method
 * Google returns 3 values when login was success:
 * Auth, SID, LSID
 *
 * After the login you need to include the Auth value into
 * the Authorization HTTP header on each request:
 *
 * client.request('GET', '...', {
 *   ...,
 *   'Authorization':'GoogleLogin auth=' + googleClientLoginInstance.getAuthId()
 * })
 *
 * @class GoogleClientLogin
 * @constructor
 * @param {Object} conf An object, with two properties: email and password
 *     @param {String} conf.email
 *     @param {String} conf.password
 */
var GoogleClientLogin = function (conf) {
  this.conf = conf || {};
  // stores the authentication data
  this.auths = {};
  this.loginProcessing = false;
};

GoogleClientLogin.prototype = {
    constructor: GoogleClientLogin
};

util.inherits(GoogleClientLogin, EventEmitter);

/**
 * Splits response data into key-value pairs,
 * Only for internal usage
 * @method _parseData
 */
GoogleClientLogin.prototype._parseData = function (data) {
  this.auths = {};
  data.split('\n').forEach(function (dataStr) {
    var data = dataStr.split('=');
    this.auths[data[0]] = data[1];
  }.bind(this));
};

/**
 * Parses the response of the login
 * emits error and login event
 * @method _parseLoginResponse
 * @param {http.ClientResponse} response The response object
 */
GoogleClientLogin.prototype._parseLoginResponse = function (response) {

  var data = '';

  response.on('data', function (chunk) {
    data += chunk;
  }.bind(this));

  response.on('error', function (e) {
    this.emit(events.error, e);
  }.bind(this));

  response.on('end', function () {
    this.loginProcessing = false;
    var statusCode = response.statusCode, error;
    this._parseData(data);
    if (statusCode >= 200 && statusCode < 300) {
      /**
       * Fires when login was success
       * @event login
       */
      this.emit(events.login);
    } else {
      /**
       * Fires when login failed
       * @event loginFailed
       */
      error = new Error(errors.loginFailed);
      error.data = data;
      error.response = response;
      this.emit(events.error, error);
    }
  }.bind(this));
};

/**
 * Method to find out which account type should we use, default is HOSTED_OR_GOOGLE
 * Only for internal usage
 * @method _getAccountType
 * @param {Object} [params]
 *   @param {String} [params.accountType]
 * @return {String}
 */
GoogleClientLogin.prototype._getAccountType = function (params) {
  var output = accountTypes.hostedOrGoogle;

  if (typeof params === 'object' && params.accountType === 'string' &&
    typeof accountTypes[params.accountType] === 'string') {
      output = accountTypes[params.accountType];
  } else if (typeof this.conf.accountType === 'string') {
      output = accountTypes[this.conf.accountType];
  }

  return output;
};

/**
 * Method to create the content of the login request
 * Only for internal usage
 * @method _getRequestContent
 * @param {Object} params (Optional) You can pass the logincaptcha and
 * logintoken and the accountType as properties
 * @return string
 */
GoogleClientLogin.prototype._getRequestContent = function (params) {
  var output, hasCaptcha, hasToken, error;

  output = {
    accountType: this._getAccountType(params),
    Email: this.conf.email,
    Passwd: this.conf.password,
    service: services[this.conf.service],
    source: userAgent + '_' + ver
  };

  if (typeof params === 'object') {

    hasCaptcha = typeof params.logincaptcha === 'string';
    hasToken = typeof params.logintoken === 'string';

    if (hasCaptcha && hasToken) {
      output.logincaptcha = params.logincaptcha;
      output.logintoken = params.logintoken;
    // if the captcha or the token is given the other also required
    } else if (!hasCaptcha && hasToken) {
      error = errors.captchaMissing;
    } else if (!hasToken && hasCaptcha) {
      error = errors.tokenMissing;
    }
  }

  if (error) {
    this.emit(events.error, new Error(error));
    output = false;
  } else {
    output = require('querystring').stringify(output);
  }

  return output;
};

/**
 * Logs in the user
 * @method login
 * @param {Object} params (optional) You can pass the logincaptcha and
 * logintoken and the accountType as properties
 */
GoogleClientLogin.prototype.login = function (params) {
  // don't try to log in, if one is already in progress
  if (!this.loginProcessing) {
    this.loginProcessing = true;

    var content, request;

    content = this._getRequestContent(params);

    if (content !== false) {
      request = require('https').request(
        {
          host: 'www.google.com',
          port: 443,
          path: loginURL,
          method: 'POST',
          headers: {
            'Content-Length': content.length,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        },
        this._parseLoginResponse.bind(this)
      );
      request.write(content);
      request.end();
    }
  }
};

/**
 * Method to get the AuthId property
 * @method getAuthId
 * @return {String || undefined} the AuthId or undefined
 */
GoogleClientLogin.prototype.getAuthId = function () {
  return this.auths.Auth;
};

/**
 * Method to ge the SID property
 * @method getSID
 * @return {String || undefined} the value of the SID property or undefined
 */
GoogleClientLogin.prototype.getSID = function () {
  return this.auths.SID;
};

/**
 * Method to get the LSID property
 * @method getLSID
 * @return {String || undefined} the value of the LSID property or undefined
 */
GoogleClientLogin.prototype.getLSID = function () {
  return this.auths.LSID;
};

/**
 * Method to get the error code
 * @method getError
 * @return {Number || undefined} the error code or undefined
 */
GoogleClientLogin.prototype.getError = function () {
  return this.auths.Error;
};

/**
 * Method to know if captcha is required
 * @method isCaptchaRequired
 * @return {Boolean}
 */
GoogleClientLogin.prototype.isCaptchaRequired = function () {
  return this.getError() === captchaRequiredError;
};

/**
 * Method to get the captcha url
 * @method getCaptchaUrl
 * @return {String || undefined} the value of the CaptchaUrl property or undefined
 */
GoogleClientLogin.prototype.getCaptchaUrl = function () {
  return this.auths.CaptchaUrl;
};

/**
  * Returns the value of the CaptchaToken property
  * @method getCaptchaToken
  * @return {String || undefined} string or undefined
  */
GoogleClientLogin.prototype.getCaptchaToken = function () {
  return this.auths.CaptchaToken;
};

GoogleClientLogin.errors = errors;
GoogleClientLogin.events = events;
GoogleClientLogin.accountTypes = accountTypes;

exports.GoogleClientLogin = GoogleClientLogin;
