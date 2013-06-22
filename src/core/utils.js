/**
 * utils.js: log, math and other utilities
 */


/**
 * WX._log: log utils
 */
WX._log = (function () {
  var _prefix = "[wx] ",
      _prefix_info = "[wx:info] ",
      _prefix_warn = "[wx:warn] ",
      _prefix_err = "[wx:err] ";
  var _verbose = false;
  function _compose(prefix, msg, ref) {
    var m = prefix + msg;
    if (ref && ref.label) {
      m += " (" + ref.label + ")";
    }
    return m;
  }
  return {
    verbose: function(bool) {
      if(typeof bool === "boolean") {
        _verbose = bool;
      }
    },
    post: function (msg) {
      console.log(_compose(_prefix, msg));
    },
    info: function (msg, ref) {
      if (_verbose) {
        console.log(_compose(_prefix_info, msg, ref));
      }
    },
    warn: function (msg, ref) {
      if (_verbose) {
        console.log(_compose(_prefix_warn, msg, ref));
      }
    },
    error: function (msg, ref) {
      throw new Error(_compose(_prefix_err, msg, ref));
    }
  };
})();


/**
 * math lib
 */
Object.defineProperties(WX, {
  PI: {
    value: Math. PI
  },
  TWOPI: {
    value: Math.PI * 2
  },
  EPS: {
    value: Number.MIN_VALUE
  },
  NoteName: {
    value: {
      A0: 21, B0: 23,
      C1: 24, D1: 26, E1: 28, F1: 29, G1: 31, A1: 33, B1: 35,
      C2: 36, D2: 38, E2: 40, F2: 41, G2: 43, A2: 45, B2: 47,
      C3: 48, D3: 50, E3: 52, F3: 53, G3: 55, A3: 57, B3: 59,
      C4: 60, D4: 62, E4: 64, F4: 65, G4: 67, A4: 69, B4: 71,
      C5: 72, D5: 74, E5: 76, F5: 77, G5: 79, A5: 81, B5: 83,
      C6: 84, D6: 86, E6: 88, F6: 89, G6: 91, A6: 93, B6: 95,
      C7: 96, D7: 98, E7: 100, F7: 101, G7: 103, A7: 105, B7: 107,
      C8: 108
    }
  },
  random2f: {
    value: function(min, max) {
      return min + Math.random() * (max - min);
    }
  },
  random2: {
    value: function(min, max) {
      return Math.round(min + Math.random() * (max - min));
    }
  },
  pitch2freq: {
    value: function(pitch) {
      return 440.0 * Math.pow(2, ((Math.floor(pitch) - 69) / 12));
    }
  },
  freq2pitch: {
    value: function(freq) {
      return Math.floor(69 + 12 * Math.log(freq / 440.0) / Math.log(2));
    }
  },
  lin2db: {
    value: function(amp) {
      // if below -100dB, set to -100dB to prevent taking log of zero
      return 20.0 * (amp > 0.00001 ? (Math.log(amp) / Math.LN10): -5.0);
    }
  },
  db2lin: {
    value: function(db) {
     return Math.pow(10.0, db / 20.0);
    }
  }
});


/**
 * WX._loadBuffer
 * @desc fetching array buffer via XHR with oncomplete callback
 * @param unit target unit { _url, _ready, _buffer }
 */
WX._loadBuffer = function(url, oncomplete) {
  if (url === undefined || url === null) {
    WX._log.error("xhr failed (invalid url): " + url);
    // xhr failed
    return false;
  }
  var xhr = new XMLHttpRequest();
  xhr.open("GET", url, true);
  xhr.responseType = "arraybuffer";
  xhr.onload = function() {
    try {
      var b = WX.context.createBuffer(xhr.response, false);
      oncomplete({
        url: url,
        buffer: b,
        status: true
      });
      WX._log.post("loaded: " + url + " (" + b.numberOfChannels + "ch)");
    } catch(error) {
      WX._log.error("xhr failed (" + error.message + "): " + url);
    }
  };
  xhr.send();
  // xhr is done
  return true;
};