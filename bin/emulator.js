/**
 * Created by nuintun on 2015/11/26.
 */

'use strict';

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

// thread
process.on('message', function (project){
  var stream;

  var emulator = new Emulator({
    cwd: project.path,
    command: project.command.value
  });

  stream = emulator.start();

  stream.stdout.on('data', function (data){
    process.send({
      event: 'data',
      project: project,
      data: data.toString()
    });
  });

  stream.stderr.on('data', function (error){
    emulator.stop();
    process.send({
      event: 'error',
      project: project,
      data: error.toString()
    });
  });

  stream.on('close', function (signal){
    emulator.stop();
    process.send({
      event: 'close',
      project: project,
      data: signal.toString()
    });
  });
});
