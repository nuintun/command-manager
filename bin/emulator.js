/**
 * Created by nuintun on 2015/11/26.
 */

'use strict';

var ipc = require('ipc-main');

var spawn = require('child_process').spawn;

/**
 * Emulator
 * @param task
 * @constructor
 */
function Emulator(task){
  this.task = task;
}

Emulator.prototype = {
  start: function (){
    this.thread = this.exec(this.task.command, {
      env: this.task.env,
      cwd: this.task.cwd
    });

    return this.thread;
  },
  stop: function (){
    if (this.thread) {
      this.thread.kill('SIGTERM');
    }
  },
  exec: function (){
    var parsed = normalizeExecArgs.apply(null, arguments);

    return spawn(parsed.shell, parsed.args, parsed.options);
  }
};

/**
 * normalize exec args
 * @param command
 * @param options
 * @returns {{cmd: *, shell: *, args: *, options: *}}
 */
function normalizeExecArgs(command, options){
  var shell, args;

  // Make a shallow copy before patching so we don't clobber the user's
  // options object.
  options = options || {};

  if (process.platform === 'win32') {
    shell = process.env.comspec || 'cmd.exe';
    args = ['/s', '/c', '"' + command + '"'];
    options.windowsVerbatimArguments = true;
  } else {
    shell = '/bin/sh';
    args = ['-c', command];
  }

  if (options.shell) {
    shell = options.shell;
  }

  return {
    shell: shell,
    args: args,
    options: options
  };
}

var emulators = {};

module.exports = {
  Emulator: Emulator,
  start: function (){
    ipc.on('emulator', function (event, project, action){
      var key = project.name + '-' + project.command.name;
      var emulator = emulators[key];

      switch (action) {
        case 'start':
          if (!emulator) {
            var env = {};

            Object.keys(process.env).forEach(function (key){
              env[key] = process.env[key];
            });

            project.env.forEach(function (item){
              env[item.name] = item.value;
            });

            emulator = new Emulator({
              env: env,
              cwd: project.path,
              command: project.command.value
            });

            var stream = emulator.start();

            stream.stdout.on('data', function (data){
              event.sender.send('data', project, data);
            });

            stream.stderr.on('error', function (error){
              event.sender.send('error', project, error);

              emulator.stop();

              delete emulators[key];
            });

            stream.on('close', function (signal){
              event.sender.send('close', project, signal);

              delete emulators[key];
            });

            emulators[key] = emulator;
          }
          break;
        case 'stop':
          if (emulator) {
            emulator.stop();
          }
          break;
      }
    });
  }
};
