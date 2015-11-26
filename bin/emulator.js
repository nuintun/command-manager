/**
 * Created by nuintun on 2015/11/26.
 */

'use strict';

var ipc = require('ipc-main');

var util = require('util');
var EventEmitter = require('events');
var spawn = require('child_process').spawn;

/**
 * Emulator
 * @param name
 * @param command
 * @constructor
 */
function Emulator(name, command){
  this.name = name;
  this.command = command;

  EventEmitter.call(this);
}

// Inherit functions from `EventEmitter`'s prototype
util.inherits(Emulator, EventEmitter);

Emulator.prototype = {
  start: function (){
    var context = this;

    this.thread = this.exec(this.command)
      .on('data', function (data){
        context.emit('data', data);
      })
      .on('error', function (error){
        context.emit('error', error);
      })
      .on('close', function (signal){
        context.emit('close', signal);
      });
  },
  stop: function (){
    if (this.thread) {
      this.thread.kill('SIGTERM');
    }
  },
  exec: function (command /*, options, callback*/){
    var options = normalizeExecArgs.apply(null, arguments);

    // spawn
    return spawn(options.file, options.args, {
      cwd: options.cwd,
      env: options.env,
      gid: options.gid,
      uid: options.uid,
      windowsVerbatimArguments: !!options.windowsVerbatimArguments
    });
  }
};

/**
 * normalize exec args
 * @param command
 * @param options
 * @returns {{cmd: *, file: *, args: *, options: *}}
 */
function normalizeExecArgs(command, options){
  var file, args;

  // Make a shallow copy before patching so we don't clobber the user's
  // options object.
  options = options || options;

  if (process.platform === 'win32') {
    file = process.env.comspec || 'cmd.exe';
    args = ['/s', '/c', '"' + command + '"'];
    options.windowsVerbatimArguments = true;
  } else {
    file = '/bin/sh';
    args = ['-c', command];
  }

  if (options.shell) {
    file = options.shell;
  }

  return {
    cmd: command,
    file: file,
    args: args,
    options: options
  };
}

var cache = {};

module.exports = {
  Emulator: Emulator,
  start: function (){
    ipc.on('emulator', function (event, project, action){
      switch (action) {
        case 'start':
          if (!cache[project.name]) {
            var emulator = new Emulator(project.command.name, project.command.value);
            var send = function (type, data){
              event.sender.send(type, project, data);
            };

            emulator
              .on('data', function (data){
                send('data', data);
              })
              .on('error', function (error){
                send('error', error);
              })
              .on('close', function (signal){
                send('close', signal);
              });

            cache[project.name] = emulator;
          }
          break;
        case 'stop':
          if (cache[project.name]) {
            cache[project.name].stop();

            delete cache[project.name];
          }
          break;
      }

    });
  }
};
