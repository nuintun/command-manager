/**
 * Created by nuintun on 2015/12/3.
 */

'use strict';

var path = require('path');
var ipc = require('ipc-main');
var iconv = require('iconv-lite');
var jschardet = require('jschardet');
var Emulator = require('./emulator');

// cache
var threads = {};

module.exports = {
  start: function (){
    ipc.on('emulator', function (event, project, action){
      var thread = threads[project.name];

      switch (action) {
        case 'start':
          if (!thread || !thread.connected) {
            var env = {};
            var encoding;

            Object.keys(process.env).forEach(function (key){
              env[key] = process.env[key];
            });

            project.env.forEach(function (item){
              env[item.name] = item.value;
            });

            thread = new Emulator({
              env: env,
              cwd: project.path,
              command: project.command.value
            });

            thread.on('data', function (data){
              if (encoding === undefined) {
                encoding = jschardet.detect(data).encoding;
              }

              data = encoding ? iconv.decode(data, encoding) : data.toString();

              event.sender.send('emulator', 'data', project, data);
            });

            thread.on('error', function (error){
              if (encoding === undefined) {
                encoding = jschardet.detect(error).encoding;
              }

              error = encoding ? iconv.decode(error, encoding) : error.toString();

              event.sender.send('emulator', 'error', project, error);
            });

            thread.on('close', function (signal){
              event.sender.send('emulator', 'close', project, signal.toString());

              delete threads[project.name];
            });

            thread.start();

            threads[project.name] = thread;
          } else {
            thread.stop();
          }
          break;
        case 'stop':
          if (thread) {
            thread.stop();
          } else {
            event.sender.send('emulator', 'close', project, 0);
          }
          break;
      }
    });
  }
};
