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
}

Emulator.prototype = {
  start: function (){
    this.thread = spawn(this.task.command, {
      env: this.task.env,
      cwd: this.task.cwd
    });

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
      });
    }
  }
};

module.exports = Emulator;
