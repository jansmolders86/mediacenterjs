![logo](/public/core/css/img/logo.png) MediacenterJS <sup>Beta</sup>
=============

[![mediacenterjs](http://mediacenterjs.com/global/images/screen1.png)](http://www.mediacenterjs.com)

__A NodeJS based media center__ 

Website: http://www.mediacenterjs.com 

What is MediacenterJS?
=========================

MediacenterJS is a media center (like for instance XBMC) running completely from the comfort of your browser.
The backend is based on Node.JS with ExpressJS and JADE templates. 
The MVC structure allows developers to add a plugin to MCJS with ease. 
The server application runs on Windows, MAC and Linux systems, the client runs in every modern browser (Chrome is preferable though).

Who is this for? 
=========================

Although services like Netflix or HBOgo are really awesome, they do not have every media you might enjoy or already own. Especially if you're born before the streaming age like me, you'll probably have a lot of media locally somewhere. So, if you want the convienence of the aformentioned services, but you want to use your own media, this app is for you!

# User manual

[Installing MediacenterJS](https://github.com/jansmolders86/mediacenterjs/wiki/User-manual:---installing-MediacenterJS)

[Guidelines media library](https://github.com/jansmolders86/mediacenterjs/wiki/User-manual:-Guidelines-media-library)

[Using the remote control](https://github.com/jansmolders86/mediacenterjs/wiki/User-Manual:-Using-the-remote-control)

[FAQ](https://github.com/jansmolders86/mediacenterjs/wiki/User-manual:-FAQ)

# Developer manual

[Explanation plugin framework](https://github.com/jansmolders86/mediacenterjs/wiki/Developer-manual:-plugin-framework)

[Start building an plugin using the plugin generator](https://github.com/jansmolders86/mediacenterjs/wiki/Developer-manual:-Start-building-an-app-using-the-app-generator)

[Helper functions](https://github.com/jansmolders86/mediacenterjs/wiki/Developer-manual:-Helper-functions)

[Front end and view explantation](https://github.com/jansmolders86/mediacenterjs/wiki/Developer-manual:--front-end-and-view-explanation)

[Create a new theme](https://github.com/jansmolders86/mediacenterjs/wiki/Developer-manual:-Themes)

Current features:
===========

* Routing
* MVC 'App' Framework
* Clientside setup
* Dynamic dashboard
* Keyboard controls
* Movie indexing
* Multi-language support
* Display movies, tvshow and music information 
* Local caching of information and images
* Transcoding and playback of movies, tv shows and music
* Subtitle support
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
* Basic scheduled tasks

Supported file formats:
==================
Video: AVI/MOV/WMV/MP4/MKV/MPEG

Audio: MP3/M4a 

Known issues:
=================

* Device streaming still in heavy development
* Seeking beyond buffer not working yet.

Be sure to check the open issues before filing a new one.
If you're filing a new issue, be sure to mention your NodeJS version (node -v in a terminal or prompt) and the platform (eg Windows or Ubuntu, Debian etc) you are running the MCJS server on.

Also check out what is currently being developed and/or fixed on MCJS Trello page: https://trello.com/b/czjyYsFi/mediacenterjs

Translations
-------------
For now, all the translation files are stored in the /public/translations folder.
Feel free to contribute by translating.

### Main contributors: ###

* [Terry MooreII](https://github.com/TerryMooreII) For the Javascript Jabber app and building the Plugin manager
* [Stefan Hoffman](https://github.com/hoffi) for his hudge contribution to the backend and German translation 
* [Jonathan Bailey](https://github.com/Jon889) for his hudge code contributions and database abstraction layer
* [Matthew Marino](https://github.com/Karnith) for his FFMPEG expertise

### Special thanks to these contributors: ###


* [Sylvain](https://github.com/flyinva) for his French translation
* [Alberto Jerez](https://github.com/ajerez) and David Toraño for their Spanish translation
* [Domenico Luciani](https://github.com/dlion) for his Italian translation
* [Alexey Bobyrev](https://github.com/sfate) for his Russian and Ukrainian translation
* [Doğan Aydın](https://github.com/doganaydin) And [William Belle](https://github.com/williambelle) for their Turkish translation
* [Adam](https://github.com/brutalhonesty) for his YouTube App
* [Ionică Bizău](https://github.com/IonicaBizau) for the [Youtube API NPM module](https://github.com/IonicaBizau/youtube-api)
* [Luis Eduardo Brito](https://github.com/luiseduardobrito) and [Welkson Ramos](https://github.com/welksonramos) for their Portuguese translation
* [Kasper Isager](https://github.com/kasperisager) for his Danish translation
* [Robin Larsson](https://github.com/TankMasterRL) and 
[Skruf90](https://github.com/skruf90)for their Swedish translation
* [Skruf90](https://github.com/skruf90) for his Norwegian translation
* [Jussi Vatjus](https://github.com/jupe) for his code support
* [Matthew Szatmary](https://github.com/szatmary) for his FFMPEG expertise
* [Richard Bernards](https://github.com/RichardBernards) for his architectural knowledge/support
* [Lucien Immink](https://github.com/lucienimmink) for his javascript knowledge/support
* [andreme](https://github.com/andreme) for his bugfixes
* [Jérémie Parker](https://github.com/p-j) for his bugfixes
* [Gary Katsevman](https://github.com/gkatsev) for his bugfixes
* [Marco Da Col](https://github.com/ildac) for his bugfixes and Italian translations
* [Chinmaya Kumar Padhi](https://github.com/chinmayapadhi) for updating installation instructions OSX
* [Valerij Primachenko](https://github.com/vprimachenko) for compiling the executable for Windows
* P.J. Onori for his icons

I'm building MCJS in my free time so if you want to encourage me to continue this enormous project, feel free to do so.

[![Donate](http://www.mediacenterjs.com/global/images/github/donate-paypal.jpg)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=DHV3M4SST8C5L)

For questions/contributions feel free to email me at: jansmolders86@gmail.com
This application uses the GNU General Public License. See <http://www.gnu.org/licenses/>.

Copyright (C) 2018 - Jan Smolders

[![Analytics](https://ga-beacon.appspot.com/UA-49988223-1/mediacenterjs/index)](https://github.com/igrigorik/ga-beacon)
