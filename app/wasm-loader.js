phina.namespace(function() {

  /**
   * @class phina.asset.Wasm
   * @extends phina.asset.Asset
   */
  phina.define('phina.asset.Wasm', {
    superClass: "phina.asset.Asset",

    /**
     * @constructor
     */
    init: function() {
      this.superInit();
    },

    _load: function(resolve) {

      var params = {};

      if (typeof this.src === 'string') {
        params.$extend({
          path: this.src,
        });
      }
      else if (typeof this.src === 'object') {
        params.$extend(this.src);
      }

      params.$safe({
        path: '',
        imports: {},
        dataType: 'arraybuffer',
      });

      // load
      var self = this;
      fetch(params.path)
        .then(response => response.arrayBuffer())
        .then(bytes => WebAssembly.instantiate(bytes, params.imports))
        .then(results => {
          self.module = results.module;
          self.instance = results.instance;
          resolve(self);
        })
      ;
    },

  });

  /* extend loader */
  phina.asset.AssetLoader.register('wasm', function(key, path) {
    return phina.asset.Wasm().load(path);
  });

});

/* ラッパークラス */
phina.namespace(function() {

  phina.define('phina.util.WasmModule', {
    superClass: 'phina.util.EventDispatcher',

    init: function(key) {
      this.superInit();
      var wasm = phina.asset.AssetManager.get('wasm', key);
      this.exports = wasm.instance.exports
      this.buffer = wasm.instance.exports.buffer;
      // this.$extend(wasm.instance.exports);
    },

  });

});
