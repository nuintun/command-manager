/**
 * Created by nuintun on 2015/11/18.
 */

'use strict';

// module to control application life
var ipc = require('ipc-main');
var dialog = require('dialog');

/**
 * open directory
 * @param window
 */
module.exports = function (window){
  // listen open directory ipc
  ipc.on('open-directory', function (event, path, uid){
    dialog.showOpenDialog(window, {
      title: window.getTitle(),
      properties: ['openDirectory'],
      defaultPath: path || ''
    }, function (directorys){
      if (directorys) {
        event.sender.send('select-directory', directorys, uid);
      }
    });
  });
};
