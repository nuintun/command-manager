/**
 * Created by nuintun on 2015/11/26.
 */

'use strict';

var spawn = require('./spawn');
var threadKill = require('./thread-kill');

/**
 * Emulator
 * @param task
 * @constructor
 */
function Emulator(task){
  this.task = task;
  this.thread = null;
  this.connected = false;
}

Emulator.prototype = {
  start: function (){
    var context = this;

    this.thread = spawn(this.task.command, {
      env: this.task.env,
      cwd: this.task.cwd
    });

    this.thread.stderr.on('data', function (){
      context.stop();
    });

    this.thread.on('close', function (){
      context.stop();
    });

    this.connected = true;

    return this.thread;
  },
  stop: function (){
    if (this.thread) {
      var context = this;

      threadKill(this.thread.pid, function (){
        ['stdin', 'stdout', 'stderr'].forEach(function (stream){
          context.thread[stream].removeAllListeners();
        });

        context.thread = null;
        context.connected = false;
      });
    }
  }
};

module.exports = Emulator;
