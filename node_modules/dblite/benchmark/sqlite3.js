var startTime = Date.now(),
    sqlite3 = require('sqlite3'),
    db = new sqlite3.Database('./bench.sqlite3.db');
    //db = new sqlite3.Database(':memory:');

db.serialize(function() {
  db.run('BEGIN');
  db.run('CREATE TABLE IF NOT EXISTS users_login (id INTEGER PRIMARY KEY, name TEXT, pass TEXT)');
  db.run('CREATE TABLE IF NOT EXISTS users_info (id INTEGER PRIMARY KEY, email TEXT, birthday INTEGER)');
  stmt = db.prepare("INSERT INTO users_login VALUES (:id, :name, :pass)");
  for (var stmt, i = 0; i < 1000; i++) {
    stmt.run({
      ':id': null,
      ':name': 'user_' + i,
      ':pass': ('pass_' + i + '_' + Math.random()).slice(0, 11)
    });
  }
  stmt.finalize();
  db.run('COMMIT', function () {
    db.all('SELECT * FROM users_login', function (err, rows) {
      var total = rows.length;
      db.serialize(function() {
        db.run('BEGIN');
        var stmt = db.prepare([
          'REPLACE INTO users_info (id, email, birthday)',
          'VALUES (',
            ':id,',
            'COALESCE((SELECT users_info.email FROM users_info WHERE id = :id), :email),',
            'COALESCE((SELECT users_info.birthday FROM users_info WHERE id = :id), :bday)',
          ')'
          ].join(' ')
        );
        rows.forEach(function (row) {
          stmt.run(
            {
              ':id': row.id,
              ':email': 'user_' + row.id + '@email.com',
              ':bday': parseInt(Math.random() * startTime)
            }
          );
        });
        stmt.finalize();
        db.run('COMMIT', function () {
          function onUserInfo(err, row) {
            if (!--i) {
              if (process.argv[2] == 1) {
                console.log('completed in ' + ((Date.now() - startTime) / 1000) + ' seconds');
                console.log('found ' + found + ' random matches out of ' + total + ' possibilities');
                if (found) {
                  console.log('last row looked like this');
                  console.log(lastValidRow);
                }
              }
              db.close();
            }
          }

          function onRun(err, row) {
            // I am not even adding validation ...
            if (row) {
              found++;
              lastValidRow = row;
              row.bday = new Date(row.birthday);
              delete row.birthday;
            }
          }

          for (var found = 0, i = 0; i < 100; i++) {
            db.each([
                'SELECT users_login.name, users_info.email, users_info.birthday',
                'FROM users_login',
                'LEFT JOIN users_info',
                'ON (users_login.id = users_info.id)',
                'WHERE users_login.name = :name AND users_login.pass = :pass'
              ].join(' '),
              {
                ':name': 'user_' + i,
                ':pass': ('pass_' + i + '_' + Math.random()).slice(0, 11)
              },
              onRun,
              onUserInfo
            );
          }
        });
      });
    });
  });

});