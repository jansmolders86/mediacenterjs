/* Constants */
var YEAR_REGEX = /([0-9]{4})|\(|\)|\[|\]/g;

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
	return movieTitle.replace(YEAR_REGEX, "");
};

removeReleaseGroupNamesFromTitle = function(movieTitle) {
	return movieTitle.replace(
		/FxM|aAF|arc|AAC|MLR|AFO|TBFA|WB|ARAXIAL|UNiVERSAL|ToZoon|PFa|SiRiUS|Rets|BestDivX|DIMENSION|CTU|ORENJI|LOL|juggs|NeDiVx|ESPiSE|MiLLENiUM|iMMORTALS|QiM|QuidaM|COCAiN|DOMiNO|JBW|LRC|WPi|NTi|SiNK|HLS|HNR|iKA|LPD|DMT|DvF|IMBT|LMG|DiAMOND|DoNE|D0PE|NEPTUNE|TC|SAPHiRE|PUKKA|FiCO|PAL|aXXo|VoMiT|ViTE|ALLiANCE|mVs|XanaX|FLAiTE|PREVAiL|CAMERA|VH-PROD|BrG|replica|FZERO/g,
		"");
};

removeMovieTypeFromTitle = function(movieTitle) {
	return movieTitle.replace(
		/dvdrip|multi9|xxx|x264|AC3|web|hdtv|vhs|embeded|embedded|ac3|dd5 1|m sub|x264|dvd5|dvd9|multi sub|non sub|subs|ntsc|ingebakken|torrent|torrentz|bluray|brrip|sample|xvid|cam|camrip|wp|workprint|telecine|ppv|ppvrip|scr|screener|dvdscr|bdscr|ddc|R5|telesync|pdvd|1080p|hq|sd|720p|hdrip/gi,
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
