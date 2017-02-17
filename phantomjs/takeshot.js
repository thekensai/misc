var http = require('http');
var fs = require('fs');

var post_data = JSON.stringify({"filter":{"bool" :  { "must" : [
	{ "not": { "missing" :  {
                            "field": ["url"]
                          }}},
     {   "missing" :  {
                            "field": ["set"]
                          }},
                         { "missing" :  {
                            "field": [ "lock"]
                          }}
    ]}}
    });

function probe() {
	var post_req = http.request({host: 'localhost',
      port: '9200',
      path: '/creative/screenshot/_search',
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(post_data)
      }}, 

      function(res) {
	      res.setEncoding('utf8');
	      res.on('data', function (chunk) {
      	 var json = JSON.parse(chunk);
      	 var hits = json.hits;
      	 if (hits && hits.total) {
			console.log(JSON.stringify(hits.hits[0], null, 2));

			var hit = hits.hits[0];
			var id = hit["_id"];
			var file = id + '.jpg';//hit["_source"].file;
			var url = hit["_source"].url;

			postUpdate(id, JSON.stringify({"doc" : {"lock": new Date()}}));

			var spawn = require('child_process').spawn;
			var prc = spawn('C:/Users/Jerry.Wang/Downloads/phantomjs-2.1.1-windows/bin/phantomjs.exe',  
				['C:/Users/Jerry.Wang/Downloads/phantomjs-2.1.1-windows/bin/sc.js', url, id + '.jpg']);

			//noinspection JSUnresolvedFunction
			prc.stdout.setEncoding('utf8');
			prc.stdout.on('data', function (data) {
			    var str = data.toString()
			    var lines = str.split(/(\r?\n)/g);
			    //Status: fail
			    console.log(lines.join(""));
			});

			prc.on('close', function (code) {
			    console.log('phantomjs exit code ' + code);

			    if (!code) {
			    	var path = 'D:/TFS/src/Savvy/WebSite_internetdemo/SavvyWebService2/target_screenshot/';
			    	console.log('checking file ' + path + file + ' ...');

					if (fs.existsSync(path + file)) {

						console.log('exists ');

						postUpdate(id, JSON.stringify({"doc" : {"set": 1}}));
					}
					else {
						console.log('Does not exist!!');
					}
			    }
			    else {
			    	postUpdate(id, JSON.stringify({"script" : "ctx._source.try+=1"}));
			    }
			});
      	}
      });
  });

  // post the data
  post_req.write(post_data);
  post_req.end();
}

function postUpdate(id, post_data) {
	var update_req = http.request(
		{host: 'localhost',
	  port: '9200',
	  path: '/creative/screenshot/' + id + '/_update',
	  method: 'POST',
	  headers: {
	      'Content-Type': 'application/json',
	      'Content-Length': Buffer.byteLength(post_data)
	  }}, 

	  function(res_update) {
	  	res_update.setEncoding('utf8');
	      res_update.on('data', function (chunk_update) {
	  	   console.log(JSON.parse(chunk_update));
	  	});
	  }
	);

	update_req.write(post_data);
	update_req.end();
}

setInterval(probe, 1000);