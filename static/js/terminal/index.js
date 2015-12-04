/**
 * Created by nuintun on 2015/11/30.
 */

'use strict';

/**
 * range function for numbers [a, .., b-1]
 *
 * @param {number} a
 * @param {number} b
 * @return {Array}
 */
function r(a, b){
  var c = b - a;
  var arr = new Array(c);

  while (c--) {
    arr[c] = --b;
  }

  return arr;
}

/**
 * Add a transition to the transition table.
 *
 * @param table - table to add transition
 * @param {number} inp - input character code
 * @param {number} state - current state
 * @param {number=} action - action to be taken
 * @param {number=} next - next state
 */
function add(table, inp, state, action, next){
  table[state << 8 | inp] = ((action | 0) << 4) | ((next === undefined) ? state : next);
}

/**
 * Add multiple transitions to the transition table.
 *
 * @param table - table to add transition
 * @param {Array} inps - array of input character codes
 * @param {number} state - current state
 * @param {number=} action - action to be taken
 * @param {number=} next - next state
 */
function add_list(table, inps, state, action, next){
  for (var i = 0; i < inps.length; i++)
    add(table, inps[i], state, action, next);
}

/** global definition of printables and executables */
var PRINTABLES = r(0x20, 0x7f);
var EXECUTABLES = r(0x00, 0x18);
EXECUTABLES.push(0x19);
EXECUTABLES.concat(r(0x1c, 0x20));

/**
 * create the standard transition table - used by all parser instances
 *
 *     table[state << 8 | character code] = action << 4 | next state
 *
 *     - states are numbers from 0 to 13
 *     - control character codes defined from 0 to 159 (C0 and C1)
 *     - actions are numbers from 0 to 14
 *     - any higher character than 159 is handled by the 'error' action
 *
 *     state replacements (14 states):
 *          'GROUND' -> 0
 *          'ESCAPE' -> 1
 *          'ESCAPE_INTERMEDIATE' -> 2
 *          'CSI_ENTRY' -> 3
 *          'CSI_PARAM' -> 4
 *          'CSI_INTERMEDIATE' -> 5
 *          'CSI_IGNORE' -> 6
 *          'SOS_PM_APC_STRING' -> 7
 *          'OSC_STRING' -> 8
 *          'DCS_ENTRY' -> 9
 *          'DCS_PARAM' -> 10
 *          'DCS_IGNORE' -> 11
 *          'DCS_INTERMEDIATE' -> 12
 *          'DCS_PASSTHROUGH' -> 13
 *
 *     action replacements (15 actions):
 *          'no action' -> 0
 *          'error' -> 1
 *          'print' -> 2
 *          'execute' -> 3
 *          'osc_start' -> 4
 *          'osc_put' -> 5
 *          'osc_end' -> 6
 *          'csi_dispatch' -> 7
 *          'param' -> 8
 *          'collect' -> 9
 *          'esc_dispatch' -> 10
 *          'clear' -> 11
 *          'dcs_hook' -> 12
 *          'dcs_put' -> 13
 *          'dcs_unhook' -> 14
 */
var TRANSITION_TABLE = (function (){
  var table = new Uint8Array(4095);

  // table with default transition [any] --> [error, GROUND]
  for (var state = 0; state < 14; ++state) {
    for (var code = 0; code < 160; ++code) {
      table[state << 8 | code] = 16;
    }
  }

  // apply transitions
  // printables
  add_list(table, PRINTABLES, 0, 2);

  // global anywhere rules
  for (state = 0; state < 14; ++state) {
    add_list(table, [0x18, 0x1a, 0x99, 0x9a], state, 3, 0);
    add_list(table, r(0x80, 0x90), state, 3, 0);
    add_list(table, r(0x90, 0x98), state, 3, 0);
    add(table, 0x9c, state, 0, 0);   // ST as terminator
    add(table, 0x1b, state, 11, 1);  // ESC
    add(table, 0x9d, state, 4, 8);   // OSC
    add_list(table, [0x98, 0x9e, 0x9f], state, 0, 7);
    add(table, 0x9b, state, 11, 3);  // CSI
    add(table, 0x90, state, 11, 9);  // DCS
  }

  // rules for executables and 7f
  add_list(table, EXECUTABLES, 0, 3);
  add_list(table, EXECUTABLES, 1, 3);
  add(table, 0x7f, 1);
  add_list(table, EXECUTABLES, 8);
  add_list(table, EXECUTABLES, 3, 3);
  add(table, 0x7f, 3);
  add_list(table, EXECUTABLES, 4, 3);
  add(table, 0x7f, 4);
  add_list(table, EXECUTABLES, 6, 3);
  add_list(table, EXECUTABLES, 5, 3);
  add(table, 0x7f, 5);
  add_list(table, EXECUTABLES, 2, 3);
  add(table, 0x7f, 2);
  // osc
  add(table, 0x5d, 1, 4, 8);
  add_list(table, PRINTABLES, 8, 5);
  add(table, 0x7f, 8, 5);
  add_list(table, [0x9c, 0x1b, 0x18, 0x1a, 0x07], 8, 6, 0);
  add_list(table, r(0x1c, 0x20), 8, 0);
  // sos/pm/apc does nothing
  add_list(table, [0x58, 0x5e, 0x5f], 1, 0, 7);
  add_list(table, PRINTABLES, 7);
  add_list(table, EXECUTABLES, 7);
  add(table, 0x9c, 7, 0, 0);
  // csi entries
  add(table, 0x5b, 1, 11, 3);
  add_list(table, r(0x40, 0x7f), 3, 7, 0);
  add_list(table, r(0x30, 0x3a), 3, 8, 4);
  add(table, 0x3b, 3, 8, 4);
  add_list(table, [0x3c, 0x3d, 0x3e, 0x3f], 3, 9, 4);
  add_list(table, r(0x30, 0x3a), 4, 8);
  add(table, 0x3b, 4, 8);
  add_list(table, r(0x40, 0x7f), 4, 7, 0);
  add_list(table, [0x3a, 0x3c, 0x3d, 0x3e, 0x3f], 4, 0, 6);
  add_list(table, r(0x20, 0x40), 6);
  add(table, 0x7f, 6);
  add_list(table, r(0x40, 0x7f), 6, 0, 0);
  add(table, 0x3a, 3, 0, 6);
  add_list(table, r(0x20, 0x30), 3, 9, 5);
  add_list(table, r(0x20, 0x30), 5, 9);
  add_list(table, r(0x30, 0x40), 5, 0, 6);
  add_list(table, r(0x40, 0x7f), 5, 7, 0);
  add_list(table, r(0x20, 0x30), 4, 9, 5);
  // esc_intermediate
  add_list(table, r(0x20, 0x30), 1, 9, 2);
  add_list(table, r(0x20, 0x30), 2, 9);
  add_list(table, r(0x30, 0x7f), 2, 10, 0);
  add_list(table, r(0x30, 0x50), 1, 10, 0);
  add_list(table, [0x51, 0x52, 0x53, 0x54, 0x55, 0x56, 0x57, 0x59, 0x5a, 0x5c], 1, 10, 0);
  add_list(table, r(0x60, 0x7f), 1, 10, 0);
  // dcs entry
  add(table, 0x50, 1, 11, 9);
  add_list(table, EXECUTABLES, 9);
  add(table, 0x7f, 9);
  add_list(table, r(0x1c, 0x20), 9);
  add_list(table, r(0x20, 0x30), 9, 9, 12);
  add(table, 0x3a, 9, 0, 11);
  add_list(table, r(0x30, 0x3a), 9, 8, 10);
  add(table, 0x3b, 9, 8, 10);
  add_list(table, [0x3c, 0x3d, 0x3e, 0x3f], 9, 9, 10);
  add_list(table, EXECUTABLES, 11);
  add_list(table, r(0x20, 0x80), 11);
  add_list(table, r(0x1c, 0x20), 11);
  add_list(table, EXECUTABLES, 10);
  add(table, 0x7f, 10);
  add_list(table, r(0x1c, 0x20), 10);
  add_list(table, r(0x30, 0x3a), 10, 8);
  add(table, 0x3b, 10, 8);
  add_list(table, [0x3a, 0x3c, 0x3d, 0x3e, 0x3f], 10, 0, 11);
  add_list(table, r(0x20, 0x30), 10, 9, 12);
  add_list(table, EXECUTABLES, 12);
  add(table, 0x7f, 12);
  add_list(table, r(0x1c, 0x20), 12);
  add_list(table, r(0x20, 0x30), 12, 9);
  add_list(table, r(0x30, 0x40), 12, 0, 11);
  add_list(table, r(0x40, 0x7f), 12, 12, 13);
  add_list(table, r(0x40, 0x7f), 10, 12, 13);
  add_list(table, r(0x40, 0x7f), 9, 12, 13);
  add_list(table, EXECUTABLES, 13, 13);
  add_list(table, PRINTABLES, 13, 13);
  add(table, 0x7f, 13);
  add_list(table, [0x1b, 0x9c], 13, 14, 0);

  return table;
})();

/**
 * helper for param conversion
 * @param {string} params - params string with ;
 * @return {Array}
 */
function parse_params(params){
  // params are separated by ';'
  // empty defaults to 0
  var p = params.split(';');

  for (var i = 0; i < p.length; ++i) {
    p[i] = Number(p[i]);
  }

  return p;
}

/**
 *  AnsiParser - Parser for ANSI terminal escape sequences.
 *
 * @param {Object=} terminal
 * @constructor
 */
function AnsiParser(terminal){
  this.initial_state = 0;  // 'GROUND' is default
  this.current_state = this.initial_state;

  // global non pushable buffers for multiple parse invocations
  this.osc = '';
  this.params = '';
  this.collected = '';

  // back reference to terminal
  this.term = terminal || {};
  var instructions = [
    'inst_p', 'inst_o', 'inst_x', 'inst_c',
    'inst_e', 'inst_H', 'inst_P', 'inst_U', 'inst_E'
  ];

  for (var i = 0; i < instructions.length; ++i) {
    if (!(instructions[i] in this.term)) {
      this.term[instructions[i]] = function (){};
    }
  }
}

/**
 * Reset the parser.
 */
AnsiParser.prototype.reset = function (){
  this.current_state = this.initial_state;
  this.osc = '';
  this.params = '';
  this.collected = '';
};

/**
 * Parse string s.
 * @param {string} s
 */
