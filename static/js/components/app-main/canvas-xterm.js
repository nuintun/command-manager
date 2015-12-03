/**
 * Created by nuintun on 2015/12/3.
 */

function textRepeat(text, n){
  var str = '';

  for (var i = 0; i < n; i++) {
    str += text;
  }

  return str;
}

function CanvasXTerm(font){
  this.font = font || { family: 'Consolas', lineHeight: 20, size: 13, color: '#fff' };
  this.canvas = document.createElement('canvas');
  this.canvas.style.backgroundColor = 'transparent';
  this.brush = this.canvas.getContext('2d');
  this.brush.font = this.font + ' ' + this.fontSize;
  this.brush.fillStyle = this.font.color;
}

CanvasXTerm.prototype = {
  draw: function (screen){
    var text = '';
    var i, j, x, y, attrCache;
    var rows = screen.length;
    var cols = rows ? screen[0].length : 0;
    var baseY = (this.font.lineHeight + this.font.size) / 2;

    if (!this.rows || !this.cols || this.rows !== rows || this.cols !== cols) {
      this.rows = rows;
      this.cols = cols;

      this.canvas.width = this.measureWidth(textRepeat('A', cols), {
        style: 'italic',
        weight: 'bold',
        family: this.font.family,
        size: this.font.size
      });

      this.canvas.height = rows * this.font.lineHeight;
    }

    for (i = 0; i < rows; i++) {
      x = 0;
      y = i * 20 + baseY;

      for (j = 0; j < rows; j++) {

      }
    }
  },
  measureWidth: function (text, styles){
    this.brush.save();

    this.brush.font = styles.style
      + ' ' + styles.weight
      + ' ' + styles.family
      + ' ' + styles.size;

    var width = this.brush.measureText(text).width;

    this.brush.restore();

    return width;
  }
};