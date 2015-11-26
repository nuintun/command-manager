/**
 * Created by nuintun on 2015/11/20.
 */

'use strict';

var ipc = require('ipc-renderer');

var fs = require('fs');
var path = require('path');
var util = require('../../util');
var Vue = require('../../vue/vue');
var Terminal = require('../../terminal');

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
 */
function scroll(xterm){
  var parent = xterm.element.parentNode;

  if (parent) {
    var height = (xterm.y + 2) * 18;
    var scrollTop = parent.scrollTop;
    var viewHeight = parent.clientHeight;

    if (scrollTop > height || height > scrollTop + viewHeight) {
      parent.scrollTop = Math.max(0, height - viewHeight);
    }
  }
}

/**
 * createXTerm
 * @param name
 * @param xtermNode
 */
function createXTerm(name, xtermNode){
  var runtime = window.AppRuntime[name];

  function refresh(xterm){
    if (xtermNode.firstChild !== xterm.element) {
      if (xtermNode.firstChild) {
        xtermNode.removeChild(xtermNode.firstChild);
      }

      xterm.focus();
      xtermNode.appendChild(xterm.element);
      scroll(xterm);
    }
  }

  if (runtime) {
    refresh(runtime.xterm);
  } else {
    var xterm = new Terminal({
      scrollback: 80,
      convertEol: true,
      fgColor: 'inherit',
      bgColor: 'transparent'
    });

    xterm.open();

    refresh(xterm);

    window.AppRuntime[name] = {
      xterm: xterm
    };
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

      createXTerm(project.name, this.$els.terminal);
    }
  },
  methods: {
    exec: function (name, command){
      ipc.send('emulator', {
        name: this.project.name,
        path: this.project.path,
        env: this.project.env,
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
      var runtime = window.AppRuntime[this.project.name];

      if (runtime) {
        runtime.xterm.close();

        delete window.AppRuntime[this.project.name];
      }

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
      var runtime = window.AppRuntime[project.name];

      if (runtime) {
        switch (type) {
          case 'data':
            data += '';
            break;
          case 'error':
            data = '执行出现错误: ' + data;
            break;
          case 'close':
            data = '\u001b[32m命令执行完毕\u001b[39m\r\n';
            break;
        }

        runtime.xterm.write(data + '');
        scroll(runtime.xterm);
      } else {
        event.sender.send('emulator', project, 'stop');
      }
    });
  },
  ready: function (){
    createXTerm(this.project.name, this.$els.terminal);
  }
});