AnsiParser.prototype.parse = function (s){
  var error = false;
  var c, code, transition;
  var current_state = this.current_state;

  // local buffers
  var printed = '';
  var dcs = '';
  var osc = this.osc;
  var collected = this.collected;
  var params = this.params;

  // process input string
  for (var i = 0; i < s.length; ++i) {
    c = s.charAt(i);
    code = c.charCodeAt(0);

    if (code < 0xa0) {
      transition = TRANSITION_TABLE[current_state << 8 | code];
    } else {
      transition = 16;
    }

    switch (transition >> 4) {
      case 0:
        // no action
        break;
      case 1:
        // error
        // NOTE: real error recovery is not implemented
        // handle unicode chars in write buffers w'o state change
        if (code > 0x9f) {
          switch (current_state) {
            case 0:
              // GROUND -> add char to print string
              printed += c;
              break;
            case 8:
              // OSC_STRING -> add char to osc string
              osc += c;
              transition |= 8;
              break;
            case 6:
              // CSI_IGNORE -> ignore char
              transition |= 6;
              break;
            case 11:
              // DCS_IGNORE -> ignore char
              transition |= 11;
              break;
            case 13:
              // DCS_PASSTHROUGH -> add char to dcs
              dcs += c;
              transition |= 13;
              break;
            default:
              error = true;
          }
        } else {
          error = true;
        }

        if (error) {
          if (
            this.term.inst_E({
              pos: i,                 // position in parse string
              character: c,           // wrong character
              state: current_state,   // in state
              print: printed,         // print buffer
              dcs: dcs,               // dcs buffer
              osc: osc,               // osc buffer
              collect: collected,     // collect buffer
              params: params          // params buffer
            })
          ) {
            return;
          }
          error = false;
        }
        break;
      case 2:
        // print
        printed += c;
        break;
      case 3:
        // execute
        if (printed) {
          this.term.inst_p(printed);
        }

        printed = '';

        this.term.inst_x(c);
        break;
      case 7:
        // csi_dispatch
        this.term.inst_c(collected, parse_params(params), c);
        break;
      case 8:
        // param
        params += c;
        break;
      case 9:
        // collect
        collected += c;
        break;
      case 10:
        // esc_dispatch
        this.term.inst_e(collected, c);
        break;
      case 11:
        // clear
        if (printed) {
          this.term.inst_p(printed);
        }

        printed = '';
        osc = '';
        params = '';
        collected = '';
        dcs = '';
        break;
      case 4:
        // osc_start
        if (printed) {
          this.term.inst_p(printed);
        }

        printed = '';
        osc = '';
        break;
      case 5:
        // osc_put
        osc += c;
        break;
      case 6:
        // osc_end
        if (osc && code !== 0x18 && code !== 0x1a) {
          this.term.inst_o(osc);
        }

        if (code === 0x1b) {
          transition |= 1;
        }

        osc = '';
        params = '';
        collected = '';
        dcs = '';
        break;
      // dcs_hook
      case 12:
        this.term.inst_H(collected, parse_params(params), c);
        break;
      // dcs_put
      case 13:
        dcs += c;
        break;
      // dcs_unhook
      case 14:
        if (dcs) {
          this.term.inst_P(dcs);
        }

        this.term.inst_U();

        if (code === 0x1b) {
          transition |= 1;
        }

        osc = '';
        params = '';
        collected = '';
        dcs = '';
        break;
    }

    current_state = transition & 15;
  }

  // push leftover pushable buffers to terminal
  if (!current_state && printed) {
    this.term.inst_p(printed);
  } else if (current_state === 13 && dcs) {
    this.term.inst_P(dcs);
  }

  // save non pushable buffers
  this.osc = osc;
  this.collected = collected;
  this.params = params;

  // save state
  this.current_state = current_state;
};

/**
 *  AnsiTerminal - an offscreen xterm like terminal.
 *
 *  TODO:
 *  - unicode tests
 *  - move box printing chars to frontend
 *  - create output methods for TChar and AnsiTerminal
 *  - bracketed paste mode
 *  - tabs, tab stops, tab width, tab output
 *  - tons of DCS codes
 *  - advanced tests, vttest
 *  - mouse handling goes here (via registering handler callbacks)
 *  - test cases
 */

/**
 * wcswidth
 *
 * taken from:
 * - http://www.cl.cam.ac.uk/~mgk25/ucs/wcwidth.c
 * - wcwidth node module
 */
var _WIDTH_COMBINING = [
  [0x0300, 0x036F], [0x0483, 0x0486], [0x0488, 0x0489],
  [0x0591, 0x05BD], [0x05BF, 0x05BF], [0x05C1, 0x05C2],
  [0x05C4, 0x05C5], [0x05C7, 0x05C7], [0x0600, 0x0603],
  [0x0610, 0x0615], [0x064B, 0x065E], [0x0670, 0x0670],
  [0x06D6, 0x06E4], [0x06E7, 0x06E8], [0x06EA, 0x06ED],
  [0x070F, 0x070F], [0x0711, 0x0711], [0x0730, 0x074A],
  [0x07A6, 0x07B0], [0x07EB, 0x07F3], [0x0901, 0x0902],
  [0x093C, 0x093C], [0x0941, 0x0948], [0x094D, 0x094D],
  [0x0951, 0x0954], [0x0962, 0x0963], [0x0981, 0x0981],
  [0x09BC, 0x09BC], [0x09C1, 0x09C4], [0x09CD, 0x09CD],
  [0x09E2, 0x09E3], [0x0A01, 0x0A02], [0x0A3C, 0x0A3C],
  [0x0A41, 0x0A42], [0x0A47, 0x0A48], [0x0A4B, 0x0A4D],
  [0x0A70, 0x0A71], [0x0A81, 0x0A82], [0x0ABC, 0x0ABC],
  [0x0AC1, 0x0AC5], [0x0AC7, 0x0AC8], [0x0ACD, 0x0ACD],
  [0x0AE2, 0x0AE3], [0x0B01, 0x0B01], [0x0B3C, 0x0B3C],
  [0x0B3F, 0x0B3F], [0x0B41, 0x0B43], [0x0B4D, 0x0B4D],
  [0x0B56, 0x0B56], [0x0B82, 0x0B82], [0x0BC0, 0x0BC0],
  [0x0BCD, 0x0BCD], [0x0C3E, 0x0C40], [0x0C46, 0x0C48],
  [0x0C4A, 0x0C4D], [0x0C55, 0x0C56], [0x0CBC, 0x0CBC],
  [0x0CBF, 0x0CBF], [0x0CC6, 0x0CC6], [0x0CCC, 0x0CCD],
  [0x0CE2, 0x0CE3], [0x0D41, 0x0D43], [0x0D4D, 0x0D4D],
  [0x0DCA, 0x0DCA], [0x0DD2, 0x0DD4], [0x0DD6, 0x0DD6],
  [0x0E31, 0x0E31], [0x0E34, 0x0E3A], [0x0E47, 0x0E4E],
  [0x0EB1, 0x0EB1], [0x0EB4, 0x0EB9], [0x0EBB, 0x0EBC],
  [0x0EC8, 0x0ECD], [0x0F18, 0x0F19], [0x0F35, 0x0F35],
  [0x0F37, 0x0F37], [0x0F39, 0x0F39], [0x0F71, 0x0F7E],
  [0x0F80, 0x0F84], [0x0F86, 0x0F87], [0x0F90, 0x0F97],
  [0x0F99, 0x0FBC], [0x0FC6, 0x0FC6], [0x102D, 0x1030],
  [0x1032, 0x1032], [0x1036, 0x1037], [0x1039, 0x1039],
  [0x1058, 0x1059], [0x1160, 0x11FF], [0x135F, 0x135F],
  [0x1712, 0x1714], [0x1732, 0x1734], [0x1752, 0x1753],
  [0x1772, 0x1773], [0x17B4, 0x17B5], [0x17B7, 0x17BD],
  [0x17C6, 0x17C6], [0x17C9, 0x17D3], [0x17DD, 0x17DD],
  [0x180B, 0x180D], [0x18A9, 0x18A9], [0x1920, 0x1922],
  [0x1927, 0x1928], [0x1932, 0x1932], [0x1939, 0x193B],
  [0x1A17, 0x1A18], [0x1B00, 0x1B03], [0x1B34, 0x1B34],
  [0x1B36, 0x1B3A], [0x1B3C, 0x1B3C], [0x1B42, 0x1B42],
  [0x1B6B, 0x1B73], [0x1DC0, 0x1DCA], [0x1DFE, 0x1DFF],
  [0x200B, 0x200F], [0x202A, 0x202E], [0x2060, 0x2063],
  [0x206A, 0x206F], [0x20D0, 0x20EF], [0x302A, 0x302F],
  [0x3099, 0x309A], [0xA806, 0xA806], [0xA80B, 0xA80B],
  [0xA825, 0xA826], [0xFB1E, 0xFB1E], [0xFE00, 0xFE0F],
  [0xFE20, 0xFE23], [0xFEFF, 0xFEFF], [0xFFF9, 0xFFFB],
  [0x10A01, 0x10A03], [0x10A05, 0x10A06], [0x10A0C, 0x10A0F],
  [0x10A38, 0x10A3A], [0x10A3F, 0x10A3F], [0x1D167, 0x1D169],
  [0x1D173, 0x1D182], [0x1D185, 0x1D18B], [0x1D1AA, 0x1D1AD],
  [0x1D242, 0x1D244], [0xE0001, 0xE0001], [0xE0020, 0xE007F],
  [0xE0100, 0xE01EF]
];

function _width_bisearch(ucs){
  var mid;
  var min = 0;
  var max = _WIDTH_COMBINING.length - 1;

  if (ucs < _WIDTH_COMBINING[0][0] || ucs > _WIDTH_COMBINING[max][1]) {
    return false;
  }

  while (max >= min) {
    mid = Math.floor((min + max) / 2);

    if (ucs > _WIDTH_COMBINING[mid][1]) {
      min = mid + 1;
    } else if (ucs < _WIDTH_COMBINING[mid][0]) {
      max = mid - 1;
    } else {
      return true;
    }
  }

  return false;
}

