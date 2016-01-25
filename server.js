var https = require('https');
var http = require('http');
var url = require('url');
var fs = require('fs');
var request = require('request');
var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;

var port = process.env.PORT || 8080;
//console.log(MONGOLAB_URI);
var Url = process.env.MongoDb;
//var Url = 'mongodb://justuser:justuser@ds039195.mongolab.com:39195/dbfornode';

var word = '', time;
 
function getURL(word){
    var key = 'AIzaSyAx353Q3uoUU2ZPhGUV9_YNl7TOrhFEQb4';
    var cx = '012254012315510308687:4tnj8ftr3x8';
    var searchword = word;    
    var surl = 'https://www.googleapis.com/customsearch/v1?key=' + key + '&cx=' + cx + '&searchType=image&q=' + searchword;
    return surl;
}

function inToDb(str, time, Url){
    // Use connect method to connect to the Server
    str = str.split('%20').join(' ');
    MongoClient.connect(Url, function (err, db) {
        if (err) {
        console.log('Unable to connect to the mongoDB server. Error:', err);
        } else {
            console.log('Connection established to', Url);
            
            db.collection('items').insert({search_string: str, when: time}, function (err, result) {
                if (err) {
                    console.log(err);
                } else {
                    console.log('Inserted!');
                }
                //Close connection
                db.close();
            });
        } 
    });
}
    
var server = http.createServer(function(req, resp){
    var obj = url.parse(req.url, true);
    var objpath = obj.path.split('/');
    if(objpath.length === 2){
        resp.writeHead(200,{'content-type':'text/html'});
        var html = fs.readFileSync(__dirname+'/index.htm');
        resp.end(html);        
    }else if(objpath.length === 4 && objpath[3] === 'latest'){
        console.log('3 is running');       
        MongoClient.connect(Url, function (err, db) {
        if (err) {
        console.log('Unable to connect to the mongoDB server. Error:', err);
        } else {
            console.log('Connection (find) established to', Url);
            
            db.collection('items').find({},{_id:0}).toArray(function (err, result) {
                if (err) {
                    console.log(err);
                } else if (result.length) {
                    console.log(typeof result);
                    resp.end(JSON.stringify(result));
                } else {
                    console.log('No document(s) found with defined "find" criteria!');
                }
                //Close connection
                db.close();
            });
        } 
    });
    }else if(objpath.length === 4){
        console.log('1 is running');
        time = new Date(Date.now());        
        word = obj.path.split('/')[3];
        request(getURL(word), function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var ob = JSON.parse(body);
                var arr = ob.items;              
                resp.end(JSON.stringify(arr));
            }
        });        
        inToDb(word, time, Url);
    }else if(objpath.length === 5 && objpath[4] === 'offset=2'){
        console.log('2 is running');
        time = new Date(Date.now());        
        word = obj.path.split('/')[3];
        request(getURL(word), function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var ob = JSON.parse(body);
                var arr = ob.items; 
                var fdata = {}, k=1, p;
                for(var j = 0; j<arr.length; j++){
                    p = 'page ' + k;
                    fdata[p] = arr[j];
                    k++;
                }             
                resp.end(JSON.stringify(fdata, null, 2));
            }
        });        
        inToDb(word, time, Url);
    }else{
        resp.writeHead(200, {'content-type': 'text/plain'});
        resp.end('It seems there is an error in entered URL string. Please check it with manual on main page.');
    }
});     
server.listen(port, function(){
    console.log('Our app is running on http://localhost:'+port);
});  































/*
var server = http.createServer(function(req, resp){  
    var obj = url.parse(req.url, true);
    if(obj.path.length===1){
        resp.writeHead(200, {'content-type': 'text/html'}); 
        var html = fs.readFileSync(__dirname+'/index.htm');
        resp.end(html);
    }else if(obj.path.split('/').length === 4){
        searching = obj.path.split('/')[3];
        resp.writeHead(200, {'content-type': 'application/json'});
        var st = JSON.parse(data);
        var tt = st.items[3];
        var URL = st.items[3].link;
        var SNIPPET = st.items[3].snippet;
        var THUMB = st.items[3].image.thumbnailLink;
        var CONTEXT = st.items[3].image.contextLink;
        var dat = {
            url: URL,
            snippet: SNIPPET,
            thumbnail: THUMB,
            context: CONTEXT
        }
        var ww = JSON.stringify(dat);
        //resp.end(JSON.parse(JSON.stringify(st.items[0]))); 
        resp.end(ww);
    }
});
server.listen(port, function(){
	console.log('Our app is running on http://localhost:'+port);
});
*/



