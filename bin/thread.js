/**
 * Created by nuintun on 2015/12/3.
 */

'use strict';

var path = require('path');
var electron = require('electron');
var ipc = electron.ipcMain;
var iconv = require('iconv-lite');
var jschardet = require('jschardet');
var Emulator = require('./emulator');

// cache
var threads = {};

/**
 * DecodeGenerator
 * @returns {Function}
 * @constructor
 */
function DecodeGenerator(){
  var charset;

  return function (data){
    if (Buffer.isBuffer(data)) {
      if (charset === undefined) {
        charset = jschardet.detect(data).encoding;
      }

      return charset && iconv.encodingExists(charset)
        ? iconv.decode(data, charset)
        : data.toString();
    } else {
      return '';
    }
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
            var decode = DecodeGenerator();

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
              event.sender.send('emulator', 'data', project, decode(data));
            });

            thread.on('error', function (error){
              event.sender.send('emulator', 'error', project, decode(error));
            });

            thread.on('close', function (signal){
              delete threads[project.name];

              event.sender.send('emulator', 'close', project, decode(signal));
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