function _width_wcwidth(ucs, opts){
  // test for 8-bit control characters
  if (ucs === 0) {
    return opts.nul;
  }

  if (ucs < 32 || (ucs >= 0x7f && ucs < 0xa0)) {
    return opts.control;
  }

  // binary search in table of non-spacing characters
  if (_width_bisearch(ucs)) {
    return 0;
  }

  // if we arrive here, ucs is not a combining or C0/C1 control character
  return 1 +
    (ucs >= 0x1100 &&
    (ucs <= 0x115f || // Hangul Jamo init. consonants
    ucs == 0x2329 || ucs == 0x232a ||
    (ucs >= 0x2e80 && ucs <= 0xa4cf &&
    ucs != 0x303f) ||  // CJK ... Yi
    (ucs >= 0xac00 && ucs <= 0xd7a3) || // Hangul Syllables
    (ucs >= 0xf900 && ucs <= 0xfaff) || // CJK Compatibility Ideographs
    (ucs >= 0xfe10 && ucs <= 0xfe19) || // Vertical forms
    (ucs >= 0xfe30 && ucs <= 0xfe6f) || // CJK Compatibility Forms
    (ucs >= 0xff00 && ucs <= 0xff60) || // Fullwidth Forms
    (ucs >= 0xffe0 && ucs <= 0xffe6) ||
    (ucs >= 0x20000 && ucs <= 0x2fffd) ||
    (ucs >= 0x30000 && ucs <= 0x3fffd)));
}

var _WIDTH_DEFAULTS = { nul: 0, control: 0 };

// wcswidth(string[, opts]) - number of taken terminal cells by a string (printed space)
function wcswidth(str, opts){
  // FIXME
  opts = _WIDTH_DEFAULTS;

  if (typeof str !== 'string') {
    return _width_wcwidth(str, opts);
  }

  var s = 0;

  for (var i = 0; i < str.length; i++) {
    var n = _width_wcwidth(str.charCodeAt(i), opts);

    if (n < 0) {
      return -1;
    }

    s += n;
  }

  return s;
}

/**
 * TChar - terminal character with attributes.
 *
 * Bits of text attr:
 *      1-8     BG / BG red
 *      9-16    FG / FG red
 *      17      bold
 *      18      italic
 *      19      underline
 *      20      blink
 *      21      inverse
 *      22      conceal
 *      23      cursor
 *      24      <unused>
 *      25      BG set
 *      26      BG RGB mode
 *      27      FG set
 *      28      FG RGB mode
 *      29-32   <unused>
 *
 * Bits of gb:
 *      1-8         BG blue
 *      9-16        FG blue
 *      17-24       BG green
 *      25-32       FG green
 *
 * @param {string} value - An unicode character (multiple if surrogate or combining).
 * @param {number} [attr] - Cell attributes as integer.
 * @param {number} [gb] - Green and blue part of RGB as integer.
 * @param {number} [width] - Terminal cells taken by this character.
 * @constructor
 */
function TChar(value, attr, gb, width){
  this.value = value;
  this.attr = attr | 0;
  this.gb = gb | 0;
  this.width = (width === undefined) ? 1 : width;
}

TChar.prototype.clone = function (){
  return new TChar(this.value, this.attr, this.gb, this.width);
};

/**
 * getAttributes
 * @return {object} Object with attributes in a readable manner.
 */
TChar.prototype.getAttributes = function (){
  var colorbits = this.attr >>> 24;
  var r = this.attr & 65535;
  var g = this.gb >>> 16;
  var b = this.gb & 65535;
  var bits = this.attr >>> 16 & 255;

  return {
    bold: !!(bits & 1),
    italic: !!(bits & 2),
    underline: !!(bits & 4),
    blink: !!(bits & 8),
    inverse: !!(bits & 16),
    conceal: !!(bits & 32),
    // TODO cursor
    // cursor: !!(bits & 64),
    foreground: {
      set: !!(colorbits & 4),
      RGB: !!(colorbits & 8),
      color: [r >>> 8, g >>> 8, b >>> 8]
    },
    background: {
      set: !!(colorbits & 1),
      RGB: !!(colorbits & 2),
      color: [r & 255, g & 255, b & 255]
    }
  }
};

/**
 * setAttributes
 * @param attributes
 */
TChar.prototype.setAttributes = function (attributes){
  var attr = this.attr;

  ['bold', 'italic', 'underline', 'blink', 'inverse', 'conceal'].map(function (key, i){
    attr = attributes[key] ? attr | (2 << (15 + i)) : attr & ~(2 << (15 + i));
  });

  if (attributes['foreground']) {
    var foreground = attributes['foreground'];

    attr = foreground['set'] ? attr | (2 << 25) : attr & ~(2 << 25);
    attr = foreground['RGB'] ? attr | (2 << 26) : attr & ~(2 << 26);

    if (Array.isArray(foreground['color'])) {
      attr = (attr & ~65280) | (foreground['color'][0] << 8);
      this.gb = (this.gb & ~4278190080) | (foreground['color'][1] << 24);
      this.gb = (this.gb & ~65280) | (foreground['color'][2] << 8);
    }
  }

  if (attributes['background']) {
    var background = attributes['background'];

    attr = background['set'] ? attr | (2 << 23) : attr & ~(2 << 23);
    attr = background['RGB'] ? attr | (2 << 24) : attr & ~(2 << 24);

    if (Array.isArray(background['color'])) {
      attr = (attr & ~255) | (background['color'][0]);
      this.gb = (this.gb & ~16711680) | (background['color'][1] << 16);
      this.gb = (this.gb & ~255) | background['color'][2];
    }
  }

  this.attr = attr;
};

TChar.prototype.toString = function (){
  return this.value;
};

var _uniqueId = 0;

/**
 * Row
 * @constructor
 */
function Row(){
  this.uniqueId = _uniqueId++ | 0;
  this.version = 0;
  this.cells = [];
}

/**
 * ScreenBuffer - represents a terminal screen with cols and rows.
 *
 * .buffer is an array of length rows and contains the row objects.
 *
 * @param cols
 * @param rows
 * @param scrollLength
 * @constructor
 */
function ScreenBuffer(cols, rows, scrollLength){
  this.rows = rows;
  this.cols = cols;
  this.scrollLength = scrollLength | 0;

  this.buffer = [];
  this.scrollbuffer = [];

  this.reset();
}

ScreenBuffer.prototype.reset = function (){
  this.buffer = [];
  this.scrollbuffer = [];

  var row;

  for (var i = 0; i < this.rows; ++i) {
    row = new Row();

    for (var j = 0; j < this.cols; ++j) {
      row.cells.push(new TChar(''));
    }

    this.buffer.push(row);
  }
};

ScreenBuffer.prototype.appendToScrollBuffer = function (row){
  this.scrollbuffer.push(row);

  while (this.scrollbuffer.length > this.scrollLength) {
    this.scrollbuffer.shift();
  }
};

ScreenBuffer.prototype.fetchFromScrollBuffer = function (){
  return this.scrollbuffer.pop();
};

ScreenBuffer.prototype.resize = function (cols, rows, cursor){
  // xterm behavior - shrink:
  //      delete higher rows til cursor then lowest to scrollbuffer
  // xterm behavior - enlarge:
  //      fill lowest from scrollbuffer then append new at end

  // assume xterm handles alternate buffer the same way
  // in respect of the cursor position but w/o scrolling

  // shrink height
  if (rows < this.rows) {
    while (this.buffer.length > rows) {
      if (this.buffer.length > cursor.row + 1) {
        this.buffer.pop();
      } else {
        this.appendToScrollBuffer(this.buffer.shift());
        cursor.row -= 1;
      }
    }
  }

  // enlarge height
  if (rows > this.rows) {
    while (this.buffer.length < rows) {
      var row = this.fetchFromScrollBuffer();

      if (row) {
        this.buffer.unshift(row);
        cursor.row += 1;
      } else {
        row = new Row();

        for (var j = 0; j < this.cols; ++j) {
          row.cells.push(new TChar(''));
        }

        this.buffer.push(row);
      }
    }
  }

  if (cursor.row >= rows) {
    cursor.row = rows - 1;
  }

  var i;

  // shrink width
  if (cols < this.cols) {
    for (i = 0; i < this.buffer.length; ++i) {
      var remove = this.cols - cols;

      do {
        this.buffer[i].cells.pop();
      } while (--remove);

      this.buffer[i].version++;
    }

    for (i = 0; i < this.scrollbuffer.length; ++i) {
      remove = this.cols - cols;

      do {
        this.scrollbuffer[i].cells.pop();
      } while (--remove);

      this.scrollbuffer[i].version++;
    }
  }

  // enlarge width
  if (cols > this.cols) {
    for (i = 0; i < this.buffer.length; ++i) {
      var append = cols - this.cols;

      do {
        this.buffer[i].cells.push(new TChar(''));
      } while (--append);

      this.buffer[i].version++;
    }

    for (i = 0; i < this.scrollbuffer.length; ++i) {
      append = cols - this.cols;

      do {
        this.scrollbuffer[i].cells.push(new TChar(''));
      } while (--append);

      this.scrollbuffer[i].version++;
    }
  }

  if (cursor.col >= cols)
    cursor.col = cols - 1;

  this.rows = rows;
  this.cols = cols;
};

/** minimal support for switching charsets (only basic drawing symbols supported) */
var CHARSET_0 = {
  '`': '◆', 'a': '▒', 'b': '␉', 'c': '␌', 'd': '␍',
  'e': '␊', 'f': '°', 'g': '±', 'h': '␤', 'i': '␋',
  'j': '┘', 'k': '┐', 'l': '┌', 'm': '└', 'n': '┼',
  'o': '⎺', 'p': '⎻', 'q': '─', 'r': '⎼', 's': '⎽',
  't': '├', 'u': '┤', 'v': '┴', 'w': '┬', 'x': '│',
  'y': '≤', 'z': '≥', '{': 'π', '|': '≠', '}': '£', '~': '°'
};

/** fix: box drawing bold */
// FIXME: should this go into frontend?
// since most monospace fonts can't handle bold on these right we have to
// switch to to corrensponding unicode character
var BOXSYMBOLS_BOLD = {
  '─': '━', '│': '┃', '┄': '┅', '┆': '┇', '┈': '┉', '┊': '┋',
  '┌': '┏', '┐': '┓', '└': '┗', '┘': '┛', '├': '┣', '┤': '┫',
  '┬': '┳', '┴': '┻', '┼': '╋', '╌': '╍', '╎': '╏'
};

var TERM_STRING = {
  CSI: '\u001b[', SS3: '\u001bO', DCS: '\u001bP', ST: '\u001b\\',
  OSC: '\u001b]', PM: '\u001b^', APC: '\u001b_'
};

/**
 * AnsiTerminal - an offscreen terminal.
 *
 * @param {number} cols - columns of the terminal.
 * @param {number} rows - rows of the terminal.
 * @param {number} scrollLength - lines of scrollbuffer.
 * @constructor
 */
function AnsiTerminal(cols, rows, scrollLength){
  if (!(this instanceof AnsiTerminal)) {
    return new AnsiTerminal(cols, rows, scrollLength);
  }

  this.rows = rows;
  this.cols = cols;
  this.scrollLength = scrollLength | 0;
  // callback for writing back to stream
  this.send = function (data){};
  // callback for sending console beep
  this.beep = function (tone, duration){};
  // announce changes in mouse handling
  this.changedMouseHandling = function (mode, protocol){};

  // init ansi parser
  this.AnsiParser = new AnsiParser(this);

  this.reset();
}

