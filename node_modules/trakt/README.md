node-trakt [![Build Status](https://travis-ci.org/hakovala/node-trakt.png?branch=master)](https://travis-ci.org/hakovala/node-trakt)
=====

NodeJS wrapper module for Trakt.tv API.

> This is a early development version. So, expect it to change and have many bugs..

## Install
	npm install trakt

## Usage example
	var Trakt = require('trakt');
	var trakt = new Trakt({username: 'username', password: 'password'}); 

	var options = { query: 'american dad' }

	// Search 'american dad' from Trakt
	trakt.request('search', 'shows', options, function(err, result) {
		if (err) {
			console.log(err);
			if (result) {
				console.log(result);
			}
		} else {
			console.log(result);
		}
	})

	// Test account authentication
	trakt.request('account', 'test', {}, function(err, result) {
		if (err) {
			console.log(err);
			if (result) {
				console.log(result);
			}
		} else {
			console.log(result);
		}
	})

## CLI Usage
	trakt search shows --query 'american dad'
	trakt account test -u username -p password

## TODO List
 - **Base**
  - Add events to some situations
  - Refactor request functions
  - Make helper functions for api calls
 - **Api Actions**
  - Add missing parameters
  - Add missing dev parameters
  - Handle show title as it can be many things
  - ~~Check parameter if it needs authentication (needed only for GET)~~
  - Allow objects and lists as parameters
  - Check parameter value validity
  - Check for supplementary parameters (how?)
  - Check for optional parameters that are marked as mandatory in the api
 - **Cli**
  - ~~Redesign cli arguments~~
  - ~~Add usefull usage and help printout~~
 - **Tests**
 	- Implement them

## Copyright and license

Copyright 2012 hakovala

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

> [http://www.apache.org/licenses/LICENSE-2.0](http://www.apache.org/licenses/LICENSE-2.0)

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

