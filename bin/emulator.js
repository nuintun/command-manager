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
      this.thread.kill('SIGKILL');

      ['stdin', 'stdout', 'stderr'].forEach(function (stream){
        this.thread[stream].removeAllListeners();
      }, this);

      this.thread = null;
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

module.exports = Emulator;