/**
 * write
 * @param data
 */
AnsiTerminal.prototype.write = function (data){
  this.AnsiParser.parse(data);

  // TODO cursor?
  //// place cursor temporarily in buffer - needed to simplify fragment creation
  //var node = this.screen.buffer[this.cursor.row].cells[this.cursor.col];
  //
  //if (this.show_cursor && node) {
  //  node.attr |= 4194304;
  //}
  //
  //this.screen.buffer[this.cursor.row].version++;
  //
  //// remove cursor from buffer
  //node = this.screen.buffer[this.cursor.row].cells[this.cursor.col];
  //
  //if (this.show_cursor && node) {
  //  node.attr &= ~4194304;
  //}
  //
  //this.screen.buffer[this.cursor.row].version++;
};

/** Hard reset of the terminal. */
AnsiTerminal.prototype.reset = function (){
  this.normal_screen = new ScreenBuffer(this.cols, this.rows, this.scrollLength);
  this.alternate_screen = new ScreenBuffer(this.cols, this.rows, 0);
  this.screen = this.normal_screen;
  this.normal_cursor = { col: 0, row: 0 };
  this.alternate_cursor = { col: 0, row: 0 };
  this.cursor = this.normal_cursor;
  this.charset = null;
  this.textattributes = 0;
  this.colors = 0;
  this.charattributes = 0;
  this.reverse_video = false;

  this.cursor_key_mode = false;
  this.show_cursor = true;
  // terminal title set by OSR
  this.title = '';
  this.cursor_save = null;
  // IRM (default replace)
  this.insert_mode = false;
  // CSI?12l
  this.blinking_cursor = false;
  // for DECSTBM
  this.scrolling_top = 0;
  // for DECSTBM
  this.scrolling_bottom = this.rows;
  // DECAWM
  this.autowrap = true;
  // LNM
  this.newline_mode = false;
  this.tab_width = 8;
  // for REP
  this.last_char = '';
  // tracking modes for mouse 0=off, (9, 1000, 1001, 1002, 1003)
  this.mouse_mode = 0;
  // 0 (normal), 1005 (utf-8), 1006 (sgr), 1015 (decimal)
  this.mouse_protocol = 0;

  // mouse events
  this.mouseDown = { 1: false, 2: false, 3: false, 4: false };
  // unicode and fullwidth support
  // remainder of 0 width char (combining characters)
  this._rem_g = '';
  // remainder of surrogates
  this._rem_c = '';

  // new wrapping behavior
  this.wrap = false;
  this.row_wrap = false;
};

/**
 * styles
 * @returns {*|Array}
 */
AnsiTerminal.prototype.styles = function (){
  var i, j, node, styleBuffer;
  var rows = this.rows;
  var cols = this.cols;
  var stylesBuffer = {
    buffer: [],
    rows: rows,
    cols: cols
  };

  for (i = 0; i < rows; ++i) {
    stylesBuffer.buffer[i] = {
      id: this.screen.buffer[i].uniqueId,
      version: this.screen.buffer[i].version,
      cells: []
    };

    for (j = 0; j < cols; ++j) {
      styleBuffer = [];
      node = this.screen.buffer[i].cells[j];
      styleBuffer = styles(node);
      styleBuffer.attr = node.attr;
      styleBuffer.value = node.value;
      stylesBuffer.buffer[i].cells[j] = styleBuffer;
    }
  }

  return stylesBuffer;
};

/**
 * toSting
 * @param [type]
 * @returns {string} representation of active buffer.
 */
AnsiTerminal.prototype.toString = function (type){
  var s = '';
  var i, j, node;
  var rows = this.rows;
  var cols = this.cols;

  if (type === 'html') {
    var text = '';
    var line = '';
    var style = '';
    var attrCache;
    var styleBuffer;
    var stylesBuffer = this.styles();

    for (i = 0; i < rows; ++i) {
      line = '<div>';

      for (j = 0; j < cols; ++j) {
        node = this.screen.buffer[i].cells[j];
        styleBuffer = stylesBuffer.buffer[i].cells[j];

        if (j === 0) {
          style = htmlStyle(styleBuffer);
          line += '<span' + (style ? ' style="' + style + '"' : '') + '>';
          attrCache = node.attr;
        }

        if (node.value) {
          if (node.attr !== attrCache) {
            style = htmlStyle(styleBuffer);
            line += '</span><span' + (style ? ' style="' + style + '"' : '') + '>';
            attrCache = node.attr;
          }

          line += node.value.replace(/\s/g, '&nbsp;');
        }

        text += node.value;
      }

      line += '</span></div>';

      if (text) {
        s += line;
      } else {
        s += '<div>&nbsp;</div>';
      }
    }
  } else {
    for (i = 0; i < rows; ++i) {
      // FIXME: quick and dirty fill up from left
      var last_nonspace = 0;

      for (j = 0; j < cols; ++j) {
        node = this.screen.buffer[i].cells[j];

        if (node.value) {
          last_nonspace = j;
        }
      }

      for (j = 0; j < cols; ++j) {
        node = this.screen.buffer[i].cells[j];

        s += (last_nonspace > j)
          ? node.value || ' '
          : node.value;
      }

      s += '\n';
    }
  }

  return s;
};

/**
 * Resize terminal to cols x rows.
 *
 * @param cols
 * @param rows
 */
AnsiTerminal.prototype.resize = function (cols, rows){
  // skip insane values
  if ((cols < 2) || (rows < 2)) {
    return false;
  }

  // normal scroll buffer
  //this._resize(cols, rows, this.normal_buffer, this.normal_cursor, true);
  this.normal_screen.resize(cols, rows, this.normal_cursor);

  // alternative buffer
  //this._resize(cols, rows, this.alternate_buffer, this.alternate_cursor, false);
  this.alternate_screen.resize(cols, rows, this.alternate_cursor);

  // set new rows / cols to terminal
  this.rows = rows;
  this.cols = cols;
  // FIXME: how to deal with scrolling area? - simply reset for now
  this.scrolling_top = 0;
  this.scrolling_bottom = this.rows;

  // if cursor got saved before we need to overwrite the saved values
  if (this.cursor_save) {
    this.DECSC();
  }
};

/**
 * Propagate mouse action to terminal emulator.
 *
 * @param {string} type - type of action ('mousedown', 'mouseup', 'mousemove' or 'wheel')
 * @param {number} button - button number
 * @param {number} col - column the mouse action took place.
 * @param {number} row - row the mouse action took place.
 */
AnsiTerminal.prototype.mouseAction = function (type, button, col, row){
  if (!this.mouse_mode) {
    return;
  }

  if (this.mouse_mode === 9 && (type !== 'mousedown' || type !== 'wheel')) {
    return;
  }

  if (this.mouse_mode === 1000 && type === 'mousemove') {
    return;
  }

  if (this.mouse_mode === 1002 && type === 'mousemove' && !this.mouseDown[button]) {
    return;
  }

  // if we made it this far we got a legal mouse action and process it further
  // special state switch for mousemove after mousedown in 1002
  if (this.mouse_mode === 1002) {
    if (type == 'mousedown') {
      this.mouseDown[button] = true;
    } else if (type == 'mouseup') {
      this.mouseDown[button] = false;
    }
  }

  switch (this.mouse_protocol) {
    case 0:
      break;
    case 1005:
      break;
    case 1006:
      break;
    case 1015:
      break;
    default:
      console.log('mouse protocol' + this.mouse_protocol + 'not implemented');
  }
};

/**
 * Implementation of the parser instructions
 */

/**
 * inst_p - handle printable character.
 *
 * @param {string} s
 */
AnsiTerminal.prototype.inst_p = function (s){
  if (this.debug) {
    console.log('inst_p', s);
  }

  var c = '';
  var code = 0;
  var low = 0;
  var width = 1;

  // add leftover surrogate high
  if (this._rem_c) {
    s += this._rem_c;
    this._rem_c = '';
  }

  for (var i = 0; i < s.length; ++i) {
    c = s.charAt(i);
    code = s.charCodeAt(i);

    // surrogate high
    if (0xD800 <= code && code <= 0xDBFF) {
      low = s.charCodeAt(i + 1);

      if (low !== low) {
        this._rem_c = c;

        return;
      }

      code = ((code - 0xD800) * 0x400) + (low - 0xDC00) + 0x10000;
      c += s.charAt(i + 1);
    }

    // surrogate low - already handled
    if (0xDC00 <= code && code <= 0xDFFF) {
      continue;
    }

    width = wcswidth(code);

    if (width == 2 && (width + this.cursor.col) > this.cols) {
      if (this.autowrap) {
        this.wrap = true;
      } else {
        continue;
      }
    }

    if (this.wrap && width) {
      this.cursor.col = 0;
      this.cursor.row++;
      this.wrap = false;
    }

    if (this.cursor.row >= this.scrolling_bottom) {
      var row = new Row();

      for (var j = 0; j < this.cols; ++j) {
        row.cells.push(new TChar('', this.textattributes, this.colors));
      }

      this.screen.buffer.splice(this.scrolling_bottom, 0, row);

      var scrolled_out = this.screen.buffer.splice(this.scrolling_top, 1)[0];

      if (!this.scrolling_top) {
        this.screen.appendToScrollBuffer(scrolled_out);
      }

      this.cursor.row--;
    }

    this.screen.buffer[this.cursor.row].version++;

    // combining characters
    if (!width && this.cursor.col) {
      this.screen.buffer[this.cursor.row].cells[this.cursor.col - 1].value += c;
    } else {
      c = (this.charset) ? (this.charset[c] || c) : c;
      this.screen.buffer[this.cursor.row].cells[this.cursor.col].value = c;
      this.screen.buffer[this.cursor.row].cells[this.cursor.col].attr = this.charattributes;
      this.screen.buffer[this.cursor.row].cells[this.cursor.col].gb = this.colors;
      this.screen.buffer[this.cursor.row].cells[this.cursor.col].width = width;

      // fix box drawing -- this is a really ugly problem - FIXME: goes into frontend
      if (c >= '\u2500' && c <= '\u2547') {
        if (this.textattributes && (this.textattributes & 65536)) {
          this.screen.buffer[this.cursor.row].cells[this.cursor.col].value = BOXSYMBOLS_BOLD[c] || c;

          // unset bold here, but set intense instead if applicable
          var attr = this.charattributes & ~65536;

          if (attr & 67108864 && !(attr & 134217728) && (attr >>> 8 & 255) < 8) {
            attr |= 2048;
          }

          this.screen.buffer[this.cursor.row].cells[this.cursor.col].attr = attr;
        }
      }

      this.cursor.col += 1;
    }

    if (width === 2) {
      this.screen.buffer[this.cursor.row].cells[this.cursor.col].width = 0;
      this.screen.buffer[this.cursor.row].cells[this.cursor.col].value = '';
      this.screen.buffer[this.cursor.row].cells[this.cursor.col].attr = this.charattributes;
      this.screen.buffer[this.cursor.row].cells[this.cursor.col].gb = this.colors;
      this.cursor.col += 1;

      if (this.cursor.col >= this.cols) {
        this.cursor.col = this.cols - 2;

        if (this.autowrap) {
          this.wrap = true;
        }
      }
    }

    if (this.cursor.col >= this.cols) {
      this.cursor.col = this.cols - 1;

      if (this.autowrap) {
        this.wrap = true;
      }
    }
  }
};

