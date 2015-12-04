/**
 * Created by nuintun on 2015/12/4.
 */

'use strict';

var Emulator = require('./emulator');

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
