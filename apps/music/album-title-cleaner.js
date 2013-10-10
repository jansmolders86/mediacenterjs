/* Public Method */

/**
 * Cleans up the specified album title
 * @param albumTitle            The Album title
 * @returns {{albumTitle: string, year: string, cd: string}}
 */
exports.cleanupAlbumTitle = function(albumTitle) {
	// Cleanup Album Title
	var cleanAlbumTitle = albumTitle;
	cleanAlbumTitle = stripIllegalCharacters(cleanAlbumTitle, '');
	cleanAlbumTitle = removeYearFromTitle(cleanAlbumTitle);
	cleanAlbumTitle = removeMusicTypesFromTitle(cleanAlbumTitle);
	cleanAlbumTitle = removeCdNumberFromTitle(cleanAlbumTitle);

	// Extract CD-Number from Title
	var hasCdinTitle = albumTitle.match(/cd [1-9]|cd[1-9]/gi);
	var cd_number = hasCdinTitle ? hasCdinTitle.toString() : '';

	// Extract Year from Title
	var year = albumTitle.match(/([0-9]{4})|\(|\)|\[|\]/g);
	year = year ? year.toString() : '';

	return { albumTitle: cleanAlbumTitle, year: year, cd: cd_number };
};

/* Private Method */

stripIllegalCharacters = function(movieTitle, replacementString) {
	return movieTitle.replace(/\.|_|\/|\+|\-/g, replacementString);
};

removeYearFromTitle = function(movieTitle) {
	return movieTitle.replace(/([0-9]{4})|\(|\)|\[|\]/g, "");
};

removeMusicTypesFromTitle = function(movieTitle) {
	return movieTitle.replace(
		/320kbps|192kbps|128kbps|mp3|320|192|128/gi,
		"");
};

removeCdNumberFromTitle = function(movieTitle) {
	return movieTitle.replace(/cd [1-9]|cd[1-9]/gi, "");
};
