MediacenterJS
=============

__A NodeJS (HTML/CSS/Javascipt) based Mediacenter__

Screenshots: 

![Dashboard] (screenshots/interface.jpg)

![Movies] (screenshots/movies.jpg)

Status: 
=======

__Heavy work in progress, pre-alpha, not ready for use__
		
What works?
===========

* Basic Routing
* Basic MVC 'App' Framework
* Clientside initial setup
* Show time and date on dashboard
* Dashboard with dynamic app display
* Keyboard controls
* Onscreen keyboard
* Movie indexing
* Display movies with Poster, Backdrop and information 
* Local caching of information and images
* Basic transcoding and playing of movie
* Display movie information
* Weather information (Only in Dutch)

What's coming up
=================

* Handle the writing of settings propperly
* Activate Screensaver (dimming mode)
* better movie playback

What's not working
==================

* The rest...

What's the MCJS?
=========================

MediacenterJS is/will be a mediacenter like for instance XBMC but based 100% on frontend techniques and languages (HTML5/CSS/Javascript).
The backend is based on Nodejs/ExpressJS 3x with jade templates producing easy to use code. 
The goal is to make it possible to add an 'app' to MCJS even with limited knowlegde of said frontend techniques. 

Basic featurelist:

* Multiple apps like youtube, weather stopify etc.
* Movie, tv and music database with information and playback
* Easy to use app framework

What do I need to use this? 
==========================

* FFmpeg installed
* NodeJS installed
* a modern browser like Chrome or Firefox

What is a MCJS App? 
=======================

An 'app' in this case is basically a wrapper for a feature you can use within MCJS.

How does it work?
=================

__The MVC part__

An App consists of two parts. A public part and a Model View Controller. When you look in the root of MCJS you'll see a folder calls 'Apps'. 
In this folder you can create a new folder or copy the hello world example and rename it.

This is the MVC of your app. With and index.js file to control all the incomming route requests, a folder called Views which contains the actual clientside HTML. 
And finally you can extend the basic routing with the route.js file.

__index.js__

If we look at the hello world example, you will see the following contents

	// Choose your render engine. The default choice is JADE:  http://jade-lang.com/
	exports.engine = 'jade';

	// Render the indexpage
	exports.index = function(req, res, next){
		res.render('hello');
	};
	
* The render engine is the way the view is written down. Currently only JADE is supported.
* The exports.index is the initial route to the app. And in this case will render the hello.jade file in the views folder.

__The public part of an App / Making it public__

When we go back to the root folder you will also see a folder called public. Everything in this folder is accessible from the client. Add a folder with the same name. 
If you want your app to show up in the dashboard, all you need to do is add a tile.png to your public folder. This will alert MCJS that you want your app to be accessible from the dhashboard, and it will automatically add it.
You can make a background app that hooks on a existing app without having it showing up in the dashboard simply by not adding the tile.

__Bulding an App__

There are thousands of usefull node libraries you can use to build your app. Simply install the module you want with NPM and start using it. 
In the future there will be a handy package installer to export your app with. 

What is the beta version going to have?
=======================================

On the wishlist for MCJS are UPNP, fast transcoding and crossbrowser compatibility and a set of ready made apps like youtube and google music.

This application will run on Windows and Linux based systems. 
There will be a specific Linux distro for raspberry pi using a kiosk, debian distro.

[![Donate] (screenshots/paypal-donate.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=DHV3M4SST8C5L)

For questions/contributions feel free to email me at: jansmolders86@gmail.com
this application uses the GNU General Public License. See <http://www.gnu.org/licenses/>.

Copyright (C) 2013 - Jan Smolders