AnsiTerminal.prototype.inst_o = function (s){
  if (this.debug) {
    console.log('inst_o', s);
  }

  this.last_char = '';
  this.wrap = false;

  if (s.charAt(0) == '0') {
    this.title = s.slice(2);
  } else {
    console.log('inst_o unhandled:', s);
  }
};

AnsiTerminal.prototype.inst_x = function (flag){
  if (this.debug) {
    console.log('inst_x', flag.charCodeAt(0), flag);
  }

  this.last_char = '';
  this.wrap = false;

  switch (flag) {
    case '\n':
      this.cursor.row++;

      if (this.cursor.row >= this.scrolling_bottom) {
        var row = new Row();

        for (var j = 0; j < this.cols; ++j) {
          row.cells.push(new TChar('', this.textattributes, this.colors));
        }

        this.screen.buffer.splice(this.scrolling_bottom, 0, row);

        var scrolled_out = this.screen.buffer.splice(this.scrolling_top, 1)[0];

        if (!this.scrolling_top) {
          this.screen.appendToScrollBuffer(scrolled_out);
        }

        this.cursor.row--;
      }

      if (this.newline_mode) {
        this.cursor.col = 0;
      }

      if (this.cursor.col >= this.cols) {
        this.cursor.col--;
      }
      break;
    case '\r':
      this.cursor.col = 0;
      break;
    case '\t':
      this.CHT([0]);
      break;
    case '\x07':
      this.beep();
      break;
    case '\x08':
      if (this.cursor.col >= this.cols) {
        this.cursor.col = this.cols - 1;
      }

      this.cursor.col -= 1;

      if (this.cursor.col < 0) {
        this.cursor.col = 0;
      }
      break;
    case '\x0b':
      this.inst_x('\n');
      break;
    case '\x0c':
      this.inst_x('\n');
      break;
    // activate G1
    case '\x0e':
      this.charset = CHARSET_0;
      break;
    // activate G0 FIXME
    case '\x0f':
      this.charset = null;
      break;
    // TODO
    case '\x11':
      console.log('unhandled DC1 (XON)');
      break;
    // DC2
    case '\x12':
      break;
    // TODO
    case '\x13':
      console.log('unhandled DC3 (XOFF)');
      break;
    // DC4
    case '\x14':
      break;
    default:
      console.log('inst_x unhandled:', flag.charCodeAt(0));
  }
};

/**
 * missing (from xterm)
 *
 * CSI Ps g    Tab Clear (TBC).
 * (more to come...)
 *
 */
AnsiTerminal.prototype.inst_c = function (collected, params, flag){
  if (this.debug) {
    console.log('inst_c', collected, params, flag);
  }

  // hack for getting REP working
  if (flag != 'b') {
    this.last_char = '';
  }

  this.wrap = false;

  switch (collected) {
    case '':
      switch (flag) {
        case '@':
          return this.ICH(params);
        case 'E':
          return this.CNL(params);
        case 'F':
          return this.CPL(params);
        case 'G':
          return this.CHA(params);
        case 'D':
          return this.CUB(params);
        case 'B':
          return this.CUD(params);
        case 'C':
          return this.CUF(params);
        case 'A':
          return this.CUU(params);
        case 'I':
          return this.CHT(params);
        case 'Z':
          return this.CBT(params);
        case 'f':
        case 'H':
          return this.CUP(params);
        case 'P':
          return this.DCH(params);
        case 'J':
          return this.ED(params);
        case 'K':
          return this.EL(params);
        case 'L':
          return this.IL(params);
        case 'M':
          return this.DL(params);
        case 'S':
          return this.SU(params);
        case 'T':
          return this.SD(params);
        case 'X':
          return this.ECH(params);
        case 'a':
          return this.HPR(params);
        case 'b':
          return this.REP(params);
        case 'e':
          return this.VPR(params);
        case 'd':
          return this.VPA(params);
        // DA1
        case 'c':
          return this.send(TERM_STRING['CSI'] + '?64;1;2;6;9;15;18;21;22c');
        case 'h':
          return this.high(collected, params);
        case 'l':
          return this.low(collected, params);
        case 'm':
          return this.SGR(params);
        case 'n':
          return this.DSR(collected, params);
        case 'r':
          return this.DECSTBM(params);
        case '`':
          return this.HPA(params);
        default :
          console.log('inst_c unhandled:', collected, params, flag);
      }
      break;
    case '?':
      switch (flag) {
        // DECSED as normal ED
        case 'J':
          return this.ED(params);
        // DECSEL as normal EL
        case 'K':
          return this.EL(params);
        case 'h':
          return this.high(collected, params);
        case 'l':
          return this.low(collected, params);
        case 'n':
          return this.DSR(collected, params);
        default :
          console.log('inst_c unhandled:', collected, params, flag);
      }
      break;
    case '>':
      switch (flag) {
        // DA2
        case 'c':
          return this.send(TERM_STRING['CSI'] + '>41;1;0c');
        default :
          console.log('inst_c unhandled:', collected, params, flag);
      }
      break;
    case '!':
      switch (flag) {
        case 'p':
          return this.DECSTR();
        default :
          console.log('inst_c unhandled:', collected, params, flag);
      }
      break;
    default :
      console.log('inst_c unhandled:', collected, params, flag);
  }
};

AnsiTerminal.prototype.inst_e = function (collected, flag){
  if (this.debug) {
    console.log('inst_e', collected, flag);
  }

  this.last_char = '';
  this.wrap = false;

  switch (flag) {
    // complete ESC codes from xterm:
    //    ESC H   Tab Set ( HTS is 0x88).  // TODO
    //    ESC N   Single Shift Select of G2 Character Set ( SS2 is 0x8e). This affects next character only.
    //    ESC O   Single Shift Select of G3 Character Set ( SS3 is 0x8f). This affects next character only.
    //    ESC P   Device Control String ( DCS is 0x90).
    //    ESC V   Start of Guarded Area ( SPA is 0x96).
    //    ESC W   End of Guarded Area ( EPA is 0x97).
    //    ESC X   Start of String ( SOS is 0x98).
    //    ESC Z   Return Terminal ID (DECID is 0x9a). Obsolete form of CSI c (DA).
    //        case 'F':  // (SP) 7-bit controls (S7C1T) - not supported
    //        case 'G':  // (SP) 8-bit controls (S8C1T) - not supported
    //        case 'L':  // (SP) Set ANSI conformance level 1 (dpANS X3.134.1) - not supported
    //        case 'M':  // (SP) Set ANSI conformance level 2 (dpANS X3.134.1) - not supported
    //        case 'N':  // (SP) Set ANSI conformance level 3 (dpANS X3.134.1) - not supported
    //        case '3':  // (#) DEC double-height line, top half (DECDHL) - not supported
    //        case '4':  // (#) DEC double-height line, bottom half (DECDHL) - not supported
    //        case '5':  // (#) DEC single-width line (DECSWL) - not supported
    //        case '6':  // (#) DEC double-width line (DECDWL) - not supported
    //        case '8':  // (#) DEC Screen Alignment Test (DECALN) - not supported
    //        case '@':  // (%) Select default character set. That is ISO 8859-1 (ISO 2022) - not supported
    //        case 'G':  // (%) Select UTF-8 character set (ISO 2022) - not supported
    // (() Designate G0 Character Set (ISO 2022, VT100)
    // more flags: A B < %5 > 4 C 5 R f Q 9 K Y ` E 6 %6 Z H 7 =
    // more collected: ) G1, * G2, + G3, - G1, . G2, / G3
    case '0':
      if (collected == '(' || collected == ')') this.charset = CHARSET_0;
      break;
    // always reset charset
    case 'B':
      this.charset = null;
      break;
    // case '6':  // Back Index (DECBI), VT420 and up - not supported
    // Save Cursor (DECSC)
    case '7':
      return this.DECSC();
    // Restore Cursor (DECRC)
    case '8':
      return this.DECRC();
    // case '9':  // Forward Index (DECFI), VT420 and up - not supported
    // case '=':  // Application Keypad (DECKPAM)  // TODO
    // case '>':  // Normal Keypad (DECKPNM)  // TODO
    // case 'F':  // Cursor to lower left corner of screen  // TODO
    // Full Reset (RIS) http://vt100.net/docs/vt220-rm/chapter4.html
    case 'c':
      return this.reset();
    // case 'l':  // Memory Lock (per HP terminals). Locks memory above the cursor. - not supported
    // case 'm':  // Memory Unlock (per HP terminals). - not supported
    // case 'n':  // Invoke the G2 Character Set as GL (LS2). - not supported
    // case 'o':  // Invoke the G3 Character Set as GL (LS3). - not supported
    // case '|':  // Invoke the G3 Character Set as GR (LS3R). - not supported
    // case '}':  // Invoke the G2 Character Set as GR (LS2R). - not supported
    // case '~':  // Invoke the G1 Character Set as GR (LS1R). - not supported
    case 'E':
      return this.NEL();
    case 'D':
      return this.IND();
    // ESC M   Reverse Index ( RI is 0x8d).
    case 'M':
      return this.RI();
    default :
      console.log('inst_e unhandled:', collected, flag);
  }
};

AnsiTerminal.prototype.inst_H = function (collected, params, flag){
  console.log('inst_H unhandled:', collected, params, flag);

  this.last_char = '';
  this.wrap = false;
};

AnsiTerminal.prototype.inst_P = function (data){
  console.log('inst_P unhandled:', data);

  this.last_char = '';
  this.wrap = false;
};

AnsiTerminal.prototype.inst_U = function (){
  console.log('inst_U unhandled');

  this.last_char = '';
  this.wrap = false;
};

