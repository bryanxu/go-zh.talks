// Copyright 2012 The Go Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

(function() {
  "use strict";

  var websocket, outputs = {};

  function onClose() {
    console.log('websocket connection closed');
  }

  function sendMessage(m) {
    websocket.send(JSON.stringify(m));
  }

  function onMessage(e) {
    var m = JSON.parse(e.data);
    var o = outputs[m.Id];
    if (o === null) {
      return;
    }
    if (m.Kind === "stdout" || m.Kind === "stderr") {
      showMessage(o, m.Body, m.Kind);
    }
    if (m.Kind === "end") {
      var s = "Program exited";
      if (m.Body !== "") {
        s += ": " + m.Body;
      } else {
        s += ".";
      }
      s += "\n";
      showMessage(o, s, "system");
    }
  }

  function showMessage(o, m, className) {
    var span = document.createElement("span");
    span.className = className;
    if (m.indexOf("IMAGE:") === 0) {
      var url = "data:image/png;base64," + m.substr(6);
      var img = document.createElement("img");
      img.src = url;
      span.appendChild(img);
    } else {
      m = m.replace(/&/g, "&amp;");
      m = m.replace(/</g, "&lt;");
      span.innerHTML = m;
    }
    var needScroll = (o.scrollTop + o.offsetHeight) == o.scrollHeight;
    o.appendChild(span);
    if (needScroll)
        o.scrollTop = o.scrollHeight - o.offsetHeight;
  }

  function run(body, output, options) {
    var id = output.id;
    outputs[id] = output;
    options = options || {};
    options.Race = !!options.Race; // force boolean
    sendMessage({Id: id, Kind: "run", Body: body, Options: options});
    return function() {
      sendMessage({Id: id, Kind: "kill"});
    };
  }

  window.connectPlayground = function(addr) {
    websocket = new WebSocket(addr);
    websocket.onmessage = onMessage;
    websocket.onclose = onClose;
    return run;
  };
})();
