/* Public Method */

/**
 * Cleans up the specified movie title
 * @param movieTitle            The Movie title
 * @returns {{movieTitle: string, year: string, cd: string}}
 */
exports.cleanupMovieTitle = function(movieTitle) {
	// Cleanup Movie Title
	var cleanMovieTitle = movieTitle;
	cleanMovieTitle = stripIllegalCharacters(cleanMovieTitle, ' ');
	cleanMovieTitle = removeYearFromTitle(cleanMovieTitle);
	cleanMovieTitle = removeReleaseGroupNamesFromTitle(cleanMovieTitle);
	cleanMovieTitle = removeMovieTypeFromTitle(cleanMovieTitle);
	cleanMovieTitle = removeCountryNamesFromTitle(cleanMovieTitle);
	cleanMovieTitle = removeCdNumberFromTitle(cleanMovieTitle);

	// Extract CD-Number from Title
	var hasCdinTitle = movieTitle.match(/cd [1-9]|cd[1-9]/gi);
	var cd_number = hasCdinTitle ? hasCdinTitle.toString() : '';

	// Extract Year from Title
	var year = movieTitle.match(/19\d\\{2\\}|20\d\\{2\//);
	year = year ? year.toString() : '';

	return { movieTitle: cleanMovieTitle, year: year, cd: cd_number };
};

/* Private Method */

stripIllegalCharacters = function(movieTitle, replacementString) {
	return movieTitle.replace(/\.|_|\/|\+|\-/g, replacementString);
};

removeYearFromTitle = function(movieTitle) {
	return movieTitle.replace(/([0-9]{4})|\(|\)|\[|\]/g, "");
};

removeReleaseGroupNamesFromTitle = function(movieTitle) {
	return movieTitle.replace(
		/FxM|aAF|arc|AAC|MLR|AFO|TBFA|WB|ARAXIAL|UNiVERSAL|ToZoon|PFa|SiRiUS|Rets|BestDivX|NeDiVx|ESPiSE|iMMORTALS|QiM|QuidaM|COCAiN|DOMiNO|JBW|LRC|WPi|NTi|SiNK|HLS|HNR|iKA|LPD|DMT|DvF|IMBT|LMG|DiAMOND|DoNE|D0PE|NEPTUNE|TC|SAPHiRE|PUKKA|FiCO|PAL|aXXo|VoMiT|ViTE|ALLiANCE|mVs|XanaX|FLAiTE|PREVAiL|CAMERA|VH-PROD|BrG|replica|FZERO/g,
		"");
};

removeMovieTypeFromTitle = function(movieTitle) {
	return movieTitle.replace(
		/dvdrip|multi9|xxx|web|hdtv|vhs|embeded|embedded|ac3|dd5 1|m sub|x264|dvd5|dvd9|multi sub|non sub|subs|ntsc|ingebakken|torrent|torrentz|bluray|brrip|sample|xvid|cam|camrip|wp|workprint|telecine|ppv|ppvrip|scr|screener|dvdscr|bdscr|ddc|R5|telesync|pdvd|1080p|hq|sd|720p|hdrip/gi,
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
