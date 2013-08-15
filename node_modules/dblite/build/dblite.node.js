/*!
Copyright (C) 2013 by WebReflection

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

*/
/*!
Copyright (C) 2013 by WebReflection

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

*/
/*! a zero hassle wrapper for sqlite by Andrea Giammarchi !*/
var
  isArray = Array.isArray,
  crypto = require('crypto'),
  path = require('path'),
  EventEmitter = require('events').EventEmitter,
  EOL = require('os').EOL,
  EOL_LENGTH = EOL.length,
  spawn = require('child_process').spawn,
  config = {
    encoding: 'utf8',
    cwd: process.cwd(),
    env: process.env,
    detached: true,
    stdio: ['pipe', 'pipe', 'pipe']
  },
  doubleQuotes = /""/g,
  DECIMAL = /^[1-9][0-9]*$/,
  SELECT = /^(?:select|SELECT|pragma|PRAGMA) /,
  SANITIZER = new RegExp("[;" + EOL.split('').map(function(c) {
    return '\\x' + ('0' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join('') + "]+$"),
  SANITIZER_REPLACER = ';' + EOL,
  REPLACE_QUESTIONMARKS = /\?/g,
  REPLACE_PARAMS = /(?:\:|\@|\$)([a-zA-Z_$]+)/g,
  SINGLE_QUOTES = /'/g,
  SINGLE_QUOTES_DOUBLED = "''",
  HAS_PARAMS = /(?:\?|(?:(?:\:|\@|\$)[a-zA-Z_$]+))/,
  log = console.log.bind(console),
  bin = ['sqlite3'],
  resultBuffer = [],
  selectResult = '',
  paramsIndex,
  paramsArray,
  paramsObject
;

/**
 * var db = dblite('filename.sqlite'):EventEmitter;
 *
 * db.query(              thismethod has **many** overloads where almost everything is optional
 *
 *  SQL:string,           only necessary field. Accepts a query or a command such `.databases`
 *
 *  params:Array|Object,  optional, if specified replaces SQL parts with this object
 *                        db.query('INSERT INTO table VALUES(?, ?)', [null, 'content']);
 *                        db.query('INSERT INTO table VALUES(:id, :value)', {id:null, value:'content'});
 *
 *  fields:Array|Object,  optional, if specified is used to normalize the query result with named fields.
 *                        db.query('SELECT table.a, table.other FROM table', ['a', 'b']);
 *                        [{a:'first value', b:'second'},{a:'row2 value', b:'row2'}]
 *
 *                        
 *                        db.query('SELECT table.a, table.other FROM table', ['a', 'b']);
 *                        [{a:'first value', b:'second'},{a:'row2 value', b:'row2'}]
 *  callback:Function
 * );
 */
function dblite() {

  var
    SUPER_SECRET =  '---' +
                    crypto.randomBytes(64).toString('base64') +
                    '---' +
                    EOL,
    SUPER_SECRET_LENGTH = -SUPER_SECRET.length,
    self = new EventEmitter(),
    args = Array.prototype.slice.call(arguments),
    program = spawn(
      bin[bin.length - 1],
      // normalize file path in any case
      ((args[0] = path.resolve(args[0])), args).concat('-csv'),
      // be sure the dir is the right one
      ((config.cwd = bin.slice(0, -1).join(path.sep) || process.cwd()), config)
    ),
    queue = [],
    busy = false,
    wasSelect = false,
    dontParseCSV = false,
    $callback,
    $fields
  ;

  function next() {
    if (queue.length) {
      self.query.apply(self, queue.shift());
    }
  }

  function onerror(data) {
    if (self.listeners('error').length) {
      self.emit('error', '' + data);
    } else {
      console.error('' + data);
    }
  }

  program.stderr.on('data', onerror);
  program.stdin.on('error', onerror);
  program.stdout.on('error', onerror);
  program.stderr.on('error', onerror);

  program.stdout.on('data', function (data) {
    var str, result, callback, fields;
    selectResult += data;
    if (selectResult.slice(SUPER_SECRET_LENGTH) === SUPER_SECRET) {
      str = selectResult.slice(0, SUPER_SECRET_LENGTH);
      selectResult = '';
      busy = false;
      if (wasSelect) {
        result = dontParseCSV ? str : dblite.parseCSV(str);
        wasSelect = dontParseCSV = busy;
        callback = $callback;
        fields = $fields;
        $callback = $fields = null;
        next();
        if (callback) {
          callback.call(self, fields ? (
              isArray(fields) ?
                result.map(row2object, fields) :
                result.map(row2parsed, parseFields(fields))
            ) :
            result
          );
        }
      } else {
        next();
        if (self.listeners('info').length) {
          self.emit('info', EOL + str);
        } else {
          console.log(EOL + str);
        }
      }
    }
  });
  program.on('close', function (code) {
    self.emit('close', code);
  });
  program.unref();

  // kill the process so don't use it
  // unless you are sure it's OK to close it
  // (i.e. don't forget operations in the middle)
  self.close = function() {
    program.stdin.end();
    program.kill();
  };

  // SELECT last_insert_rowid() FROM table might not work as expected
  // This method makes the operation atomic and reliable
  self.lastRowID = function(table, callback) {
    self.query(
      'SELECT ROWID FROM `' + table + '` ORDER BY ROWID DESC LIMIT 1',
      function(result){
        (callback || log).call(self, result[0][0]);
      }
    );
    return self;
  };

  // Handy if for some reason data has to be passed around
  // as string instead of being serialized and deserialized
  // as Array of Arrays. Don't use if not needed.
  self.plain = function() {
    dontParseCSV = true;
    return self.query.apply(self, arguments);
  };

  // main logic/method/entry point
  self.query = function(string, params, fields, callback) {
    if (busy) return queue.push(arguments);
    wasSelect = SELECT.test(string);
    if (wasSelect) {
      // SELECT and PRAGMA makes `dblite` busy
      busy = true;
      switch(arguments.length) {
        case 4:
          $callback = callback;
          $fields = fields;
          string = replaceString(string, params);
          break;
        case 3:
          if (typeof fields == 'function') {
            $callback = fields;
            if (HAS_PARAMS.test(string)) {
              $fields = null;
              string = replaceString(string, params);
            } else {
              $fields = params;
            }
          } else {
            $callback = log;
            $fields = fields;
            string = replaceString(string, params);
          }
          break;
        case 2:
          if (typeof params == 'function') {
            $fields = null;
            $callback = params;
          } else {
            $callback = log;
            if (HAS_PARAMS.test(string)) {
              $fields = null;
              string = replaceString(string, params);
            } else {
              $fields = params;
            }
          }
          break;
        default:
          $callback = log;
          $fields = null;
          break;
      }
      program.stdin.write(
        // trick to always know when the console is not busy anymore
        // specially for those cases where no result is shown
        sanitize(string) + '.print ' + SUPER_SECRET
      );
    } else {
      if (dontParseCSV) {
        dontParseCSV = false;
        throw new Error('not a select');
      } else if (string[0] === '.') {
        // .commands make `dblite` busy
        busy = true;
        program.stdin.write(string + EOL + '.print ' + SUPER_SECRET);
      } else {
        // all other statements are OK, no need to be busy
        // since no output is shown at all (errors ... eventually)
        program.stdin.write(sanitize(HAS_PARAMS.test(string) ?
          replaceString(string, params) :
          string
        ));
      }
    }
    return self;
  };
  return self;
}

// assuming generated CSV is always like
// 1,what,everEOL
// with double quotes when necessary
// 2,"what's up",everEOL
// this parser works like a charm
function parseCSV(output) {
  for(var
    fields = [],
    rows = [],
    index = 0,
    rindex = 0,
    length = output.length,
    i = 0,
    j, loop,
    current,
    endLine,
    iNext,
    str;
    i < length; i++
  ) {
    switch(output[i]) {
      case '"':
        loop = true;
        j = i;
        do {
          iNext = output.indexOf('"', current = j + 1);
          switch(output[j = iNext + 1]) {
            case EOL[0]:
              if (EOL_LENGTH === 2 && output[j + 1] !== EOL[1]) {
                break;
              }
              /* falls through */
            case ',':
              loop = false;
          }
        } while(loop);
        str = output.slice(i + 1, iNext++).replace(doubleQuotes, '"');
        break;
      default:
        iNext = output.indexOf(',', i);
        endLine = output.indexOf(EOL, i);
        str = output.slice(i, iNext = endLine < iNext ?
          endLine : (
            iNext < 0 ?
              length - EOL_LENGTH :
              iNext
          )
        );
        break;
    }
    fields[index++] = str;
    if (output[i = iNext] === EOL[0] && (
        EOL_LENGTH === 1 || (
          output[i + 1] === EOL[1] && ++i
        )
      )
    ) {
      rows[rindex++] = fields;
      fields = [];
      index = 0;
    }
  }
  return rows;
}

function parseFields($fields) {
  for (var
    current,
    fields = Object.keys($fields),
    parsers = [],
    length = fields.length,
    i = 0; i < length; i++
  ) {
    current = $fields[fields[i]];
    parsers[i] = current === Boolean ?
      $Boolean : (
        current === Date ?
          $Date :
          current || String
      )
    ;
  }
  return {f: fields, p: parsers};
}

function replaceString(string, params) {
  if (isArray(params)) {
    paramsIndex = 0;
    paramsArray = params;
    string = string.replace(REPLACE_QUESTIONMARKS, replaceQuestions);
  } else {
    paramsObject = params;
    string = string.replace(REPLACE_PARAMS, replaceParams);
  }
  paramsArray = paramsObject = null;
  return string;
}

function replaceParams(match, key) {
  return escape(paramsObject[key]);
}

function replaceQuestions() {
  return escape(paramsArray[paramsIndex++]);
}

function row2object(row) {
  for (var
    out = {},
    length = this.length,
    i = 0; i < length; i++
  ) {
    out[this[i]] = row[i];
  }
  return out;
}

function row2parsed(row) {
  for (var
    out = {},
    fields = this.f,
    parsers = this.p,
    length = fields.length,
    i = 0; i < length; i++
  ) {
    out[fields[i]] = parsers[i](row[i]);
  }
  return out;
}

function escape(what) {
  /*jshint eqnull: true*/
  var isNULL = what == null,
      str;
  switch (typeof what) {
    // Object are simply stringified
    case 'object':
      str = isNULL ? 'null' : JSON.stringify(what);
      /* falls through */
    case 'string':
      return isNULL ? str : (
        // all strings are safely escaped
        "'" + what.replace(SINGLE_QUOTES, SINGLE_QUOTES_DOUBLED) + "'"
      );
    // SQLite has no Boolean type
    case 'boolean':
      return what ? '1' : '0'; // 1 => true, 0 => false
    case 'number':
      // only finite numbers can be stored
      if (isFinite(what)) return '' + what;
  }
  // all other cases
  throw new Error('unsupported data');
}

function sanitize(string) {
  return string.replace(SANITIZER, '') + SANITIZER_REPLACER;
}

function $Boolean(field) {
  switch(field.toLowerCase()) {
    case '':
    case '0':
    case 'false':
    case 'null':
      return false;
  }
  return true;
}

function $Date(field) {
  return new Date(
    DECIMAL.test(field) ? parseInt(field, 10) : field
  );
}

// public static

// which sqlite3 executable ?
Object.defineProperty(
  dblite,
  'bin',
  {
    get: function () {
      // normalized string if was a path
      return bin.join(path.sep);
    },
    set: function (value) {
      var isPath = -1 < value.indexOf(path.sep);
      if (isPath) {
        // resolve the path
        value = path.resolve(value);
        // verify it exists
        if (!require('fs').existsSync(value)) {
          throw 'invalid executable: ' + value;
        }
      }
      // assign as Array in any case
      bin = value.split(path.sep);
    }
  }
);

// how to manually parse CSV data ?
dblite.parseCSV = parseCSV;

// how to escape data ?
dblite.escape = escape;

module.exports = dblite;

/**
var db =
  require('./build/dblite.node.js')('./test/dblite.test.sqlite').
  on('info', console.log.bind(console)).
  on('error', console.error.bind(console)).
  on('close', console.log.bind(console));

// CORE FUNCTIONS: http://www.sqlite.org/lang_corefunc.html

// PRAGMA: http://www.sqlite.org/pragma.html
db.query('PRAGMA table_info(kvp)');
*/