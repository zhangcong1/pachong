var mysql = require('mysql');
var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '20141216',
    database: 'pachong',
});
connection.connect();

module.exports = connection;
