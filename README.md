![logo](/public/core/css/img/logo.png) MediacenterJS
=============

__A NodeJS based Mediacenter__ 

Website: http://www.mediacenterjs.com

Status: 
=======

__Heavy work in progress__

__version 0.0.61__

* Music app refactored using Angular
* Improved mobile styling
* Metadata gathering is a seperate process 
* TV app works
* Front and backend code refactor
* Auto updater extended
		
Current features:
===========

* Routing
* MVC 'App' Framework
* Clientside setup
* Dynamic dashboard
* Basic keyboard controls
* Movie indexing
* Multi-language support
* Display movies, tvshow and music information 
* Local caching of information and images
* Transcoding and playback of movies, tv shows and music
* Weather information based on location
* Basic screensaver
* I3d tag support
* Remote control
* Plugin manager
* Page visibility API
* YouTube app
* Version manager
* Device manager
* Parental control functionality

Known issues:
==================

* Mobile device streaming still in heavy development
* Browser: Seeking beyond buffer not working yet.

* Other issues have been added that need to be fixed before Beta status can be reached.

What is MediacenterJS?
=========================

MediacenterJS is/will be a mediacenter like for instance XBMC but based 100% on frontend techniques and languages (HTML5/CSS/Javascript).
The backend is based on Node.JS with ExpressJS and jade templates producing easy to use code allowing developers to add an 'app' to MCJS even with limited knowledge of said frontend techniques. 
The server application runs on Windows, MAC and Linux systems. 

What do I need to have installed? 
==========================

* FFmpeg installed (included for Windows) 
* NodeJS installed
* A modern browser like Chrome(ium)
* An internet connection

Partial documentation 
==========================
I'm writing the documentation as I'm coding so the documentation may not always be complete or coherent. 
A complete documentation will be available when the project reaches Beta status.

# User manual

[Installing MediacenterJS](https://github.com/jansmolders86/mediacenterjs/wiki/User-manual:---installing-MediacenterJS)

[Guidelines media library](https://github.com/jansmolders86/mediacenterjs/wiki/User-manual:-Guidelines-media-library)

[Using the remote control](https://github.com/jansmolders86/mediacenterjs/wiki/User-Manual:-Using-the-remote-control)

[FAQ](https://github.com/jansmolders86/mediacenterjs/wiki/User-manual:-FAQ)

# Developer manual

[Explanation app framework](https://github.com/jansmolders86/mediacenterjs/wiki/Developer-manual:-app-framework)

[Start building an app using the app generator](https://github.com/jansmolders86/mediacenterjs/wiki/Developer-manual:-Start-building-an-app-using-the-app-generator)

[Helper functions](https://github.com/jansmolders86/mediacenterjs/wiki/Developer-manual:-Helper-functions)

[Front end and view explantation](https://github.com/jansmolders86/mediacenterjs/wiki/Developer-manual:--front-end)

Translations
-------------
For now, all the translation files are stored in the /public/translations folder.
Feel free to contribute by translating.

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

I'm building MCJS in my free time so if you want to encourage me to continue this enormous project, feel free to do so.

[![Donate](http://www.mediacenterjs.com/global/images/github/paypal-donate.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=DHV3M4SST8C5L)

For questions/contributions feel free to email me at: jansmolders86@gmail.com
This application uses the GNU General Public License. See <http://www.gnu.org/licenses/>.

Copyright (C) 2014 - Jan Smolders
