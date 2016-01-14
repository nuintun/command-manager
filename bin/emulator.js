/**
 * Created by nuintun on 2015/11/26.
 */

'use strict';

var util = require('util');
var spawn = require('./spawn');
var EventEmitter = require('events');
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

  EventEmitter.call(this);
}

util.inherits(Emulator, EventEmitter);

Emulator.prototype.start = function (){
  var context = this;

  this.thread = spawn(this.task.command, {
    env: this.task.env,
    cwd: this.task.cwd
  });

  this.thread.stdout.on('data', function (chunk){
    context.emit('data', chunk);
  });

  this.thread.stderr.on('data', function (chunk){
    context.stop();
    context.emit('error', chunk);
  });

  this.thread.on('close', function (signal){
    ['stdin', 'stdout', 'stderr'].forEach(function (stream){
      context.thread[stream].removeAllListeners();
    });

    context.thread.removeAllListeners();

    context.thread = null;
    context.connected = false;

    context.emit('close', signal);
  });

  this.connected = true;

  return this;
};

Emulator.prototype.stop = function (){
  if (this.thread) {
    threadKill(this.thread.pid);
  } else {
    this.emit('close', 0);
  }
};

module.exports = Emulator;
