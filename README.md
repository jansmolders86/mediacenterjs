![logo] (http://www.mediacenterjs.com/global/images/github/logo.png) MediacenterJS
=============

__A NodeJS based Mediacenter__ 

Website: http://www.mediacenterjs.com

![Dashboard] (http://www.mediacenterjs.com/global/images/github/screen1.png)

Status: 
=======

__Heavy work in progress, Alpha version (0.0.50)__

__version 0.0.50__
* Greatly improved video playback
* Operational plugin manager
* Improved GUI

Why use it?
===========
* Lightning fast
* Extremely versatile
* Works on everything
		
What currently works?
===========

* Basic Routing
* Basic MVC 'App' Framework
* Clientside initial setup
* Show time and date on dashboard
* Dynamic dashboard
* Basic keyboard controls
* Onscreen keyboard
* Movie indexing
* Multi-language support
* Display movies with Poster, Backdrop and information 
* Local caching of information and images
* Basic transcoding and playback of movies and music
* Weather information based on location
* Basic transcoding of movies and music
* Retrieving of tv show information
* Basic screensaver
* Lazy loading of movie and music items
* I3d tag support
* Remote control
* Plugin manager
* Page visibility API 

What's coming up
==================
* Tv show app functionality
* Better inbrowser streaming

Known issues: video/audio playback
==================

These issues are known issues and current browser/platform limitations.
I'm trying to figure out how to get around these limitations.

* IOS: Video is not seekable
* Browser: HD videos still take a lot of processing power.
* Android: not seekable & mp3 playback not working
* Ubuntu: Audio playback of mp3 not supported by default

What still needs to be done
==================

* Issues have been added that need to be fixed before Beta status can be reached.

What is MediacenterJS?
=========================

MediacenterJS is/will be a mediacenter like for instance XBMC but based 100% on frontend techniques and languages (HTML5/CSS/Javascript).
The backend is based on Node.JS with jade templates producing easy to use code. 
The goal is to make it possible to add an 'app' to MCJS even with limited knowledge of said front end techniques. 

Basic feature list:

* Multiple apps like YouTube, weather, Spotify etc.
* Movie, tv and music database with information and playback
* Easy to use app framework

What do I need to have installed? 
==========================

* FFmpeg installed (Linux and windows binaries are included)
* NodeJS installed
* A modern browser like Chrome or Firefox
* An internet connection

Partial documentation 
==========================
I'm writing the documentation as I'm coding so the documentation may not always be complete or coherent. 
A complete documentation will be available when the project reaches Beta status.

Setup
-------------

Download this application with NPM:

[![NPM](https://nodei.co/npm/mediacenterjs.png?downloads=true)](https://nodei.co/npm/mediacenterjs/)

Or download it directly from Github of course. 

After you have downloaded MediacenterJS, click on the .bat file (in Windows) to start the project. 
Or browse to the root directory of MediaCenterJS in the terminal/command prompt and type:

	node server

If you close this window, MCJS will stop working. You can also see useful information about what the server is doing, including error messages and other useful information.

__Please make sure you've installed NodeJS and FFmpeg first!__

Ffmpeg binaries for Linux and Windows are included.

User guide for installing FFmpeg on Windows: (http://www.wikihow.com/Install-FFmpeg-on-Windows)
User guide for installing FFmpeg on Linux: (http://linuxers.org/tutorial/how-install-ffmpeg-linux)

Install NodeJS: http://nodejs.org/download/  (minimal version 0.10.x)

__Install node on Ubuntu/Debian/OSX__


	Ubuntu: gksu software-properties-gtk (enable all software sources)

	sudo apt-get update
	sudo apt-get install python-software-properties python g++ make
	sudo add-apt-repository ppa:chris-lea/node.js
	sudo apt-get update
	sudo apt-get install nodejs

	// Git clone
	sudo apt-get install git
	git clone https://github.com/jansmolders86/mediacenterjs.git
	cd mediacenterjs
	npm install
	sudo chmod +x bin/sqlite3/sqlite3 lib/database/mcjs.sqlite
	
	For OSX users:
	sudo chmod +x ./bin/sqlite3/osx/sqlite3 
	
	sudo node server

	// NPM install
	npm install mediacenterjs

The program will boot in setup mode, being accessible on localhost:3000 or 'IP of the server':3000.

If you get an 'EACCESS' error, please set thefollowing permissions and run the server using 'sudo'
 
     sudo chmod 755 bin/sqlite3/sqlite3 lib/database/mcjs.sqlite
     sudo node server

Running MediacenterJS
-------------
After the initial setup has been completed MediacenterJS will be available on the port you have specified and the language you have chosen.
the server.js will make sure you do not have to restart the actual application (index.js) every time the configuration file changes.

Of course, if you change the port, you need to use that port after the initial setup.

![Remote] (http://www.mediacenterjs.com/global/images/github/remote.png)

Using the remote control
-------------

Integrated with Mediacenterjs is a handly remote control you can use on your mobile phone or tablet. Simply open your favourite browser and navigate to the local ip address of the MCJS server followed by the port and remote url. Which would give you an url that looks something like:

    Example: http://192.168.0.101:3000/remote/

If your phone is connected to the same wifi this should work automatically and the message on the bottom of the screen should say "Remote connected". If for some reason the IP is different and the remote is not connected you can fill in a different IP by pressing the three dotts at the top left corner. This will bring up the settings menu where you can customize all the MCJS settings.
	

![Movies] (http://www.mediacenterjs.com/global/images/github/second.png)

What can the movie browser/player do? 
-------------

Once you specify the location of your movies, the movie browser can get all the information you might need including runtime, plot, genre, backdrop and movie poster (more to come). 
Once you browse your movie collection, the system will download all the information and store it locally. This means that the building of the movie list index only takes a couple of milliseconds.
After that the only slight loading time the system has, is when a movie is requested for the first time (because the data has to be downloaded).

When a playback is requested, the server transcodes the movie so the HTML5 player can play the movie in the browser.


How should I format my movie library and files?
-------------

###Directory conventions###

MediacenterJS will look in the specified directory for video files. It will look in subdirectories of the specified dir for additional video files.
so the possible directories can be:

	specifiedPath/fight club.avi
	
or  

	specifiedPath/f/fight club.avi
	
or even

	specifiedPath/f/MyfavouriteMovies/fight club.avi
	
###Filename conventions###
MCJS will use the filenname to try to get the correct movie details. This way the server does not have to look inside the files to get the metadata, which speeds up the process.
As you can gather the more precise the title of the movie, the better the scraper will know which movie it is.

Asside from the title you can make it even easier for the scraper to recognize the movie by adding the date of release like so:
	
	Fight Club (1999).avi
	
If your filenames are 'messy', the system will try to clean them up before sending the title to the scraper.
Text like release group names,dividers,file type or quality will be filtered out of the filename on the server.
so:

	Fight.Club.iMMORTALS.(1999).xvid-R5.torrent.avi 
	
will become 

	Fight Club (1999).avi
	
But to get the best result you should clean up your filenames as best as possible.

If a movie is split into multiple pieces, you can specify it in the filename as well. It is best to format it like this:

	Fight Club (1999) CD1.avi
	
What can the music player do? 
-------------

Once you specify the location of your music, the music will look in the specified directory for mp3 files. 
The I3d Tag will be used to determine the correct album information. If no correct ID3tag is found, the folder name will be used to determine the artist/album.

Little side note, the way the ID3tag is used still needs to be improved, so compilation albums could give a mismatch.

If you add an image in the directory and name it appropriately, this image will be used by the music player as the cover art.

So if it is a single like a live recording or a mixtape, just add an image with exactly the same name as the mp3 in the same directory. For example:

	01 - Giorgio Moroder - Output - Brooklyn - N.Y.C.jpg
	
If you have an album, the music player will look for a image file with the following names: 

	"cover" or "front"
	
This image will be copied to the cache of MCJS so it can be used without restrictions. So you can even delete the image in the local dir and as long as you don't clear the cache, the image will be used.
If no image is provided, the player will contact the Discogs scraper and try to get the art ther. (Although there are plans to port discogs to lastFM.)

A nice GUI detail: Once you start playback, the eq icon and header will change colour according to the dominant colour of the album art. 

What is a MCJS App and how will it work?
-------------

An 'app' in this case is basically a wrapper for a feature you can use within MCJS.

An App consists of two parts. A public part and the core. (a mini Model View Controller). 
When you look in the root of MCJS you'll see a folder called 'Apps'. In this folder you can create a new folder or copy the hello world example and rename it.

This is the core of your app. With and index.js file to control all the incoming route requests, a folder called Views which contains the view (client side HTML) and best practise seperate file(s) for the additional functions you use in your app.

__index.js__

If we look at the hello world example, you will see the following contents

	// Choose your render engine. The default choice is JADE:  http://jade-lang.com/
	exports.engine = 'jade';

	// Render the index page
	exports.index = function(req, res, next){
		res.render('hello');
	};
	
* The render engine is the way the view is written down. Currently only JADE is supported.
* The exports.index is the initial route to the app. And in this case will render the hello.jade file in the views folder.
* The 'index' is the key used by the routing to assign te proper handeling. Another example is 'get'.

__The public part of an App / Making it public__

When we go back to the root folder you will also see a folder called public. Everything in this folder is accessible from the client. 

Add a folder with the same name. 

If you want your app to show up in the dashboard, all you need to do is add a tile.png to your public folder root. 
This will alert MCJS that you want your app to be accessible from the dashboard, and it will automatically add it.

(In theory, you can make a background app that hooks on an existing app, or just runs in the background, without having it showing up in the dashboard simply by not adding the tile. It's up to you how you use this functionality.)

Routing
-------------

__Basic routing__

I tried to implement the routing as RESTfull as possible. This means if your app frontend sends a GET request, it can do so in three layers. A required base level with for instance an ID, a optional second level with a subid for example or an action and finally a third level with usually an action.
Which results in a get handler which could look something like this:

	exports.get = function(req, res, next){		
		var requiredId = req.params.id  		//Initial param after base name. example: /movies/12
		, optionalParam = req.params.optionalParam	//Second param after initial param. example: /movies/12/info
		, action = req.params.action;			//Third param example: /music/muse/bliss/info
		
		if(!action){
			//No third route
			switch(optionalParam) {
				case('play'):
					//Do something with root/action in this case 'play'
				break;
				default:
					//Do nothing 
				break;		
			}
		} else if (!optionalParam && !action){
			//Do something with root id, no second route
		} else if(action === 'play') {
			//Do something with root/subid/action
		};
	}

Of course this is just a basic layer. 
You can extend this in your own route.js file in your app folder.

__route.js__ 

Although the basic routing is pretty generic and should be sufficient most of the time, you can extend the basic routing table with your own custom routes by adding this JSON file to the root of your core app folder and defining your routes. 

The 'NAME' will be replaced with the app name (folder name / namespace). You do not have to hard code it. But you can also add routes outside your app namespace. For Example:

	{
		"track": [{
			"method": "get",
			"path": "/NAME/track/:album/:track"
		}],
		"album": [{
			"method":"post",
			"path": "/NAME/album"
		}],
		"lookup": [{
			"method":"get",
			"path": "/configuration"
		}]
	}
	
__Remote control__ 

If you want the remote to properly navigate your app you need to add classes to the elements within your app so the remote can find it's way within your app.
To specify a element that you can navigate to and from add the following class:

	.mcjs-rc-controllable
	
To specify a element that you can click on add the following class:

	.mcjs-rc-clickable

These classes will also enable keyboard navigation for your app.	
Please make sure you have include the socket.io clientside javascript and the MCJS core plugin to make sure the remote will work in your app.
	
Building an App
-------------

There are thousands of useful node libraries you can use to build your app. Simply install the module you want with NPM and start using it. 
In the future there will be a handy package installer to export your app with and I will add example apps.

Translation
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
* Luis Eduardo Brito https://github.com/luiseduardobrito for his Portuguese translation
* Kasper Isager https://github.com/kasperisager for his Danish translation
* Jussi Vatjus https://github.com/jupe for his code support
* Terry MooreII https://github.com/TerryMooreII For the Javascript Jabber app and building the Plugin manager
* Stefan Hoffman https://github.com/hoffi for his hudge contribution to the backend
* Matthew Szatmary https://github.com/szatmary for his FFMPEG expertise
* Richard Bernards https://github.com/RichardBernards for his architectural knowledge/support
* Lucien Immink https://github.com/lucienimmink for his javascript knowledge/support
* P.J. Onori for his icons

###Thanks to the following people for their donation:###

* Koen Peters http://geekyplugins.com/
* Friso Geerlings 


What will the beta version be able to do?
=======================================

The project will reach beta status when it is able to provide:

- [ ] Fast transcoding 
- [ ] Cross Browser/device compatibility
- [ ] Easy to add/change themes (with several available to choose from)
- [ ] A set of ready made apps like youtube and google music.
- [ ] Multi language support
- [ ] App import/export functionality

This application will run on Windows and Linux based systems. 

***There will be a specific Linux distro using a kiosk, debian distro.***

I'm building MCJS in my free time so if you want to encourage me to continue this enormous project, feel free to do so.

[![Donate] (http://www.mediacenterjs.com/global/images/github/paypal-donate.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=DHV3M4SST8C5L)

For questions/contributions feel free to email me at: jansmolders86@gmail.com
This application uses the GNU General Public License. See <http://www.gnu.org/licenses/>.

Copyright (C) 2013 - Jan Smolders
