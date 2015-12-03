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
 * @param parent
 */
function scroll(xterm, parent){
  var height = (xterm.y + 2) * 18;
  var scrollTop = parent.scrollTop;
  var viewHeight = parent.clientHeight;

  if (scrollTop > height || height > scrollTop + viewHeight) {
    parent.scrollTop = Math.max(0, height - viewHeight);
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
        } else if (event.data.screen) {
          vm.$els.terminal.innerHTML = event.data.screen;
        }

      }
    });

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
    runtime.worker.terminate();

    delete AppRuntime[name];
  }
}

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
        data: '\u001b[32m执行命令\u001b[0m: \u001b[35m' + name + '\u001b[0m\r\n'
      });

      ipc.send('emulator', {
        name: project.name,
        path: project.path,
        env: util.normalize(project.env),
        command: {
          name: name,
          value: command
        }
      }, 'start');
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
          data = data.toString();
          break;
        case 'error':
          data = '\u001b[31m发生错误: \u001b[0m' + data.toString();
          break;
        case 'close':
          data = '\u001b[32m命令执行完成\u001b[0m';
          break;
      }

      runtime.worker.port.postMessage({ action: 'write', name: project.name, data: data.toString() });
      // event.sender.send('emulator', project, 'stop');
    });
  },
  ready: function (){
    openXTerm(this);
  }
});