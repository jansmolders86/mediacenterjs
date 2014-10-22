//From https://github.com/rohanorton/episoder 
var path = require("path"),
    titleCase = require("to-title-case");

// filename: string
// options: object
function parseFilename(filename, options) {
  var ext = path.extname(filename).toLowerCase(),
  // the following regex should match:
  //   Community S01E04.mp4
  //   Community s01e04.mp4
  //   Community 1x04.mp4
  //   Community 1-04.mp4
    re = /(.*)\D(\d{1,2})[ex\-](\d{1,2})/i,
    searchResults = filename.match(re),
    show,
    season,
    episode,
    offset,
    episodeObject = {};

  if (options === undefined) {
    options = {};
  }

  offset = options.offset || 0;
  if (searchResults === null) {
    // this regex should match:
    //   Community Season 1 Episode 4.mp4
    // (case insensitive)
    re = /(.*)Season.*?(\d{1,2}).*Episode\D*?(\d{1,2})/i;
    searchResults = filename.match(re);
  }

  if (searchResults === null) {
    // this regex should match:
    //   Community 104.mp4
    re = /(.*)\D(\d)(\d\d)\D/;
    searchResults = filename.match(re);
  }

  if (searchResults === null && options.season) {
    // this regex should match:
    //   Community 04.mp4
    // but only if we've specified a season with season flag
    re = /(.*)\D(\d+)\D/;
    searchResults = filename.match(re);
  }

  if (searchResults === null && options.season && options.show) {
    // this regex should match:
    //   04.mp4
    // but only if we've specified a season and show with flags
    re = /(\d+)\D/;
    searchResults = filename.match(re);
  }

  try {
    show = options.show || searchResults[1];
  } catch (e) {
    return null;
  }
  show = titleCase(show
      // remove hanging characters
      .replace(/^[\-.\s]+|[\-.\s]+$/g, "")
      .trim());

  if (options.episode) {
    episode = options.episode + offset;
    if (searchResults !== null) {
      searchResults.pop();
    }
  } else {
    try {
      episode = Number(searchResults.pop()) + offset;
    } catch (e) {
      return null;
    }
  }

  season = options.season || Number(searchResults.pop());

  episodeObject = {
    originalFilename: filename,
    show: show,
    season: season,
    episode: episode,
    extension: ext
  };
  return episodeObject;
}

exports.parseFilename = parseFilename;
