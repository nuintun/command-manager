/**
 * Created by nuintun on 2015/11/18.
 */

'use strict';

var fs = require('fs');
var path = require('path');
var join = path.join;
// module to control application life
var electron = require('electron');
var app = electron.app;
var ipc = electron.ipcMain;
var dialog = electron.dialog;
var shell = electron.shell;

const USERDATA = app.getPath('userData');
const USERDESKTOP = app.getPath('userDesktop');
const CONFIGURENAME = 'command-manager.config';
const CONFIGUREPATH = join(USERDATA, CONFIGURENAME);
const TEMPCONFIGUREPATH = join(USERDESKTOP, CONFIGURENAME);
const DEFAULTCONFIGURE = { projects: [] };
const ERRORMESSAGE = {
  NONEXISTS: '不存在',
  READERROR: '读取失败',
  WRITEERROR: '写入失败',
  PARSEERROR: '解析失败',
  VALIDERROR: '校验失败'
};

/**
 * ConfigureError
 * @param code
 * @param message
 * @constructor
 */
function ConfigureError(code, message){
  this.code = code;
  this.message = message;
  this.name = 'ConfigureError';
}

// ConfigureError prototype
ConfigureError.prototype = Object.create(Error.prototype);
ConfigureError.prototype.constructor = ConfigureError;

/**
 * verify configure
 * @param configure
 * @returns {*}
 */
function verifyConfigure(configure){
  if (!configure) {
    return false;
  }

  if (!Array.isArray(configure.projects)) {
    return false;
  }

  return configure.projects.every(function (project){
    if (!project.name || typeof project.name !== 'string') {
      return false;
    }

    if (!project.path || typeof project.path !== 'string') {
      return false;
    }

    if (Array.isArray(project.env)) {
      var envValid = project.env.every(function (env){
        return env.name && typeof env.name === 'string'
          && env.value && typeof env.value === 'string';
      });

      if (!envValid) {
        return false;
      }
    } else {
      return false
    }

    if (Array.isArray(project.command)) {
      var commandValid = project.command.every(function (command){
        return command.name && typeof command.name === 'string'
          && command.value && typeof command.value === 'string';
      });

      if (!commandValid) {
        return false;
      }
    } else {
      return false;
    }

    return true;
  });
}

/**
 * unique array by a track
 * @param array
 * @param progress
 * @param track
 * @returns {Array}
 */
function unique(array, progress, track){
  var cache = {};

  progress = typeof progress === 'function' ? progress : function (){};
  track = track && typeof track === 'string' ? track : 'name';

  return array.filter(function (item){
    var key = item[track];

    if (cache[key]) {
      return false;
    } else {
      cache[key] = true;

      progress.apply(this, arguments);

      return true;
    }
  });
}

/**
 * filter configure
 * @param configure
 * @returns {*}
 */
function filterConfigure(configure){
  configure.projects = unique(configure.projects, function (project){
    if (project.env) {
      project.env = unique(project.env);
    }

    if (project.command) {
      project.command = unique(project.command);
    }
  });

  return configure;
}

/**
 * AppConfigure
 * @param window
 * @param tray
 * @constructor
 */
function AppConfigure(window, tray){
  this.window = window;
  this.tray = tray;
  this.title = window.getTitle();

  this.init();
}

/**
 * AppConfigure prototype
 */
