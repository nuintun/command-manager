/**
 * Created by nuintun on 2015/11/24.
 */

'use strict';

var states = require('./lib/states');

module.exports = Terminal;

function iterator(from, iterator, context){
  for (var key in from) {
    if (from.hasOwnProperty(key)) {
      iterator.call(context, key, from[key]);
    }
  }
}

function Terminal(options){
  options = options || {};

  if (!(this instanceof Terminal)) return new Terminal(options);

  iterator(Terminal.defaults, function (key, value){
    console.log(key);

    if (options.hasOwnProperty(options)) {
      this[key] = options[key];
    } else {
      this[key] = value;
    }
  }, this);

  if (Array.isArray(options.colors)) {
    if (options.colors.length === 8) {
      this.colors = options.colors.concat(Terminal.colors.slice(8));
    } else if (options.colors.length === 16) {
      this.colors = options.colors.concat(Terminal.colors.slice(16));
    } else if (options.colors.length === 10) {
      this.colors = options.colors.slice(0, -2).concat(Terminal.colors.slice(8, -2), options.colors.slice(-2));
    } else if (options.colors.length === 18) {
      this.colors = options.colors.slice(0, -2).concat(Terminal.colors.slice(16, -2), options.colors.slice(-2));
    } else {
      this.colors = Terminal.colors;
    }
  } else {
    this.colors = Terminal.colors;
  }

  this.cols = options.cols || Terminal.geometry[0];
  this.rows = options.rows || Terminal.geometry[1];

  this.ybase = 0;
  this.ydisp = 0;
  this.x = 0;
  this.y = 0;
  this.cursorState = 0;
  this.cursorHidden = false;
  this.convertEol = true;
  this.state = states.normal;
  this.queue = '';
  this.scrollTop = 0;
  this.scrollBottom = this.rows - 1;

  // modes
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
  this.element = null;
  this.children = null;
  this.refreshStart = null;
  this.refreshEnd = null;
  this.savedX = null;
  this.savedY = null;
  this.savedCols = null;

  // stream
  this.readable = true;
  this.writable = true;

  this.defAttr = (257 << 9) | 256;
  this.curAttr = this.defAttr;

  this.params = [];
  this.currentParam = 0;
  this.prefix = '';
  this.postfix = '';

  this.lines = [];

  var i = this.rows;

  while (i--) {
    this.lines.push(this.blankLine());
  }

  this.tabs = null;

  this.setupStops();
}

require('./lib/colors')(Terminal);
require('./lib/options')(Terminal);

require('./lib/open')(Terminal);
require('./lib/destroy')(Terminal);
require('./lib/refresh')(Terminal);

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

require('./lib/esc/index.js')(Terminal);
require('./lib/esc/reset.js')(Terminal);
require('./lib/esc/tabSet.js')(Terminal);

require('./lib/csi/charAttributes')(Terminal);
require('./lib/csi/insert-delete')(Terminal);
require('./lib/csi/position')(Terminal);
require('./lib/csi/cursor')(Terminal);
require('./lib/csi/repeatPrecedingCharacter')(Terminal);
require('./lib/csi/tabClear')(Terminal);
require('./lib/csi/softReset')(Terminal);
require('./lib/csi/scroll')(Terminal);

require('./lib/charsets.js')(Terminal);
