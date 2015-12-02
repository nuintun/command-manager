/**
 * Created by nuintun on 2015/12/2.
 */

'use strict';

importScripts('../../terminal/index.js');

var RUNTIMECACHE = {};

function send(name, xterm){
  postMessage({
    name: name,
    screen: xterm.toString('html')
  });
}

onmessage = function (event){
  var message = event.data;

  switch (message.action) {
    case 'open':
      RUNTIMECACHE[message.name] = RUNTIMECACHE[message.name] || new AnsiTerminal(120, 60, 0);
      send(message.name, RUNTIMECACHE[message.name]);
      break;
    case 'close':
      delete RUNTIMECACHE[message.name];
      break;
    case 'write':
      var xterm = RUNTIMECACHE[message.name];

      xterm.write(message.data);

      send(message.name, xterm);
      break;
  }
};
