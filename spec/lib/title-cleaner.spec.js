var assert = require('assert');
var title_cleaner = require('../../lib/utils/title-cleaner');

describe('TitleCleaner', function () {
  it('should clean titles correctly', function () {
    var corrupt_titles = [
      '',
      'A.Better.Life.LIMITED.DVDRip.XviD-TWiZTED',
      'Aladdin[1992]DvDrip[Eng]-Stealthmaster',
      'Austin Powers International Man of Mystery 1997.720p.x264.BRRip.GokU61',
      'Harry Potter And The Deathly Hallows Pt1 2010 BRRip 1080p x264 AAC - honchorella (Kingdom Release)',
      'GLADIATOR[2000]DvDrip-GHZ',
      'Fight.Club.iMMORTALS.(1999).xvid-R5.torrent'
    ]
    var cleaned_titles = [
      '', // Empty titles should not throw an error
      'A Better Life LIMITED',
      'Aladdin',
      'Austin Powers International Man of Mystery GokU61',
      'Harry Potter And The Deathly Hallows Pt1 (Kingdom Release)',
      'GLADIATOR',
      'Fight Club'
    ]

    // Assert
    for (var i = 0; i < corrupt_titles.length; i++) {
      var result = title_cleaner.cleanupTitle(corrupt_titles[i]);
      var expected = cleaned_titles[i];
      assert.equal(result.title, expected);
    }
  });
});
