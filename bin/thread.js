/**
 * Created by nuintun on 2015/12/3.
 */

'use strict';

var path = require('path');
var ipc = require('ipc-main');
var fork = require('child_process').fork;

// cache
var threads = {};

/**
 * killThread
 * @param name
 */
function killThread(name){
  var thread = threads[name];

  if (thread && thread.connected) {
    thread.send({
      action: 'stop'
    });

    delete threads[name];
  }
}

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

            thread = fork(path.join(__dirname, 'child-thread'), {
              env: env
            });

            thread.on('message', function (message){
              event.sender.send('emulator', message.event, message.project, message.data);
            });

            thread.on('error', function (){
              killThread(project.name);
            });

            delete project.env;

            thread.send({
              action: 'start',
              project: project
            });

            threads[project.name] = thread;
          } else {
            delete project.env;

            thread.send({
              action: 'start',
              project: project
            });
          }
          break;
        case 'stop':
          killThread(project.name);
          break;
      }
    });
  }
};
