/**
 * Created by nuintun on 2015/11/18.
 */

'use strict';

// module to control application life
var electron = require('electron');
var ipc = electron.ipcMain;

/**
 * window control
 * @param icon
 * @param window
 * @param tray
 */
module.exports = function (icon, window, tray){
  // bind maximize event
  window.on('maximize', function (event){
    event.sender.send('is-maximized', true);
  });

  // bind unmaximize event
  window.on('unmaximize', function (event){
    event.sender.send('is-maximized', false);
  });

  // bind tray double-click event
  tray.on('double-click', function (){
    window.show();
  });

  // listen window ipc
  ipc.on('window', function (event, command){
    switch (command) {
      case 'tray':
        var title = window.getTitle();

        window.hide();
        tray.displayBalloon({
          icon: icon,
          title: title,
          content: title + '正在后台运行！'
        });
        break;
      case 'close':
        window.close();
        break;
      case 'maximize':
        window.maximize();
        break;
      case 'unmaximize':
        window.unmaximize();
        break;
      case 'is-maximized':
        event.sender.send('is-maximized', window.isMaximized());
        break;
    }
  });
};
