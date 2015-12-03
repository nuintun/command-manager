/**
 * Created by nuintun on 2015/12/3.
 */

'use strict';

var cluster = require('cluster');

var ipc = require('ipc-main');

// cache
var workers = {};

/**
 * killWorker
 * @param name
 */
function killWorker(name){
  var worker = workers[name];

  if (worker && !worker.isDead()) {
    worker.kill('SIGTERM');

    delete workers[name];
  }
}

module.exports = {
  start: function (){
    ipc.on('emulator', function (event, project, action){
      var key = project.name + '-' + project.command.name;
      var worker = workers[key];

      switch (action) {
        case 'start':
          if (!worker || worker.isDead()) {
            var env = {};

            Object.keys(process.env).forEach(function (key){
              env[key] = process.env[key];
            });

            project.env.forEach(function (item){
              env[item.name] = item.value;
            });

            worker = cluster.fork(env);

            worker.on('message', function (message){
              event.sender.send('emulator', message.event, message.project, message.data);
            });

            worker.on('error', function (){
              killWorker(project.name);
            });

            delete project.env;

            worker.send(project);

            workers[project.name] = worker;
          } else {
            delete project.env;

            worker.send(project);
          }
          break;
        case 'stop':
          killWorker(project.name);
          break;
      }
    });
  }
};
