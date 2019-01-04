/*代理请求*/
var request = require("request");
/*异步同步执行*/
var async = require("async");
/*处理爬取到的html字符串*/
var cheerio = require("cheerio");
/*定时任务*/
var CronJob = require('cron').CronJob;
/*秒 分 时 天 月 星期 */
new CronJob('* * * * * *', function() {
    getData();
}, null, true, 'America/Los_Angeles');
/*md5加密*/
var md5 = require("md5-node");
/*引入mysql*/
var mysql = require("./mysql");
/*实例化一个buffer*/
var buf = new Buffer(65535);

function getData() {
    /*声明数组存储数据*/
    var arr = [];
    var arrEnd = [];
    /*保证执行顺序 使用saync的串行*/
    async.series([
        /*查询数据库,存入buffer,去重*/
        function (next) {
            mysql.query("select * from news",function (error,result) {
                if(error){
                    console.log(error);
                }else {
                    for(var i = 0;i < result.length;i ++){
                        save(result[i].title,4)
                    }
                }
                next();
            })
        },
        /*发送请求爬取数据*/
        function (next) {
            request("http://news.ifeng.com/world/index.shtml",function (error,head,body) {
                if(error){
                    console.log(error);
                }
                var $ = cheerio.load(body);
                $(".juti_list h3 a").each(function (index,obj) {
                    var newObj = {};
                    newObj.url = $(obj).attr("href");
                    newObj.text = $(obj).text();
                    diff(newObj.text,4,function () {
                        save(newObj.text,4)
                    },function () {
                        arr.push(newObj)
                    })
                })
                next();
            })
        },
        /*通过保存的链接获取对应的内容详情*/
        function (next) {
            /*循环串行*/
            async.eachSeries(arr,function (item,nextOne) {
                /*对链接发起请求*/
                request(item.url,function (error,head,body) {
                    if(error){
                        console.log(error);
                    }
                    var $ = cheerio.load(body);
                    var con =  $("#main_content").text();

                    var newarr = [];
                    newarr.push(item.text);
                    newarr.push(con);
                    arrEnd.push(newarr);
                    console.log(arrEnd);
                    nextOne();
                })
            },function () {
                next();
            })

        },
        /*经获取到的数据存入数据库*/
        function (next) {
            mysql.query("insert into news (title,con) values ? ",[arrEnd],function (error,result) {
                if(error){
                    console.log(error);
                }else {
                    console.log("success");
                }
                next();
            })
        }
    ],function () {
        console.log("end");
    })
}

/*利用buffer来去重 布隆算法*/
function save(str,num){
    var result = md5(str);
    for(var i = 0;i < result.length;i+=4){
        buf[parseInt(result.substr(i,num),16)] = 1;
    }
}
function diff(str,num,same,no){
    var result = md5(str);
    var flag = true;
    for(var i = 0;i < result.length;i+=num){
        if(buf[parseInt(result.substr(i,num),16)] !== 1){
            flag = false;
            break;
        }
    }
    if(flag){
        if(same){
            same();
        }
    }else{
        if(no){
            no();
        }
    }
}