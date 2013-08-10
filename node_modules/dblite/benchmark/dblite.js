var startTime = Date.now(),
    db = require('../build/dblite.node.js')('./bench.dblite.db');

db.query('BEGIN');
db.query('CREATE TABLE IF NOT EXISTS users_login (id INTEGER PRIMARY KEY, name TEXT, pass TEXT)');
db.query('CREATE TABLE IF NOT EXISTS users_info (id INTEGER PRIMARY KEY, email TEXT, birthday INTEGER)');
for (var i = 0; i < 1000; i++) {
  db.query('INSERT INTO users_login VALUES (:id, :name, :pass)', {
    id: null,
    name: 'user_' + i,
    pass: ('pass_' + i + '_' + Math.random()).slice(0, 11)
  });
}
db.query('COMMIT');

db.query('SELECT * FROM users_login', function (rows) {
  var total = rows.length,
      lastValidRow;
  db.query('BEGIN');
  rows.forEach(function (row) {
    db.query(
      this, {
        id: row[0],
        email: 'user_' + row[0] + '@email.com',
        bday: parseInt(Math.random() * startTime)
      }
    );
  },[
    'REPLACE INTO users_info (id, email, birthday)',
    'VALUES (',
      ':id,',
      'COALESCE((SELECT users_info.email FROM users_info WHERE id = :id), :email),',
      'COALESCE((SELECT users_info.birthday FROM users_info WHERE id = :id), :bday)',
    ')'
    ].join(' ')
  );
  db.query('COMMIT');

  function onUserInfo(rows) {
    if (rows.length) {
      found++;
      lastValidRow = rows[0];
    }
    if (!--i) {
      db.on('close', function () {
        if (process.argv[2] == 1) {
          console.log('completed in ' + ((Date.now() - startTime) / 1000) + ' seconds');
          console.log('found ' + found + ' random matches out of ' + total + ' possibilities');
          if (found) {
            console.log('last row looked like this');
            console.log(lastValidRow);
          }
        }
      }).close();
    }
  }

  for (var found = 0, i = 0; i < 100; i++) {
    db.query([
      'SELECT users_login.name, users_info.email, users_info.birthday',
      'FROM users_login',
      'LEFT JOIN users_info',
      'ON (users_login.id = users_info.id)',
      'WHERE users_login.name = :name AND users_login.pass = :pass'
    ].join(' '),
    {
      name: 'user_' + i,
      pass: ('pass_' + i + '_' + Math.random()).slice(0, 11)
    },
    {
      name: String,
      email: String,
      bday: Date
    },
    onUserInfo
    );
  }

});