/**
 * functionality implementation
 * *
 * cheatsheets:
 *  - http://www.inwap.com/pdp10/ansicode.txt
 *  - overview http://www.vt100.net/docs/vt510-rm/chapter4
 *  - http://paulbourke.net/dataformats/ascii/
 *  - mouse support: http://manpages.ubuntu.com/manpages/intrepid/man4/console_codes.4.html
 *  - sequences: http://docs2.attachmate.com/verastream/vhi/7.6sp1/en/index.jsp?topic=%2Fcom.attachmate.vhi.help%2Fhtml%2Freference%2Fcontrol_functions_sortbysequ.xhtml
 */

/**
 * unhandled sequences: (mc - mouse support)
 * "inst_c unhandled:" "?" Array [ 2004 ] "h"   bracketed paste mode https://cirw.in/blog/bracketed-paste
 *
 */

  // scroll down - http://vt100.net/docs/vt510-rm/SD
  // FIXME: apply new buffer logic
AnsiTerminal.prototype.SD = function (params){
  var lines = (params[0]) ? params[0] : 1;

  do {
    var row = new Row();

    for (var j = 0; j < this.cols; ++j) {
      row.cells.push(new TChar('', this.textattributes, this.colors));
    }

    this.screen.buffer.splice(this.scrolling_top, 0, row);
    this.screen.buffer.splice(this.scrolling_bottom, 1);
  } while (--lines);
};

// scroll up - http://vt100.net/docs/vt510-rm/SU
// FIXME: apply new buffer logic
AnsiTerminal.prototype.SU = function (params){
  var lines = (params[0]) ? params[0] : 1;

  do {
    var row = new Row();

    for (var j = 0; j < this.cols; ++j) {
      row.cells.push(new TChar('', this.textattributes, this.colors));
    }

    this.screen.buffer.splice(this.scrolling_bottom, 0, row);
    this.screen.buffer.splice(this.scrolling_top, 1);
  } while (--lines);
};

// repeat - Repeat the preceding graphic character P s times (REP).
// FIXME: hacky solution with this.last_char
AnsiTerminal.prototype.REP = function (params){
  var s = '';
  var c = this.last_char;
  var n = (params[0]) ? params[0] : 1;

  if (c) {
    do {
      s += c;
    } while (--n);

    // for max col we need to set col to width to take
    // advantage of the autowrapping in inst_p
    // FIXME: not true anymore
    if (this.cursor.col == this.cols - 1) {
      this.cursor.col = this.cols;
    }

    this.inst_p(s);

    this.last_char = '';
  }
};

// next line - http://vt100.net/docs/vt510-rm/NEL
AnsiTerminal.prototype.NEL = function (){
  this.cursor.row += 1;

  if (this.cursor.row >= this.scrolling_bottom) {
    var row = new Row();

    for (var j = 0; j < this.cols; ++j) {
      row.cells.push(new TChar('', this.textattributes, this.colors));
    }

    this.screen.buffer.splice(this.scrolling_bottom, 0, row);

    var scrolled_out = this.screen.buffer.splice(this.scrolling_top, 1)[0];

    if (!this.scrolling_top) {
      this.screen.appendToScrollBuffer(scrolled_out);
    }

    this.cursor.row -= 1;
  }

  this.cursor.col = 0;
};

// index - http://vt100.net/docs/vt510-rm/IND
AnsiTerminal.prototype.IND = function (){
  this.cursor.row += 1;

  if (this.cursor.row >= this.scrolling_bottom) {
    var row = new Row();

    for (var j = 0; j < this.cols; ++j) {
      row.cells.push(new TChar('', this.textattributes, this.colors));
    }

    this.screen.buffer.splice(this.scrolling_bottom, 0, row);

    var scrolled_out = this.screen.buffer.splice(this.scrolling_top, 1)[0];

    if (!this.scrolling_top) {
      this.screen.appendToScrollBuffer(scrolled_out);
    }

    this.cursor.row -= 1;
  }
};

// vertical position relative - http://vt100.net/docs/vt510-rm/VPR
AnsiTerminal.prototype.VPR = function (params){
  this.cursor.row += ((params[0]) ? params[0] : 1);

  if (this.cursor.row >= this.rows) {
    this.cursor.row = this.rows - 1;
  }
};

// horizontal position relative - http://vt100.net/docs/vt510-rm/HPR
AnsiTerminal.prototype.HPR = function (params){
  this.cursor.col += ((params[0]) ? params[0] : 1);

  if (this.cursor.col >= this.cols) {
    this.cursor.col = this.cols - 1;
  }
};

// horizontal position absolute - http://vt100.net/docs/vt510-rm/HPA
AnsiTerminal.prototype.HPA = function (params){
  this.cursor.col = ((params[0]) ? params[0] : 1) - 1;

  if (this.cursor.col >= this.cols) {
    this.cursor.col = this.cols - 1;
  }
};

// cursor backward tabulation - http://vt100.net/docs/vt510-rm/CBT
AnsiTerminal.prototype.CBT = function (params){
  this.cursor.col = (Math.floor((this.cursor.col - 1) / this.tab_width)
    + 1 - ((params[0]) ? params[0] : 1)) * this.tab_width;

  if (this.cursor.col < 0) {
    this.cursor.col = 0;
  }
};

// cursor horizontal forward tabulation - http://vt100.net/docs/vt510-rm/CHT
AnsiTerminal.prototype.CHT = function (params){
  this.cursor.col = (Math.floor(this.cursor.col / this.tab_width)
    + ((params[0]) ? params[0] : 1)) * this.tab_width;

  if (this.cursor.col >= this.cols) {
    this.cursor.col = this.cols - 1;
  }
};

// cursor previous line - http://vt100.net/docs/vt510-rm/CPL
AnsiTerminal.prototype.CPL = function (params){
  this.cursor.row -= (params[0]) ? params[0] : 1;

  if (this.cursor.row < 0) {
    this.cursor.row = 0;
  }

  this.cursor.col = 0;
};

// cursor next line - http://vt100.net/docs/vt510-rm/CNL
AnsiTerminal.prototype.CNL = function (params){
  this.cursor.row += (params[0]) ? params[0] : 1;

  if (this.cursor.row >= this.rows) {
    this.cursor.row = this.rows - 1;
  }

  this.cursor.col = 0;
};

// delete line - http://vt100.net/docs/vt510-rm/DL
AnsiTerminal.prototype.DL = function (params){
  var lines = params[0] || 1;

  do {
    this.screen.buffer.splice(this.cursor.row, 1);

    var row = new Row();

    for (var j = 0; j < this.cols; ++j) {
      row.cells.push(new TChar('', this.textattributes, this.colors));
    }

    this.screen.buffer.splice(this.scrolling_bottom - 1, 0, row);
  } while (--lines);

  // see http://vt100.net/docs/vt220-rm/chapter4.html
  this.cursor.col = 0;
};

// insert character - http://vt100.net/docs/vt510-rm/ICH
AnsiTerminal.prototype.ICH = function (params){
  var chars = params[0] || 1;

  do {
    // FIXME ugly code - do splicing only once
    this.screen.buffer[this.cursor.row].cells
      .splice(this.cursor.col, 0, new TChar('', this.textattributes, this.colors));
    this.screen.buffer[this.cursor.row].cells.pop();
  } while (--chars);
};

// Vertical Line Position Absolute - http://vt100.net/docs/vt510-rm/VPA
AnsiTerminal.prototype.VPA = function (params){
  this.cursor.row = ((params[0]) ? params[0] : 1) - 1;

  if (this.cursor.row >= this.rows) {
    this.cursor.row = this.rows - 1;
  }
};

// erase character - http://vt100.net/docs/vt510-rm/ECH
AnsiTerminal.prototype.ECH = function (params){
  var erase = ((params[0]) ? params[0] : 1) + this.cursor.col;

  erase = (this.cols < erase) ? this.cols : erase;

  for (var i = this.cursor.col; i < erase; ++i) {
    this.screen.buffer[this.cursor.row].cells[i] = new TChar('', this.textattributes, this.colors);
  }

  this.screen.buffer[this.cursor.row].version++;
};

// Insert Line - http://vt100.net/docs/vt510-rm/IL
AnsiTerminal.prototype.IL = function (params){
  var lines = (params[0]) ? params[0] : 1;

  // FIXME ugly code - less splice possible?
  do {
    var row = new Row();

    for (var j = 0; j < this.cols; ++j) {
      row.cells.push(new TChar('', this.textattributes, this.colors));
    }

    this.screen.buffer.splice(this.cursor.row, 0, row);
    this.screen.buffer.splice(this.scrolling_bottom, 1);
  } while (--lines);

  // see http://vt100.net/docs/vt220-rm/chapter4.html
  this.cursor.col = 0;
};

// Set Top and Bottom Margins - http://vt100.net/docs/vt510-rm/DECSTBM
AnsiTerminal.prototype.DECSTBM = function (params){
  var top = params[0] - 1 || 0;
  var bottom = params[1] || this.rows;

  top = (top < 0) ? 0 : ((top >= this.rows) ? (this.rows - 1) : top);
  bottom = (bottom > this.rows) ? (this.rows) : bottom;

  if (bottom > top) {
    this.scrolling_top = top;
    this.scrolling_bottom = bottom;
  }

  // always set cursor to top (seems xterm always does this - bug?)
  this.cursor.row = 0;
};

// soft terminal reset - http://vt100.net/docs/vt510-rm/DECSTR
AnsiTerminal.prototype.DECSTR = function (){
  // DECTCEM      Text cursor enable          --> Cursor enabled.
  this.show_cursor = true;
  // IRM          Insert/replace              --> Replace mode.
  this.insert_mode = false;
  // DECOM        Origin                      --> Absolute (cursor origin at upper-left of screen.) TODO do we need this?
  this.CUP();  // at least move cursor home
  // DECAWM       Autowrap                    --> No autowrap. TODO: really to false?
  //this.autowrap = false;
  // DECNRCM      National replacement character set  --> Multinational set. - unsupported
  // KAM          Keyboard action             --> Unlocked. TODO
  // DECNKM       Numeric keypad              --> Numeric characters. TODO
  // DECCKM       Cursor keys                 --> Normal (arrow keys).
  this.cursor_key_mode = false;
  // DECSTBM      Set top and bottom margins  --> Top margin = 1; bottom margin = page length.
  this.DECSTBM([]);
  // G0, G1, G2, G3, GL, GR                   --> Default settings. - unsupported
  this.charset = null;  // reset at least to unicode
  // SGR          Select graphic rendition    --> Normal rendition.
  this.SGR([0]);
  // DECSCA       Select character attribute  --> Normal (erasable by DECSEL and DECSED). TODO do we need this?
  // DECSC        Save cursor state           --> Home position.
  this.DECSC();
  // DECAUPSS     Assign user preference supplemental set     --> Set selected in Set-Up. - unsupported
  // DECSASD      Select active status display    --> Main display. TODO do we need this?
  // DECKPM       Keyboard position mode      --> Character codes. TODO do we need this?
  // DECRLM       Cursor direction            --> Reset (Left-to-right), regardless of NVR setting. TODO
  // DECPCTERM    PC Term mode                --> Always reset. TODO do we need this?
  // TODO: do we need to reset LNM?
};

