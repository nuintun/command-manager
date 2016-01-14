/**
 * Created by nuintun on 2015/11/20.
 */

'use strict';

var ipc = require('ipc-renderer');

var fs = require('fs');
var path = require('path');
var util = require('../../util');
var Vue = require('../../vue/vue');

const EMPTYPROJECT = {
  name: '',
  path: '',
  env: [],
  command: [],
  empty: true
};

require('../project-configure');

/**
 * clone project
 * @param projects
 * @param index
 * @returns {*}
 */
function clone(projects, index){
  return util.clone(projects[index] || EMPTYPROJECT);
}

/**
 * srcoll
 * @param xterm
 * @param y
 */
function scroll(xterm, y){
  var height = (y + 2) * 18;
  var scrollTop = xterm.scrollTop;
  var viewHeight = xterm.clientHeight;

  if (scrollTop > height || height > scrollTop + viewHeight) {
    xterm.scrollTop = Math.max(0, height - viewHeight);
  }
}

// uuid
var uuid = 0;

// buffers automatically when created
var snd = new Audio('bell.wav');

/**
 * openXTerm
 * @param vm
 */
function openXTerm(vm){
  var project = vm.project;
  var runtime = AppRuntime[project.name];

  if (!runtime) {
    var worker = new SharedWorker('static/js/components/app-main/terminal-worker.js', 'SharedWorker-' + (uuid++));

    worker.port.addEventListener('message', function (event){
      if (vm.project.name === event.data.name) {
        if (event.data.exec === 'beep') {
          snd.play();
        } else if (event.data.screen && !document.hidden) {
          vm.$els.terminal.innerHTML = event.data.screen;
        }
      }
    });

    // start thread
    worker.port.start();
    worker.port.postMessage({ action: 'open', name: project.name });

    AppRuntime[project.name] = { worker: worker };
  } else {
    runtime.worker.port.postMessage({ action: 'open', name: project.name });
  }
}

/**
 * closeXTerm
 * @param name
 */
function closeXTerm(name){
  var runtime = AppRuntime[name];

  if (runtime) {
    runtime.worker.port.postMessage({ action: 'close', name: name });
    runtime.worker.port.close();

    delete AppRuntime[name];
  }
}

var status = 0;

module.exports = Vue.component('app-main', {
  template: fs.readFileSync(path.join(__dirname, 'app-main.html')).toString(),
  props: {
    activeIndex: {
      type: Number,
      twoWay: true,
      required: true
    },
    projects: {
      type: Array,
      twoWay: true,
      required: true
    },
    unique: {
      type: Object,
      required: true
    }
  },
  data: function (){
    var project = clone(this.projects, this.activeIndex);

    return {
      showSetting: false,
      expandCommand: false,
      project: project,
      command: project.command.slice(0, 3),
      moreCommand: project.command.slice(3)
    };
  },
  watch: {
    projects: function (){
      this.project = clone(this.projects, this.activeIndex);
    },
    activeIndex: function (){
      this.project = clone(this.projects, this.activeIndex);
    },
    project: function (project){
      this.command = project.command.slice(0, 3);
      this.moreCommand = project.command.slice(3);

      openXTerm(this);
    }
  },
  methods: {
    exec: function (name, command){
      var project = this.project;
      var runtime = AppRuntime[project.name];

      runtime.worker.port.postMessage({
        action: 'write',
        name: project.name,
        data: '\u001b[32m' + (status === 0 ? '执行' : '结束')
        + '命令\u001b[0m: \u001b[35m' + name + '-\[' + command + '\]\u001b[0m\r\n'
      });

      ipc.send('emulator', {
        name: project.name,
        path: project.path,
        env: util.normalize(project.env),
        command: {
          name: name,
          value: command
        }
      }, status === 0 ? 'start' : 'stop');

      status = status === 0 ? 1 : 0;
    },
    setting: function (){
      this.showSetting = true;
    },
    remove: function (){
      closeXTerm(this.project.name);

      // remove project
      this.projects.splice(this.activeIndex, 1);

      // change active
      this.activeIndex = 0;

      // save configure
      this.$dispatch('save-configure');
    }
  },
  events: {
    'setting-toggle': function (state){
      this.showSetting = state;
    },
    edit: function (project){
      if (project.name !== this.project.name) {
        window.AppRuntime[project.name] = window.AppRuntime[this.project.name];

        delete window.AppRuntime[this.project.name];
      }

      this.projects.$set(this.activeIndex, project);
      this.$dispatch('save-configure');
    }
  },
  created: function (){
    var context = this;

    document.addEventListener('click', function (event){
      var target = event.target;
      var trigger = context.$els.expandTrigger;

      context.expandCommand = trigger && trigger.contains(target);
    }, false);

    ipc.on('emulator', function (event, type, project, data){
      var runtime = AppRuntime[project.name];

      switch (type) {
        case 'data':
          break;
        case 'error':
          break;
        case 'close':
          data = '\u001b[32m' + (status === 1 ? '执行' : '结束') + '命令成功\u001b[0m\r\n\r\n';
          status = 0;
          break;
      }

      runtime.worker.port.postMessage({ action: 'write', name: project.name, data: data.toString() });
    });
  },
  ready: function (){
    var context = this;

    openXTerm(this);

    document.addEventListener('visibilitychange', function (){
      if (!document.hidden) {
        openXTerm(context);
      }
    }, false);
  }
});