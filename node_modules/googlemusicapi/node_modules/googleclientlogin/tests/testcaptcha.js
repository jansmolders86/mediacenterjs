/*jslint indent: 2*/
/*global require: true, console: true*/
var assert = require('assert');
var pw = function () {
  return 'foobar' + Date.now() + Math.random();
};
var GoogleClientLogin = require('../index').GoogleClientLogin;
(function () {
  var googleAuth = new GoogleClientLogin({
    email: 'ajnasz@gmail.com',
    password: pw(),
    service: 'contacts',
    accountType: GoogleClientLogin.accountTypes.google
  });
  googleAuth.on(GoogleClientLogin.events.login, function () {
    console.log('login success');
  });
  googleAuth.on(GoogleClientLogin.events.error, function (e) {
    assert.equal(e.message, GoogleClientLogin.errors.tokenMissing);
    console.log('test 2 finished', JSON.stringify(this.auths), this.isCaptchaRequired());
    // damn..
  });
  googleAuth.login({logincaptcha: 'asdf'});
}());



(function () {
  var googleAuth = new GoogleClientLogin({
    email: 'ajnasz@gmail.com',
    password: pw(),
    service: 'contacts',
    accountType: GoogleClientLogin.accountTypes.google
  });
  googleAuth.on(GoogleClientLogin.events.login, function () {
    console.log('login success');
  });
  googleAuth.on(GoogleClientLogin.events.error, function (e) {
    assert.equal(e.message, GoogleClientLogin.errors.captchaMissing);
    console.log('test 2 finished', JSON.stringify(this.auths), this.isCaptchaRequired());
    // damn..
  });
  googleAuth.login({logintoken: 'asdf'});
}());




(function () {
  var googleAuth = new GoogleClientLogin({
    email: 'ajnasz@gmail.com',
    password: pw(),
    service: 'contacts',
    accountType: GoogleClientLogin.accountTypes.google
  });
  googleAuth.on(GoogleClientLogin.events.login, function () {
    console.log('login success');
  });
  googleAuth.on(GoogleClientLogin.events.error, function (e) {
    console.log('test 2 finished', JSON.stringify(e.response.headers),
      JSON.stringify(this.auths), this.isCaptchaRequired());
    // damn..
  });
  googleAuth.login({logintoken: 'asdf', logincaptcha: 'askdfljasf'});
}());
