/*
Copyright (c) 2007 Alexander MacCaw

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

if (typeof Prototype == 'undefined') throw("Juggernaut error. Prototype could not be found.");
if (Prototype.Version < "1.6") throw("Juggernaut error. Prototype 1.6.0 is required.");

var Juggernaut = Class.create({ 
  is_connected: false,
  attempting_to_reconnect: false,
  ever_been_connected: false,
  hasFirebug: "console" in window && "firebug" in window.console && window.console.firebug.indexOf("1.0") > -1,

  logger: function(msg) {
    if (this.options.debug) {
      msg = "Juggernaut: " + msg + " on " + this.options.host + ':' + this.options.port;
      this.hasFirebug ? console.log(msg) : alert(msg);
    }
  },
  
  initialize: function(options) {
    this.options = options.evalJSON();
    Event.observe(window, 'load', function() {      
      this.appendFlashObject();
      juggernaut = this;
    }.bind(this));
  },
  
  initialized: function(){
    this.connect();
  },
  
  broadcast: function(body, type, client_ids, channels){
    var msg = new Hash();
    msg.set('command',  'broadcast');
    msg.set('body',     body);
    msg.set('type',     this.type);
    if(channels)  msg.set('channels', channels);
    if(client_ids) msg.set('client_ids', client_ids);
    this.sendData(msg.toJSON());
  },
  
  sendData: function(data){
    this.swf.sendData(escape(data));
  },
  
  connect: function(){
    if(!this.is_connected) this.swf.connect(this.options.host, this.options.port);
  },
  
  disconnect: function(){
    if(this.is_connected) {
      this.swf.disconnect();
      this.is_connected = false;
    }
  },
  
  connected: function(e) {
    var handshake = new Hash();
    handshake.set('command', 'subscribe');
    if(this.options.session_id) handshake.set('session_id', this.options.session_id);
    if(this.options.client_id)  handshake.set('client_id',  this.options.client_id);
    if(this.options.channels)   handshake.set('channels',   this.options.channels);
    if(this.currentMsgId) {
      handshake.set('last_msg_id', this.currentMsgId);
      handshake.set('signature',   this.currentSignature);
    }
    this.sendData(handshake.toJSON());
    this.ever_been_connected = true;
    this.is_connected = true;
    setTimeout(function(){
      if(this.is_connected) this.attempting_to_reconnect = false;
    }.bind(this), 1 * 1000);
    this.logger('Connected');
  },

  receiveData: function(e) {
     var msg = unescape(e.toString()).evalJSON();
     this.currentMsgId = msg.id;
     this.currentSignature = msg.signature;
     this.logger("Received data:\n" + msg.body + "\n");
     eval(msg.body);
  },

  appendFlashObject: function() {
    if($(this.options.swf_name)) {
      throw("Juggernaut error. 'swf_name' must be unique per juggernaut instance.");
    }
    this.element = new Element('div', {
      className: 'juggernaut'
    });
    this.element.setStyle({
      height: this.options.height,
      width:  this.options.width
    });
    $(document.body).insert({ bottom: this.element });
    this.so = new SWFObject(
      this.options.swf_address, 
      this.options.swf_name, 
      this.options.width, 
      this.options.height, 
      this.options.flash_version, 
      this.options.flash_color
    );
    this.so.useExpressInstall(this.options.ei_swf_address);
	  this.so.addVariable("bridgeName", this.options.bridge_name);
    this.so.write(this.element);
    this.swf = $(this.options.swf_name);
  },
  
  refreshFlashObject: function(){
    this.so.write(this.element);
    this.swf = $(this.options.swf_name);
  },
  
  errorConnecting: function(e) {
    this.is_connected = false;
    if(!this.attempting_to_reconnect) {
      this.logger('There has been an error connecting');
      this.reconnect();
    }
  },

  disconnected: function(e) {
    this.is_connected = false;
    if(!this.attempting_to_reconnect) {
      this.logger('Connection has been lost');
      this.reconnect();
    }
  },
  
  reconnect: function(){
    if(this.options.reconnect_attempts){
      this.attempting_to_reconnect = true;
      this.logger('Will attempt to reconnect ' + this.options.reconnect_attempts + ' times,\
the first in ' + (this.options.reconnect_intervals || 3) + ' seconds');
      for(var i=0; i < this.options.reconnect_attempts; i++){
        setTimeout(function(){
          if(!this.is_connected){
            this.logger('Attempting reconnect');
            if(!this.ever_been_connected){
              this.refreshFlashObject();
            } else {
              this.connect();
            }
          }
        }.bind(this), (this.options.reconnect_intervals || 3) * 1000 * (i + 1))
      }
    }
  }

});