//From https://github.com/rohanorton/episoder
var path = require("path"),
    titleCase = require("to-title-case");

// filename: string
// options: object
function parseFilename(filename, options) {
  // the following regex should match:
  //   Community S01E04.mp4
  //   Community s01e04.mp4
  //   Community 1x04.mp4
  //   Community 1-04.mp4
  //   Community Season 01 Episode 04.mp4
  var re = /(\w+)\s*\D(?:Season\s*)?(\d{1,2})(?:[ex\-]|\s*Episode\s*)(\d{1,2})/i;
  var searchResults = filename.match(re);

  if (!options) {
    options = {};
  }

  if (!searchResults) {
    // this regex should match:
    //   Community 104.mp4
    re = /(.*)\D(\d)(\d\d)\D/;
    searchResults = filename.match(re);
  }

  if (!searchResults && options.season) {
    // this regex should match:
    //   Community 04.mp4
    // but only if we've specified a season with season flag
    re = /(.*)\D(\d+)\D/;
    searchResults = filename.match(re);
  }

  if (!searchResults && options.season && options.show) {
    // this regex should match:
    //   04.mp4
    // but only if we've specified a season and show with flags
    re = /(\d+)\D/;
    searchResults = filename.match(re);
  }

  if (!searchResults) {
    return null;
  }

  var show = options.show || searchResults[1];
  show = titleCase(show.replace(/^[\-.\s]+|[\-.\s]+$/g, "").trim());

  var season = options.season || parseInt(searchResults[2], 10);

  var offset = options.offset || 0;
  var episode = (options.episode || parseInt(searchResults[3], 10)) + offset;

  var ext = path.extname(filename).toLowerCase();
  return {
    originalFilename: filename,
    show: show,
    season: season,
    episode: episode,
    extension: ext
  };
}

exports.parseFilename = parseFilename;
