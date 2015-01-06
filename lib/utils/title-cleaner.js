/*
	MediaCenterJS - A NodeJS based mediacenter solution
	
    Copyright (C) 2014 - Jan Smolders

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
/* Constants */
var YEAR_REGEX = /(19[012356789]\d)|20[012346789]\d|\[|\]/g;

/* Public Methods */

/**
 * Cleans up the specified title
 * @param title            The title to clean
 * @returns {{title: string, year: string, cd: string}}
 */
exports.cleanupTitle = function(title) {
	// Cleanup Movie Title
	var cleanTitle = title;
	cleanTitle = stripIllegalCharacters(cleanTitle, ' ');
	cleanTitle = removeYearFromTitle(cleanTitle);
	cleanTitle = removeReleaseGroupNamesFromTitle(cleanTitle);
	cleanTitle = removeMovieTypeFromTitle(cleanTitle);
	cleanTitle = removeAudioTypesFromTitle(cleanTitle);
	cleanTitle = removeCountryNamesFromTitle(cleanTitle);
	cleanTitle = removeCdNumberFromTitle(cleanTitle).trim();

	// Extract CD-Number from Title
	var hasCdinTitle = title.match(/cd [1-9]|cd[1-9]/gi);
	var cd_number = hasCdinTitle ? hasCdinTitle.toString() : '';

	// Extract Year from Title
	var year = title.match(YEAR_REGEX);
	year = year ? year.toString() : '';

	return { title: cleanTitle, year: year, cd: cd_number };
};

/* Private Method */

stripIllegalCharacters = function(movieTitle, replacementString) {
	return movieTitle.replace(/\.|_|\/|\+|\-/g, replacementString);
};

removeYearFromTitle = function(movieTitle) {
	return movieTitle.replace(YEAR_REGEX, "").replace(/\(|\)/g,'');
};

removeReleaseGroupNamesFromTitle = function(movieTitle) {
	return movieTitle.replace(
		/FxM|aAF|arc|AAC|MLR|AFO|TBFA|WB|ARAXIAL|UNiVERSAL|ETRG|ToZoon|PFa|SiRiUS|Rets|BestDivX|DIMENSION|CTU|ORENJI|LOL|juggs|NeDiVx|ESPiSE|MiLLENiUM|iMMORTALS|QiM|QuidaM|COCAiN|DOMiNO|JBW|LRC|WPi|NTi|SiNK|HLS|HNR|iKA|LPD|DMT|DvF|IMBT|LMG|DiAMOND|DoNE|D0PE|NEPTUNE|TC|SAPHiRE|PUKKA|FiCO|PAL|aXXo|VoMiT|ViTE|ALLiANCE|mVs|XanaX|FLAiTE|PREVAiL|CAMERA|VH-PROD|BrG|replica|FZERO/g,
		"");
};

removeMovieTypeFromTitle = function(movieTitle) {
	return movieTitle.replace(
		/dvdrip|multi9|xxx|x264|AC3|web|hdtv|vhs|HC|embeded|embedded|ac3|dd5 1|m sub|x264|dvd5|dvd9|multi sub|non|h264|x264| sub|subs|ntsc|ingebakken|torrent|torrentz|bluray|brrip|sample|xvid|cam|camrip|wp|workprint|telecine|ppv|ppvrip|scr|screener|dvdscr|bdscr|ddc|R5|telesync|pdvd|1080p|BDRIP|hq|sd|720p|hdrip/gi,
		"");
};

removeAudioTypesFromTitle = function(movieTitle) {
	return movieTitle.replace(
		/320kbps|192kbps|128kbps|mp3|320|192|128/gi,
		"");
};

removeCountryNamesFromTitle = function(movieTitle) {
	return movieTitle.replace(
		/NL|SWE|SWESUB|ENG|JAP|BRAZIL|TURKIC|slavic|SLK|ITA|HEBREW|HEB|ESP|RUS|DE|german|french|FR|ESPA|dansk|HUN/g,
		"");
};

removeCdNumberFromTitle = function(movieTitle) {
	return movieTitle.replace(/cd [1-9]|cd[1-9]/gi, "");
};
