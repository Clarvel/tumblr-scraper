'use strict';
const {PostParser} = require('./parsers');
const http = require('http');
const https = require('https');

/* Code to utility func which fetches a found posts information. Callback
should be in error-first format. */
module.exports = function(postData, callback){
  const {type, host, path, ishttps} = postData;
  const protocol = ishttps ? https : http;
  var haltParse = false;
  const parser = new PostParser(postData.type);
  const options = {
    host:host,
    path:type === 'is_video' ? path : path+'/mobile',
    timeout:5000,
    headers:{
      'user-agent':'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) '+
                   'AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 '+
                   'Safari/601.1'
    }
  };
  const pData = {
    href:host+path,
    type:type.tumblrTypeTranslate(),
    post:null
  };
  parser.on('post', (data) =>{
    haltParse = true;
    pData['post'] = data;
    request.abort();
    callback(null, pData); // data found, all good to continue.
  });
  const request = protocol.get(options, (res) => {
    if (res.statusCode !== 200) {
      console.log('Response Error - Host:'+options.host+' Path: '+options.path+' - recieved - ' + res.statusCode);
      haltParse = true;
      callback({
        path:options.path,
        type:'response',
        msg:res.statusCode+' received.'
      }, null); // response error
      request.abort();
      return;
    }
    res.on('data',(chunk) => {
      if (!haltParse)
        parser.write(chunk);
    });
  }).on('error', (e) => {
    haltParse = true;
    console.log('Request Error - Host: '+options.host+' Path: '+options.path+' - recieved - '+e.message+ ' - options:'+JSON.stringify(options));
    request.abort();
    callback({
      path:options.path,
      type:'request',
      msg:e.message
    }, null);
  });
}
