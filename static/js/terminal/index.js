/**
 * Created by nuintun on 2015/11/24.
 */

'use strict';

var states = require('./lib/states');

module.exports = Terminal;

/**
 * iterator
 * @param from
 * @param iterator
 * @param context
 */
function iterator(from, iterator, context){
  for (var key in from) {
    if (from.hasOwnProperty(key)) {
      iterator.call(context, key, from[key]);
    }
  }
}

/**
 * Terminal
 * @param options
 * @returns {Terminal}
 * @constructor
 */
function Terminal(options){
  options = options || {};

  if (!(this instanceof Terminal)) return new Terminal(options);

  // inherits
  iterator(Terminal.defaults, function (key, value){
    if (options.hasOwnProperty(key)) {
      this[key] = options[key];
    } else {
      this[key] = value;
      options[key] = value;
    }
  }, this);

  // set colors
  if (Array.isArray(options.colors)) {
    if (options.colors.length === 8) {
      options.colors = options.colors.concat(Terminal.colors.slice(8));
      this.vcolors = Terminal.makeVcolors(options.colors);
    } else if (options.colors.length === 16) {
      options.colors = options.colors.concat(Terminal.colors.slice(16));
      this.vcolors = Terminal.makeVcolors(options.colors);
    } else if (options.colors.length === 10) {
      options.colors = options.colors.slice(0, -2).concat(Terminal.colors.slice(8, -2), options.colors.slice(-2));
      this.vcolors = Terminal.makeVcolors(options.colors);
    } else if (options.colors.length === 18) {
      options.colors = options.colors.slice(0, -2).concat(Terminal.colors.slice(16, -2), options.colors.slice(-2));
      this.vcolors = Terminal.makeVcolors(options.colors);
    } else {
      options.colors = Terminal.colors.slice();
      this.vcolors = Terminal.vcolors.slice();
    }
  } else {
    options.colors = Terminal.colors.slice();
    this.vcolors = Terminal.vcolors.slice();
  }

  this.colors = options.colors;
  this.background = options.background || Terminal.defaultColors.background;
  this.foreground = options.foreground || Terminal.defaultColors.foreground;

  // set screen size
  options.cols = options.cols || Terminal.geometry[0];
  options.rows = options.rows || Terminal.geometry[1];
  this.cols = options.cols;
  this.rows = options.rows;

  // set on data callback
  options.ondata = typeof options.ondata === 'function' ? options.ondata : function (){};
  this.ondata = options.ondata;

  // set on title callback
  options.ontitle = typeof options.ontitle === 'function' ? options.ontitle : function (){};
  this.ontitle = options.ontitle;

  // set convert end of line
  options.convertEOL = options.convertEOL === true;
  this.convertEOL = options.convertEOL;

  // set options
  this.options = options;

  // set property
  this.x = 0;
  this.y = 0;
  this.ybase = 0;
  this.ydisp = 0;
  this.cursorState = 0;
  this.state = states.normal;
  this.queue = '';
  this.scrollTop = 0;
  this.scrollBottom = this.rows - 1;

  // Modes
  this.applicationKeypad = false;
  this.originMode = false;
  this.insertMode = false;
  this.wraparoundMode = false;
  this.normal = null;

  // charset
  this.charset = null;
  this.gcharset = null;
  this.glevel = 0;
  this.charsets = [null];

  // misc
  this.screen = null;
  this.children = [];
  this.refreshStart = null;
  this.refreshEnd = null;
  this.savedX = null;
  this.savedY = null;
  this.savedCols = null;

  // stream
  this.readable = true;
  this.writable = true;

  // set attr
  this.defAttr = (257 << 9) | 256;
  this.curAttr = this.defAttr;

  // set params
  this.params = [];
  this.currentParam = 0;
  this.prefix = '';
  this.postfix = '';

  // set lines
  this.lines = [];

  // set tabs
  this.tabs = null;

  var i = this.rows;

  while (i--) {
    this.lines.push(this.blankLine());
  }

  this.setupStops();
}

require('./lib/colors')(Terminal);
require('./lib/options')(Terminal);

require('./lib/open')(Terminal);
require('./lib/refresh')(Terminal);
require('./lib/close')(Terminal);

require('./lib/write')(Terminal);

require('./lib/setgLevel');
require('./lib/setgCharset');

require('./lib/debug')(Terminal);

require('./lib/stops')(Terminal);

require('./lib/erase')(Terminal);
require('./lib/blankLine')(Terminal);
require('./lib/range')(Terminal);
require('./lib/util')(Terminal);

require('./lib/cursor')(Terminal);
require('./lib/focused')(Terminal);

require('./lib/scrollDisp')(Terminal);

require('./lib/resize')(Terminal);
require('./lib/esc/index.js')(Terminal);
require('./lib/esc/reset.js')(Terminal);
require('./lib/esc/tabSet.js')(Terminal);

require('./lib/charsets.js')(Terminal);
require('./lib/csi/charAttributes')(Terminal);
require('./lib/csi/erase')(Terminal);
require('./lib/csi/insert-delete')(Terminal);
require('./lib/csi/position')(Terminal);
require('./lib/csi/cursor')(Terminal);
require('./lib/csi/repeatPrecedingCharacter')(Terminal);
require('./lib/csi/tabClear')(Terminal);
require('./lib/csi/softReset')(Terminal);
require('./lib/csi/scroll')(Terminal);
require('./lib/csi/device')(Terminal);