AppConfigure.prototype = {
  init: function (){
    var context = this;

    ipc.on('app-configure', function (event, command, configure){
      switch (command) {
        case 'ready':
          context.create(function (){
            event.sender.send('app-configure', 'ready');
          });
          break;
        case 'import':
          context.import(function (configure){
            this.showMessageBox('配置文件导入成功！', { type: 'info' });
            event.sender.send('app-configure', 'refresh', configure);
          }, function (error){
            this.showMessageBox('配置文件' + error.message + '！');
          });
          break;
        case 'export':
          context.export(function (path){
            this.showMessageBox('配置文件导出成功！', { type: 'info' }, function (){
              shell.showItemInFolder(path);
            });
          }, function (){
            this.showMessageBox('配置文件导出失败！');
          });
          break;
        case 'read':
          context.read(function (configure){
            event.sender.send('app-configure', 'refresh', configure);
          }, function (error){
            context.showMessageBox('配置文件' + error.message + '！', function (){
              shell.showItemInFolder(CONFIGUREPATH);
              context.window.close();
            });
          });
          break;
        case 'save':
          context.save(configure, null, function (){
            this.showMessageBox('保存失败！');
          });
          break;
      }

    });
  },
  create: function (done){
    var context = this;

    fs.stat(CONFIGUREPATH, function (error, stats){
      if (error || !stats.isFile()) {
        context.save(DEFAULTCONFIGURE, done, function (){
          context.showMessageBox('配置文件创建失败，请用管理员模式运行重试！', function (){
            context.window.close();
          });
        });
      } else {
        done.call(this);
      }
    });
  },
  save: function (configure, done, fail){
    var context = this;

    done = typeof done === 'function' ? done : function (){};
    fail = typeof fail === 'function' ? fail : function (){};

    fs.writeFile(CONFIGUREPATH, JSON.stringify(configure), function (error){
      if (error) {
        var code = error.code === 'ENOENT' ? 'NONEXISTS' : 'WRITEERROR';

        fail.call(context, new ConfigureError(code, ERRORMESSAGE[code]));
      } else {
        done.call(context, configure);
      }
    });
  },
  read: function (done, fail){
    var context = this;

    done = typeof done === 'function' ? done : function (){};
    fail = typeof fail === 'function' ? fail : function (){};

    fs.readFile(CONFIGUREPATH, function (error, configure){
      if (error) {
        var code = error.code === 'ENOENT' ? 'NONEXISTS' : 'READERROR';

        fail.call(context, new ConfigureError(code, ERRORMESSAGE[code]));
      } else {
        try {
          configure = JSON.parse(configure);
        } catch (error) {
          return fail.call(context, new ConfigureError('PARSEERROR', ERRORMESSAGE.PARSEERROR));
        }
      }

      // invalid configure
      if (!verifyConfigure(configure)) {
        return fail.call(context, new ConfigureError('VALIDERROR', ERRORMESSAGE.VALIDERROR));
      }

      done.call(context, configure);
    });
  },
  import: function (done, fail){
    var context = this;

    done = typeof done === 'function' ? done : function (){};
    fail = typeof fail === 'function' ? fail : function (){};

    // show open dialog
    dialog.showOpenDialog(this.window, {
      title: this.title,
      defaultPath: TEMPCONFIGUREPATH,
      properties: ['openFile'],
      filters: [{ name: '配置文件', extensions: ['config'] }]
    }, function (paths){
      if (paths) {
        fs.readFile(paths[0], function (error, configure){
          if (error) {
            var code = error.code === 'ENOENT' ? 'NONEXISTS' : 'READERROR';

            fail.call(context, new ConfigureError(code, ERRORMESSAGE[code]));
          } else {
            try {
              configure = JSON.parse(configure);
            } catch (error) {
              return fail.call(context, new ConfigureError('PARSEERROR', ERRORMESSAGE.PARSEERROR));
            }

            // invalid configure
            if (!verifyConfigure(configure)) {
              return fail.call(context, new ConfigureError('VALIDERROR', ERRORMESSAGE.VALIDERROR));
            }

            // filter configure
            configure = filterConfigure(configure);

            // save configure
            context.save(configure, done, fail);
          }
        });
      }
    });
  },
  export: function (done, fail){
    var context = this;

    done = typeof done === 'function' ? done : function (){};
    fail = typeof fail === 'function' ? fail : function (){};

    // show save dialog
    dialog.showSaveDialog(this.window, {
      title: this.title,
      defaultPath: TEMPCONFIGUREPATH,
      filters: [{ name: '配置文件', extensions: ['config'] }]
    }, function (path){
      if (path) {
        fs.createReadStream(CONFIGUREPATH)
          .on('error', function (error){
            var code = error.code === 'ENOENT' ? 'NONEXISTS' : 'READERROR';

            fail.call(context, new ConfigureError(code, ERRORMESSAGE[code]));
          })
          .pipe(fs.createWriteStream(path))
          .on('finish', function (){
            done.call(context, path);
          })
          .on('error', function (error){
            var code = error.code === 'ENOENT' ? 'NONEXISTS' : 'WRITEERROR';

            fail.call(context, new ConfigureError(code, ERRORMESSAGE[code]));
          });
      }
    });
  },
  showMessageBox: function (message, options, callback){
    if (typeof options === 'function') {
      callback = options;
      options = { message: message };
    }

    options = options || {};
    options.title = this.title;
    options.message = message;
    options.type = options.type || 'error';
    options.buttons = options.buttons || [];

    dialog.showMessageBox(this.window, options, callback);
  }
};

module.exports = AppConfigure;
