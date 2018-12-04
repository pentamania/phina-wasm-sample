var TOMA_NUM = 20;
var Tomapiko = phina.createClass({
  superClass: phina.display.Sprite,

  init: function(x, y, speed) {
    this.superInit("tomapiko");
    this.setPosition(x, y);

    this.speed = speed;
    this.animation = phina.accessory.FrameAnimation("tomapiko")
      .attachTo(this)
    ;
    this.turn(); // set animation
  },

  update: function(app) {
    this.x += this.speed;
  },

  turn: function() {
    this.speed *= -1;
    if (this.speed < 0) {
      this.animation.gotoAndPlay('left');
    } else {
      this.animation.gotoAndPlay('right');
    }
  },

});

phina.define('MainScene', {
  superClass: 'phina.display.DisplayScene',

  init: function(options) {
    this.superInit(options);
    var mod = this.wasmModule = phina.util.WasmModule("filter_mod").exports;
    var width = this.width;
    var height = this.height;
    this.isFiltered = true;

    /* wasm sharing array setup */
    var byteSize = width * height * 4; // canvas memory size
    var ptr = this.ptr = mod.alloc(byteSize); // pointer
    this.usub = new Uint8ClampedArray(mod.memory.buffer, ptr, byteSize); // wasm側バッファ上の配列を参照
    this.filteredImageData = new ImageData(this.usub, width, height); // フィルター加工後のimageData

    /* sprites setup */
    phina.display.Sprite("splash")
      .setScale(0.5)
      .setPosition(this.width*0.5, this.height*0.5)
      .addChildTo(this)
    ;

    this.tomapikos = [];
    var yUnit = this.height / TOMA_NUM;
    TOMA_NUM.times((i, n)=> {
      var xRandom = Math.randint(0, this.width);
      var vec = Math.randint(-10, 10);
      var toma = Tomapiko(xRandom, yUnit*i, vec)
        .addChildTo(this);
      ;
      this.tomapikos.push(toma);
    });

    this.on('enterframe', (e)=> {
      this.tomapikos.forEach((toma)=> {
        if (toma.x < 0 || this.width < toma.x) {
          toma.turn();
        }
      });
    });

    phina.ui.Button({
      text: "Exit",
      width: 120,
      fontSize: 30,
    })
      .addChildTo(this)
      .setOrigin(1, 0)
      .setPosition(this.width, 0)
      .on('push', ()=> {
        this.exit();
      })
    ;

    phina.display.Label({
      text: "Tap to enable/disable filtering!",
      stroke: "white",
    })
      .addChildTo(this)
      .setPosition(this.width*0.5, this.height*0.9)
    ;

    // シーンを変えたらメモリ解放
    this.on('exit', function() {
      mod.dealloc(ptr, byteSize);
      console.log('exit, free wasm memory');
    });
  },

  // @override：filter処理を追加
  _render: function() {
    this.renderer.render(this);
    if (this.isFiltered) this.filter();
  },

  filter: function() {
    var ctx = this.canvas.context;
    var mod = this.wasmModule;

    var currentImage = ctx.getImageData(0, 0, this.width, this.height); // 現在の描画結果を取得
    this.usub.set(currentImage.data); // wasm側に一旦コピー
    mod.filter(this.ptr, this.width, this.height);
    ctx.putImageData(this.filteredImageData, 0, 0);
  },

  update: function(app) {
    var p = app.pointer;
    if (p.getPointingEnd()) {
      this.isFiltered = !this.isFiltered;
    }
  },

});