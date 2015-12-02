/**
 * Created by nuintun on 2015/12/2.
 */

'use strict';

importScripts('../../terminal/index.js');

var ACTIVE;
var RUNTIMECACHE = {};

function send(name, xterm){
  postMessage({
    name: name,
    screen: xterm.toString('html')
  });
}

onmessage = function (event){
  var xterm;
  var message = event.data;

  switch (message.action) {
    case 'open':
      xterm = RUNTIMECACHE[message.name];

      if (!xterm) {
        xterm = new AnsiTerminal(120, 60, 0);
        xterm.newline_mode = true;
        RUNTIMECACHE[message.name] = xterm;
      }

      ACTIVE = message.name;

      send(message.name, xterm);
      break;
    case 'close':
      delete RUNTIMECACHE[message.name];
      break;
    case 'write':
      xterm = RUNTIMECACHE[message.name];

      if (ACTIVE === message.name) {
        xterm.write(message.data);
        send(message.name, xterm);
      } else {
        setTimeout(function (){
          xterm.write(message.data);
        }, 16);
      }
      break;
  }
};
