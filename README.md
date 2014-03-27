![logo](/public/core/css/img/logo.png) MediacenterJS
=============

__A NodeJS based Mediacenter__ 

Website: http://www.mediacenterjs.com

Status: 
=======

__Heavy work in progress, Alpha version (0.0.53)__

__version 0.0.53__

* Improved remote control/keyboard accesibility 
* Improved music App code
* Moved Windows binaries, Linux dependencies need to be installed manually from now on.
* Playing 'on the fly' transcoding video now works for browsers.
* Self updating. The application is now updateable from the app itself. No need to use GIT or NPM.
		
Current features:
===========

* Routing
* MVC 'App' Framework
* Clientside setup
* Dynamic dashboard
* Basic keyboard controls
* Movie indexing
* Multi-language support
* Display movies with Poster, Backdrop and information 
* Local caching of information and images
* Transcoding and playback of movies and music
* Weather information based on location
* Basic transcoding of movies and music
* Retrieving of tv show information
* Basic screensaver
* Lazy loading of movie and music items
* I3d tag support
* Remote control
* Plugin manager
* Page visibility API
* YouTube app
* Version manager
* Device manager
* Parental control functionality

What's coming up (Update)
==================
* I decided to rewrite a large portion of the code. Fetching metadata will be a seperate process. This allows me to handle the data differently resulting in a faster more seamless experience. No more lazyloading and badly represented data.It also allows metadata gathering to be scheduled. This will also result in shorter, better code on front- and backend. This will take some time to get done though so bare with me. I'm developing this on a seperate branch so the master will remain stable(ish). Once this is done the TV app will work as well. Hopefully this big update will role sometime in march.


__Coming features:__

* Airplay
* Scheduled data scraping
* Streaming movies app

Known issues:
==================

* Mobile device streaming still in heavy development
* Browser: Seeking beyond buffer not working yet.

* Other issues have been added that need to be fixed before Beta status can be reached.

What is MediacenterJS?
=========================

MediacenterJS is/will be a mediacenter like for instance XBMC but based 100% on frontend techniques and languages (HTML5/CSS/Javascript).
The backend is based on Node.JS with jade templates producing easy to use code. 
The goal is to make it possible to add an 'app' to MCJS even with limited knowledge of said frontend techniques. 

Basic feature list:

* Multiple apps like YouTube, weather, Spotify etc.
* Movie, tv and music database with information and playback
* Easy to use app framework

What do I need to have installed? 
==========================

* FFmpeg installed
* NodeJS installed
* A modern browser like Chrome or Firefox
* An internet connection

Partial documentation 
==========================
I'm writing the documentation as I'm coding so the documentation may not always be complete or coherent. 
A complete documentation will be available when the project reaches Beta status.

# User manual

[Installing MediacenterJS:](https://github.com/jansmolders86/mediacenterjs/wiki/User-manual:---installing-MediacenterJS)
[Guidelines media library:](https://github.com/jansmolders86/mediacenterjs/wiki/User-manual:-Guidelines-media-library)
[Using the remote control:](https://github.com/jansmolders86/mediacenterjs/wiki/User-Manual:-Using-the-remote-control)

# Developer manual

[Explanation app framework:](https://github.com/jansmolders86/mediacenterjs/wiki/Developer-manual:-app-framework)
[Start building an app using the app generator:](https://github.com/jansmolders86/mediacenterjs/wiki/Developer-manual:-Start-building-an-app-using-the-app-generator)

Translations
-------------
For now, all the translation files are stored in the public/translation folder.
Feel free to contribute by translating.

###Credits###

This app makes heavy use of:

* Express (https://github.com/visionmedia/express)
* Node-Fluent-FFmpeg (https://github.com/schaermu/node-fluent-ffmpeg)
* VideoJS (http://www.videojs.com/)

###Special thanks to:###

* Sylvain https://github.com/flyinva for his French translation
* Adam https://github.com/brutalhonesty for his YouTube App
* Ionică Bizău https://github.com/IonicaBizau for the [Youtube API NPM module](https://github.com/IonicaBizau/youtube-api)
* Luis Eduardo Brito https://github.com/luiseduardobrito for his Portuguese translation
* Kasper Isager https://github.com/kasperisager for his Danish translation
* Robin Larsson	https://github.com/TankMasterRL for his Swedish translation
* Jussi Vatjus https://github.com/jupe for his code support
* Terry MooreII https://github.com/TerryMooreII For the Javascript Jabber app and building the Plugin manager
* Stefan Hoffman https://github.com/hoffi for his hudge contribution to the backend and German translation 
* Matthew Szatmary https://github.com/szatmary for his FFMPEG expertise
* Matthew Marino https://github.com/Karnith for his FFMPEG expertise
* Richard Bernards https://github.com/RichardBernards for his architectural knowledge/support
* Lucien Immink https://github.com/lucienimmink for his javascript knowledge/support
* P.J. Onori for his icons

###Thanks to the following people for their donation:###

* Koen Peters http://geekyplugins.com/
* Friso Geerlings 

This application will run on Windows, MAC and Linux systems. 

***There will be a specific Linux distro using a kiosk, debian distro.***

I'm building MCJS in my free time so if you want to encourage me to continue this enormous project, feel free to do so.

[![Donate](http://www.mediacenterjs.com/global/images/github/paypal-donate.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=DHV3M4SST8C5L)

For questions/contributions feel free to email me at: jansmolders86@gmail.com
This application uses the GNU General Public License. See <http://www.gnu.org/licenses/>.

Copyright (C) 2013-14 - Jan Smolders
