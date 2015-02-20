var assert = require('assert');
var episoder = require('../../lib/utils/episoder');

describe('Episoder', function () {
  it('should detect data completely from filename', function () {
    var filenames = [
      'Community S01E04',
      'community s01e04',
      'Community 1x04',
      'Community 1-04',
      'Community Season 1 Episode 4',
      'Community Season 01 Episode 04',
      'Community 104.mp4'
    ]

    for (var i = 0; i < filenames.length; i++) {
      var result = episoder.parseFilename(filenames[i]);

      assert.equal(result.show, 'Community');
      assert.equal(result.season, 1);
      assert.equal(result.episode, 4);
    }
  });

  it('should use the season option', function () {
    var result = episoder.parseFilename('Community S01E04', { season: 6 });
    assert.equal(result.season, 6);
  });

  it('should use the episode option', function () {
    var result = episoder.parseFilename('Community S01E04', { episode: 16 });
    assert.equal(result.episode, 16);
  });

  it('should use the show option', function () {
    var result = episoder.parseFilename('Community S01E04', { show: 'TEST' });
    assert.equal(result.show, 'Test');
  });

  it('should use the offset option', function () {
    var result = episoder.parseFilename('Test S01E04', { offset: 2 });
    assert.equal(result.episode, 6);
  });

  it('should not fail for show name only in filename', function() {
    var result = episoder.parseFilename('Community');
    assert.equal(result, null);
  });
});