// reverse index
AnsiTerminal.prototype.RI = function (){
  this.cursor.row -= 1;

  if (this.cursor.row < this.scrolling_top) {
    this.cursor.row = this.scrolling_top;

    var row = new Row();

    for (var j = 0; j < this.cols; ++j) {
      row.cells.push(new TChar('', this.textattributes, this.colors));
    }

    this.screen.buffer.splice(this.scrolling_top, 0, row);
    this.screen.buffer.splice(this.scrolling_bottom, 1);
  }
};

// save curor - http://vt100.net/docs/vt510-rm/DECSC
AnsiTerminal.prototype.DECSC = function (){
  var save = {};

  save['cursor'] = { row: this.cursor.row, col: this.cursor.col };
  save['textattributes'] = this.textattributes;
  save['charattributes'] = this.charattributes;
  this.cursor_save = save;
  // FIXME: this.colors
};

// restore cursor - http://vt100.net/docs/vt510-rm/DECRC
AnsiTerminal.prototype.DECRC = function (){
  // FIXME: this.colors
  if (this.cursor_save) {
    // load data back
    this.cursor.col = this.cursor_save['cursor'].col;
    this.cursor.row = this.cursor_save['cursor'].row;
    this.textattributes = this.cursor_save['textattributes'];
    this.charattributes = this.cursor_save['charattributes'];
  } else {
    // see http://vt100.net/docs/vt510-rm/DECRC
    this.CUP();
    this.ED([2]);
    this.textattributes = 0;
    this.charattributes = 0;
  }
};

AnsiTerminal.prototype.high = function (collected, params){
  // TODO: separate DEC and ANSI
  for (var i = 0; i < params.length; ++i) {
    switch (params[i]) {
      // DECCKM
      case 1:
        this.cursor_key_mode = true;
        break;
      case 4:
        if (!collected) {
          // IRM
          this.insert_mode = true;
        } else {
          // DECSCLM??
          console.log('unhandled high', collected, params[i]);
        }
        break;
      case 7:
        if (collected == '?') {
          // DECAWM (should be default?)
          this.autowrap = true;
        } else {
          console.log('unhandled high', collected, params[i]);
        }
        break;
      case 12:
        if (collected == '?') {
          this.blinking_cursor = true;
        } else {
          console.log('unhandled high', collected, params[i]);
        }
        break;
      case 20:
        if (!collected) {
          // LNM
          this.newline_mode = true;
        } else {
          console.log('unhandled high', collected, params[i]);
        }
        break;
      case   25:
        this.show_cursor = true;
        // DECTCEM (default)
        break;
      // printer stuff not supported
      case 43:
      case 44:
      case 45:
      case 46:
      case 47:
        // end printer stuff
        break;
      /* mouse handling
       *  - 5 exclusive mouse modes:
       *      9       X10 (press only)
       *      1000    press and release events
       *      1001    hilite mouse tracking (??)
       *      1002    cell motion tracking (press, move on pressed, release)
       *      1003    all (press, move, release)
       *  - exclusive formatting:
       *      1005    utf-8 mouse mode
       *      1006    sgr mouse mode
       *      1015    urxvt mouse mode (decimal)
       *  - special focus event: 1004 (CSI I / CSI O)
       * */
      case 9:
      case 1000:
      case 1001:
      case 1002:
      case 1003:
        this.mouse_mode = params[i];
        this.changedMouseHandling(this.mouse_mode, this.mouse_protocol);
        break;
      //case 1004: // focusIn/Out events
      case 1005:
      case 1006:
      case 1015:
        this.mouse_protocol = params[i];
        this.changedMouseHandling(this.mouse_mode, this.mouse_protocol);
        break;
      // alt buffer
      case 1049:
        this.screen = this.alternate_screen;
        this.cursor = this.alternate_cursor;
        break;
      default:
        console.log('unhandled high', collected, params[i]);
    }
  }
};

AnsiTerminal.prototype.low = function (collected, params){
  // TODO: separate DEC and ANSI
  for (var i = 0; i < params.length; ++i) {
    switch (params[i]) {
      case 1:
        this.cursor_key_mode = false;
        // DECCKM (default)
        break;
      case 4:
        // IRM (default)
        if (!collected) {
          this.insert_mode = false;
        } else {
          console.log('unhandled low', collected, params[i]);
        }
        break;
      case 7:
        if (collected == '?') {
          // DECAWM (default)
          this.autowrap = false;
        } else {
          console.log('unhandled high', collected, params[i]);
        }
        break;
      case 12:
        if (collected == '?') {
          this.blinking_cursor = false;
        } else {
          console.log('unhandled high', collected, params[i]);
        }
        break;
      case 20:
        if (!collected) {
          // LNM (default)
          this.newline_mode = false;
        } else {
          console.log('unhandled high', collected, params[i]);
        }
        break;
      case 25:
        this.show_cursor = false;
        // DECTCEM
        break;
      // printer stuff not supported
      case 43:
      case 44:
      case 45:
      case 46:
      case 47:
        // end printer stuff
        break;
      case 9:
      case 1000:
      case 1001:
      case 1002:
      case 1003:
        this.mouse_mode = 0;
        this.changedMouseHandling(this.mouse_mode, this.mouse_protocol);
        break;
      //case 1004: // focusIn/Out events
      case 1005:
      case 1006:
      case 1015:
        this.mouse_protocol = 0;
        this.changedMouseHandling(this.mouse_mode, this.mouse_protocol);
        break;
      case 1049:
        this.screen = this.normal_screen;
        this.cursor = this.normal_cursor;
        break;
      default:
        console.log('unhandled low', collected, params[i]);
    }
  }
};

// device status reports - http://vt100.net/docs/vt510-rm/DSR
// cursor position report - http://vt100.net/docs/vt510-rm/CPR
// FIXME: split and rename to DSR and CPR
AnsiTerminal.prototype.DSR = function (collected, params){
  switch (params[0]) {
    // DSR - just send 'OK'
    case  5:
      this.send(TERM_STRING['CSI'] + '0n');
      break;
    // cursor position report
    case  6:
      this.send(TERM_STRING['CSI'] + collected + (this.cursor.row + 1) + ';' + (this.cursor.col + 1) + 'R');
      break;
    // DSR-DIR data integrity report - just send 'ready, no errors'
    case 75:
      this.send(TERM_STRING['CSI'] + '?70n');
      break;
    default:
      console.log('unhandled DSR', collected, params);
  }
};

// cursor horizontal absolute - http://vt100.net/docs/vt510-rm/CHA
AnsiTerminal.prototype.CHA = function (params){
  this.cursor.col = ((params) ? (params[0] || 1) : 1) - 1;

  if (this.cursor.col >= this.cols) {
    this.cursor.col = this.cols - 1;
  }
};

// cursor backward - http://vt100.net/docs/vt510-rm/CUB
AnsiTerminal.prototype.CUB = function (params){
  this.cursor.col -= (params) ? (params[0] || 1) : 1;

  if (this.cursor.col < 0) {
    this.cursor.col = 0;
  }
};

// cursor down - http://vt100.net/docs/vt510-rm/CUD
AnsiTerminal.prototype.CUD = function (params){
  this.cursor.row += (params) ? (params[0] || 1) : 1;

  if (this.cursor.row >= this.rows) {
    this.cursor.row = this.rows - 1;
  }
};

// cursor forward - http://vt100.net/docs/vt510-rm/CUF
AnsiTerminal.prototype.CUF = function (params){
  this.cursor.col += (params) ? (params[0] || 1) : 1;

  if (this.cursor.col >= this.cols) {
    this.cursor.col = this.cols - 1;
  }
};

// cursor up - http://vt100.net/docs/vt510-rm/CUU
AnsiTerminal.prototype.CUU = function (params){
  this.cursor.row -= (params) ? (params[0] || 1) : 1;

  if (this.cursor.row < 0) {
    this.cursor.row = 0;
  }
};

// cursor position - http://vt100.net/docs/vt510-rm/CUP
AnsiTerminal.prototype.CUP = function (params){
  this.cursor.row = ((params) ? (params[0] || 1) : 1) - 1;

  if (this.cursor.row >= this.rows) {
    this.cursor.row = this.rows - 1;
  }

  this.cursor.col = ((params) ? (params[1] || 1) : 1) - 1;

  if (this.cursor.col >= this.cols) {
    this.cursor.col = this.cols - 1;
  }
};

// delete character - http://vt100.net/docs/vt510-rm/DCH
AnsiTerminal.prototype.DCH = function (params){
  var removed = this.screen.buffer[this.cursor.row].cells
    .splice(this.cursor.col, (params) ? (params[0] || 1) : 1);

  for (var i = 0; i < removed.length; ++i) {
    this.screen.buffer[this.cursor.row].cells.push(new TChar('', this.textattributes, this.colors));
  }

  this.screen.buffer[this.cursor.row].version++;
};

// erase in display - http://vt100.net/docs/vt510-rm/ED
AnsiTerminal.prototype.ED = function (params){
  var i, j, row;

  switch ((params) ? params[0] : 0) {
    case 0:
      // from cursor to end of display
      // remove to line end
      this.EL([0]);
      // clear lower lines
      for (i = this.cursor.row + 1; i < this.rows; ++i) {
        row = new Row();

        for (j = 0; j < this.cols; ++j) {
          row.cells.push(new TChar('', this.textattributes, this.colors));
        }

        this.screen.buffer[i] = row;
      }
      break;
    case 1:
      // from top of display to cursor
      // clear upper lines
      for (i = 0; i < this.cursor.row; ++i) {
        row = new Row();

        for (j = 0; j < this.cols; ++j) {
          row.cells.push(new TChar('', this.textattributes, this.colors));
        }

        this.screen.buffer[i] = row;
      }

      // clear line up to cursor
      this.EL([1]);
      break;
    case 2:
      // complete display
      for (i = 0; i < this.rows; ++i) {
        row = new Row();

        for (j = 0; j < this.cols; ++j) {
          row.cells.push(new TChar('', this.textattributes, this.colors));
        }

        this.screen.buffer[i] = row;
      }
      break;
  }
};

