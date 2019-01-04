var md5 = require('md5-node');
console.log(md5('a'));
console.log(md5('b'));

var mysql = require('./mysql');
mysql.query('select * from news',function (err,result) {
    if (err){
        console.log(err);
    } else {
        console.log(result);
    }
});
mysql.query('insert into news (title,con) values ? ',function (err,result) {
    
})