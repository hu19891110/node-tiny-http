// Generated by CoffeeScript 1.10.0
(function() {
  var Cookie, Response, Status, Stream, Zlib, patchOriginalResponse,
    slice = [].slice;

  Cookie = require('cookie');

  Status = require('statuses');

  Zlib = require('zlib');

  Stream = require('stream');

  patchOriginalResponse = function(res) {
    var originalWrite;
    originalWrite = res.write;
    res.bytes = 0;
    return res.write = function() {
      var args, buf;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      buf = args[0];
      this.bytes += buf.length;
      return originalWrite.apply(this, args);
    };
  };

  Response = (function() {
    function Response(res1, req, options1) {
      var acceptEncoding;
      this.res = res1;
      this.options = options1;
      this.$statusCode = 200;
      this.$headers = {
        'content-type': 'text/html; charset=utf-8'
      };
      this.$cookies = [];
      this.$startTime = Date.now();
      this.$stream = null;
      this.$content = null;
      this.responded = false;
      if (this.options.compression) {
        acceptEncoding = req.headers['accept-encoding'];
        if (acceptEncoding != null) {
          if (acceptEncoding.match(/\bdeflate\b/)) {
            this.$stream = Zlib.createDeflate();
            this.$headers['content-encoding'] = 'deflate';
          } else if (acceptEncoding.match(/\bgzip\b/)) {
            this.$stream = Zlib.createGzip();
            this.$headers['content-encoding'] = 'gzip';
          }
        }
      }
      if (this.$stream == null) {
        this.$stream = new Stream.PassThrough;
      }
      patchOriginalResponse(this.res);
    }

    Response.prototype.content = function(val) {
      this.$content = val;
      return this;
    };

    Response.prototype.status = function(code) {
      this.$statusCode = Status(code);
      return this;
    };

    Response.prototype.cookie = function(key, val, options) {
      this.$cookies.push(Cookie.serialize(key, val, options));
      return this;
    };

    Response.prototype.header = function(key, val) {
      key = key.toLowerCase();
      this.$headers[key] = val;
      return this;
    };

    Response.prototype.finish = function(finish) {
      this.finish = finish;
      return this.res.on('finish', (function(_this) {
        return function() {
          return _this.finish.call(_this, _this.res.statusCode, _this.res.bytes, Date.now() - _this.$startTime);
        };
      })(this));
    };

    Response.prototype.respond = function() {
      var key, ref, val;
      this.res.statusCode = this.$statusCode;
      this.res.statusMessage = Status[this.$statusCode];
      ref = this.$headers;
      for (key in ref) {
        val = ref[key];
        key = key.replace(/(^|-)([a-z])/g, function(m, a, b) {
          return a + b.toUpperCase();
        });
        this.res.setHeader(key, val);
      }
      if (this.$cookies.length > 0) {
        this.res.setHeader('Set-Cookie', this.$cookies);
      }
      this.$stream.pipe(this.res);
      if (this.$content instanceof Stream.Readable) {
        return this.$content.pipe(this.$stream);
      } else {
        return this.$stream.end(this.$content);
      }
    };

    return Response;

  })();

  module.exports = Response;

}).call(this);
