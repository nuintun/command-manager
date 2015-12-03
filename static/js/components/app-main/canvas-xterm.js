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
  this.canvas.backgroundAlpha = 0;
  this.brush = this.canvas.getContext('2d');
  this.brush.font = this.font + ' ' + this.fontSize;
  this.brush.fillStyle = this.font.color;
}

CanvasXTerm.prototype = {
  draw: function (screen){
    var rows = screen.length;
    var cols = rows ? screen[0].length : 0;

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