// erase in line - http://vt100.net/docs/vt510-rm/EL
AnsiTerminal.prototype.EL = function (params){
  var i;

  switch ((params) ? params[0] : 0) {
    case 0:
      // cursor to end of line
      for (i = this.cursor.col; i < this.cols; ++i) {
        this.screen.buffer[this.cursor.row].cells[i] = new TChar('', this.textattributes, this.colors);
      }

      this.screen.buffer[this.cursor.row].version++;
      break;
    case 1:
      // beginning of line to cursor
      for (i = 0; i <= this.cursor.col; ++i) {
        this.screen.buffer[this.cursor.row].cells[i] = new TChar('', this.textattributes, this.colors);
      }

      this.screen.buffer[this.cursor.row].version++;
      break;
    case 2:
      // complete line
      for (i = 0; i < this.cols; ++i) {
        this.screen.buffer[this.cursor.row].cells[i] = new TChar('', this.textattributes, this.colors);
      }

      this.screen.buffer[this.cursor.row].version++;
      break;
  }
};

// select graphic rendition - http://vt100.net/docs/vt510-rm/SGR
AnsiTerminal.prototype.SGR = function (params){
  // load global attributes and colors
  var attr = this.textattributes;
  var colors = this.colors;

  var ext_colors = 0;
  var RGB_mode = false;
  var counter = 0;

  // put reverse video mode in attributes
  // used in charattributes but not in global textattributes
  // to mimick xterm behavior
  if (this.reverse_video) {
    attr |= 1048576;
  }

  for (var i = 0; i < params.length; ++i) {
    // special treatment for extended colors
    if (ext_colors) {
      // first run in ext_colors gives color mode
      // sets counter to determine max consumed params
      if (!counter) {
        switch (params[i]) {
          case 2:
            RGB_mode = true;
            // eval up to 3 params
            counter = 3;
            // fg set SET+RGB: |(1<<26)|(1<<27)
            // bg set SET+RGB: |(1<<24)|(1<<25)
            attr |= (ext_colors == 38) ? 201326592 : 50331648;
            break;
          case 5:
            RGB_mode = false;
            // eval only 1 param
            counter = 1;
            // fg clear RGB, set SET: &~(1<<27)|(1<<26)
            // bg clear RGB, set SET: &~(1<<25)|(1<<24)
            attr = (ext_colors == 38)
              ? (attr & ~134217728) | 67108864
              : (attr & ~33554432) | 16777216;
            break;
          default:
            // unkown mode identifier, breaks ext_color mode
            console.log('sgr unknown extended color mode:', ext_colors[1]);
            ext_colors = 0;
        }
        continue;
      }
      if (RGB_mode) {
        switch (counter) {
          case 3:
            // red
            attr = (ext_colors == 38)
              ? (attr & ~65280) | (params[i] << 8)
              : (attr & ~255) | params[i];
            break;
          case 2:
            // green
            colors = (ext_colors == 38)
              ? (colors & ~4278190080) | (params[i] << 24)
              : (colors & ~16711680) | (params[i] << 16);
            break;
          case 1:
            // blue
            colors = (ext_colors == 38)
              ? (colors & ~65280) | (params[i] << 8)
              : (colors & ~255) | params[i];
        }
      } else {
        // 256 color mode
        // uses only lower bytes of attribute
        attr = (ext_colors == 38)
          ? (attr & ~65280) | (params[i] << 8)
          : (attr & ~255) | params[i];
      }
      counter -= 1;

      if (!counter) {
        ext_colors = 0;
      }
      continue;
    }

    switch (params[i]) {
      case 0:
        attr = 0;
        break;
      // bold on
      case 1:
        attr |= 65536;
        break;
      // not supported (faint)
      case 2:
        break;
      // italic on
      case 3:
        attr |= 131072;
        break;
      // underline on
      case 4:
        attr |= 262144;
        break;
      // blink on
      case 5:
        attr |= 524288;
        break;
      // only one blinking speed
      case 6:
        attr |= 524288;
        break;
      // inverted on
      case 7:
        attr |= 1048576;
        break;
      // conceal on
      case 8:
        attr |= 2097152;
        break;
      // not supported (crossed out)
      case 9:
        break;
      // not supported (font selection)
      case 10:
      case 11:
      case 12:
      case 13:
      case 14:
      case 15:
      case 16:
      case 17:
      case 18:
      case 19:
        break;
      // not supported (fraktur)
      case 20:
        break;
      case 21:
        // not supported (bold: off or underline: double)
        break;
      // bold off
      case 22:
        attr &= ~65536;
        break;
      // italic off
      case 23:
        attr &= ~131072;
        break;
      // underline off
      case 24:
        attr &= ~262144;
        break;
      // blink off
      case 25:
        attr &= ~524288;
        break;
      // reserved
      case 26:
        break;
      // inverted off
      case 27:
        attr &= ~1048576;
        break;
      // conceal off
      case 28:
        attr &= ~2097152;
        break;
      // not supported (not crossed out)
      case 29:
        break;
      case 30:
      case 31:
      case 32:
      case 33:
      case 34:
      case 35:
      case 36:
      case 37:
        // clear fg RGB, nullify fg, set fg SET, color
        // -134283009 = ~(1<<27) & ~(255<<8)
        attr = (attr & -134283009) | 67108864 | (params[i] % 10 << 8);
        break;
      case 38:
        ext_colors = 38;
        break;
      // default foreground color
      case 39:
        // fg set to false (1<<26)
        attr &= ~67108864;
        break;
      case 40:
      case 41:
      case 42:
      case 43:
      case 44:
      case 45:
      case 46:
      case 47:
        // clear bg RGB, nullify bg, set bg SET, color
        // -33554688 = ~(1<<25) & ~255
        attr = (attr & -33554688) | 16777216 | params[i] % 10;
        break;
      case 48:
        ext_colors = 48;
        break;
      // default background color
      case 49:
        // bg set to false
        attr &= ~16777216;
        break;
      case 90:
      case 91:
      case 92:
      case 93:
      case 94:
      case 95:
      case 96:
      case 97:
        // same as 37 but with |8 in color
        attr = (attr & -134283009) | 67108864 | (params[i] % 10 | 8 << 8);
        break;
      case 100:
      case 101:
      case 102:
      case 103:
      case 104:
      case 105:
      case 106:
      case 107:
        // same as 47 but with |8 in color
        attr = (attr & -33554688) | 16777216 | params[i] % 10 | 8;
        break;
      default:
        console.log('sgr unknown:', params[i]);
    }
  }

  // apply new attributes
  // charattributes differs only in reverse mode
  // for now from textattributes
  this.charattributes = attr;

  // set reverse video and delete it from attributes
  this.reverse_video = !!(attr & 1048576);
  attr &= ~1048576;

  // set new global attributes
  this.textattributes = attr;
  this.colors = colors;
};

/**
 * hex
 * @param c
 * @returns {*}
 */
function hex(c){
  c = c.toString(16);

  return c.length < 2 ? '0' + c : c;
}

/**
 * 256 colors
 */
var COLORS = (function colors256(){
  var i;
  var r = [0x00, 0x5f, 0x87, 0xaf, 0xd7, 0xff];

  // copy colors
  var colors = [
    // dark:
    '#000000', // black
    '#cd0000', // red3
    '#00cd00', // green3
    '#cdcd00', // yellow3
    '#0000ee', // blue2
    '#cd00cd', // magenta3
    '#00cdcd', // cyan3
    '#e5e5e5', // gray90
    // bright:
    '#7f7f7f', // gray50
    '#ff0000', // red
    '#00ff00', // green
    '#ffff00', // yellow
    '#5c5cff', // rgb:5c/5c/ff
    '#ff00ff', // magenta
    '#00ffff', // cyan
    '#ffffff'  // white
  ];

  // 16-231
  i = 0;

  for (; i < 216; i++) {
    out(r[(i / 36) % 6 | 0], r[(i / 6) % 6 | 0], r[i % 6]);
  }

  // 232-255 (grey)
  i = 0;

  for (; i < 24; i++) {
    r = 8 + i * 10;

    out(r, r, r);
  }

  function out(r, g, b){
    colors.push('#' + hex(r) + hex(g) + hex(b));
  }

  return colors;
}());

/**
 * char styles
 * @param node
 * @returns {{wide: boolean}}
 */
function styles(node){
  var color;
  var gb = node.gb;
  var attr = node.attr;
  var attributes = node.getAttributes();
  var foreground = attributes.foreground;
  var background = attributes.background;
  var styles = { wide: node.width === 2 };

  ['bold', 'italic', 'underline', 'blink', 'conceal'].forEach(function (key){
    styles[key] = attributes[key];
  });

  if (foreground.set && !foreground.RGB) {
    if (attributes.inverse) {
      if (attributes.bold) {
        styles.background = COLORS[(attr >>> 8 & 255) | 8];
      } else {
        styles.background = COLORS[attr >>> 8 & 255];
      }
    } else {
      if (attributes.bold) {
        styles.foreground = COLORS[(attr >>> 8 & 255) | 8];
      } else {
        styles.foreground = COLORS[attr >>> 8 & 255];
      }
    }
  }

  if (background.set && !background.RGB) {
    if (attributes.inverse) {
      styles.foreground = COLORS[attr & 255];
    } else {
      styles.background = COLORS[attr & 255];
    }
  }

  if (foreground.set && foreground.RGB) {
    color = '#' + hex(attr >>> 8 & 255) + hex(gb >>> 24) + hex(gb >>> 8 & 255);

    if (attributes.inverse) {
      styles.background = color;
    } else {
      styles.foreground = color;
    }
  }

  if (background.set && background.RGB) {
    color = '#' + hex(attr & 255) + hex(gb >>> 16 & 255) + hex(gb & 255);

    if (attributes.inverse) {
      styles.foreground = color;
    } else {
      styles.background = color;
    }
  }

  return styles;
}

/**
 * html style
 * @param styles
 * @returns {string}
 */
function htmlStyle(styles){
  var style = '';

  if (styles.foreground) {
    style += 'color:' + styles.foreground + ';';
  }

  if (styles.background) {
    style += 'background-color:' + styles.background + ';';
  }

  if (styles.bold) {
    style += 'font-weight:bold;';
  }

  if (styles.italic) {
    style += 'font-style:italic;';
  }

  if (styles.underline) {
    style += 'text-decoration:underline;';
  }

  if (styles.conceal) {
    style += 'visibility:hidden;';
  }

  return style;
}
