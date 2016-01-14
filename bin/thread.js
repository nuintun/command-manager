/**
 * Created by nuintun on 2015/12/3.
 */

'use strict';

var path = require('path');
var ipc = require('ipc-main');
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

            var stream = thread.start();

            stream.stdout.on('data', function (data){
              event.sender.send('emulator', 'data', project, data.toString());
            });

            stream.stderr.on('data', function (error){
              event.sender.send('emulator', 'error', project, error.toString());
            });

            stream.on('close', function (signal){
              event.sender.send('emulator', 'close', project, signal.toString());

              delete threads[project.name];
            });

            threads[project.name] = thread;
          } else {
            thread.stop();
          }
          break;
        case 'stop':
          if (thread) {
            thread.stop();
          }
          break;
      }
    });
  }
};
