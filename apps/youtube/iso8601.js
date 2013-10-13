/**
 * Shared and maintained by [Nezasa](http://www.nezasa.com)
 * Published under [Apache 2.0 license](http://www.apache.org/licenses/LICENSE-2.0.html)
 * Edited by: brutalhonesty (https://github.com/brutalhonesty) for NodeJS-compatibility
 */

/**
 * Returns the total duration of the period in seconds.
 */
module.exports.parseToTotalSeconds = function(period) {
	var multiplicators = [31104000 /* year   (360*24*60*60) */,
	2592000  /* month  (30*24*60*60) */,
	604800   /* week   (24*60*60*7) */,
	86400    /* day    (24*60*60) */,
	3600     /* hour   (60*60) */,
	60       /* minute (60) */,
	1        /* second (1) */];
	var durationPerUnit = parsePeriodString(period);
	var durationInSeconds = 0;
	for (var i = 0; i < durationPerUnit.length; i++) {
		durationInSeconds += durationPerUnit[i] * multiplicators[i];
	}
	return durationInSeconds;
};

/**
 * Parses a ISO8601 period string.
 * @param period iso8601 period string
 * @param _distributeOverflow if 'true', the unit overflows are merge into the next higher units.
 */
function parsePeriodString(period, _distributeOverflow) {
    // regex splits as follows
    // grp0 omitted as it is equal to the sample
    //
    // | sample            | grp1   | grp2 | grp3 | grp4 | grp5 | grp6       | grp7 | grp8 | grp9 |
    // --------------------------------------------------------------------------------------------
    // | P1Y2M3W           | 1Y2M3W | 1Y   | 2M   | 3W   | 4D   | T12H30M17S | 12H  | 30M  | 17S  |
    // | P3Y6M4DT12H30M17S | 3Y6M4D | 3Y   | 6M   |      | 4D   | T12H30M17S | 12H  | 30M  | 17S  |
    // | P1M               | 1M     |      | 1M   |      |      |            |      |      |      |
    // | PT1M              | 3Y6M4D |      |      |      |      | T1M        |      | 1M   |      |
    // --------------------------------------------------------------------------------------------
    var distributeOverflow = (_distributeOverflow) ? _distributeOverflow : false;
    var valueIndexes       = [2, 3, 4, 5, 7, 8, 9];
    var duration           = [0, 0, 0, 0, 0, 0, 0];
    var overflowLimits     = [0, 12, 4, 7, 24, 60, 60];
    var struct;
    // upcase the string just in case people don't follow the letter of the law
    period = period.toUpperCase();
    // input validation
    if (!period)                         return duration;
    else if (typeof period !== "string") throw new Error("Invalid iso8601 period string '" + period + "'");
    // parse the string
    if (struct = /^P((\d+Y)?(\d+M)?(\d+W)?(\d+D)?)?(T(\d+H)?(\d+M)?(\d+S)?)?$/.exec(period)) {

        // remove letters, replace by 0 if not defined
        for (var i = 0; i < valueIndexes.length; i++) {
            var structIndex = valueIndexes[i];
            duration[i] = struct[structIndex] ? +struct[structIndex].replace(/[A-Za-z]+/g, '') : 0;
        }
    }
    else {
        throw new Error("String '" + period + "' is not a valid ISO8601 period.");
    }
    if (distributeOverflow) {
        // note: stop at 1 to ignore overflow of years
        for (var i = duration.length - 1; i > 0; i--) {
            if (duration[i] >= overflowLimits[i]) {
                duration[i-1] = duration[i-1] + Math.floor(duration[i]/overflowLimits[i]);
                duration[i] = duration[i] % overflowLimits[i];
            }
        }
    }
    return duration;
};