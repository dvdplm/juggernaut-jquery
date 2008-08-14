if (typeof jQuery == 'undefined') throw("Juggernaut error. jQuery could not be found.");

(function($){
  $.extend({
    Juggernaut: {
      options: {},
      is_connected: false,
      attempting_to_reconnect: false,
      ever_been_connected: false,
      hasFirebug: "console" in window && "firebug" in window.console,

      initialize: function(options){
        this.options = $.extend(this.options, options);
        $(window).bind('load', {j: this}, function(e){
          juggernaut = e.data.j;
          juggernaut.appendFlashObject(); // When loaded, will call 'initialized'
        });
      },

      logger: function(msg) {
        if (this.options.debug) {
          msg = "Juggernaut: " + msg + " on " + this.options.host + ':' + this.options.port;
          this.hasFirebug ? console.log(msg) : alert(msg);
        }
      },
      
      fire_event: function(fx_name){
        $(document).trigger("juggernaut:"+ fx_name);
      },
      
      // Make sure we have a SWF object in the page
      appendFlashObject: function(){
        if(!this.swf()){
          this.logger("Appending the flash object.");
          this.element = document.createElement("DIV");
          this.element.setAttribute("id", "juggernaut");
          $(document.body).append(this.element);
          this.logger("DIV appended: "+$('#juggernaut'))
          swfobject.embedSWF(
            this.options.swf_address, 
            'juggernaut', 
            this.options.width, 
            this.options.height, 
            String(this.options.flash_version),
            this.options.ei_swf_address,
            {'bridgeName': this.options.bridge_name},
            {},
            {'id': this.options.swf_name, 'name': this.options.swf_name}
          );
        }else{
          this.logger("Appended already. Returning");
        }
      },
      
      swf: function(){
        return $('#'+this.options.swf_name)[0]
      },

      refreshFlashObject: function(){
        $(this.swf()).remove();
        this.appendFlashObject();
      },
      
      // Called by SWF when loaded&initialized
      initialized: function(){
        // this.logger("SWF is initialized.")
        this.fire_event('initialized');
        this.connect();
      },

      connect: function(){
        if(!this.is_connected){
          this.fire_event('connect'); // SWF listens to this one
          this.logger("Connecting...");
          this.swf().connect(this.options.host, this.options.port);
        }
      },

      disconnect: function(){
        if(this.is_connected) {
          this.swf().disconnect();
          this.is_connected = false;
        }
      },

      errorConnecting: function(e) {
        this.is_connected = false;
        if(!this.attempting_to_reconnect) {
          this.logger('There has been an error connecting');
          this.fire_event('errorConnecting');
          this.reconnect();
        }
      },

      // Called by SWF when a connection is established
      connected: function() {
        var handshake = new Object;
        handshake.command = 'subscribe';
        if(this.options.session_id) handshake.session_id = this.options.session_id;
        if(this.options.client_id)  handshake.client_id = this.options.client_id;
        if(this.options.channels)   handshake.channels = this.options.channels;
        
        if(this.currentMsgId) {
          handshake.last_msg_id = this.currentMsgId;
          handshake.signature = this.currentSignature;
        }
        
        this.sendData($.toJSON(handshake));
        this.ever_been_connected = true;
        this.is_connected = true;
        setTimeout(function(){
          if($.Juggernaut.is_connected) $.Juggernaut.attempting_to_reconnect = false;
        }, 1 * 1000);
        this.logger('Connected.');
        this.fire_event('connected'); // TODO: find out why this is fired
      },

      sendData: function(data){
        this.logger("Sending: " + data)
        this.swf().sendData(escape(data));
      },

      receiveData: function(e) {
         var msg = $.parseJSON(unescape(e));
         this.currentMsgId = msg.id;
         this.currentSignature = msg.signature;
         this.logger("Received data:\n" + msg.body + "\n");
         eval(msg.body);
      },
      
      disconnected: function(e) {
        this.is_connected = false;
        if(!this.attempting_to_reconnect) {
          this.logger('Connection has been lost');
          this.fire_event('disconnected');
          this.reconnect();
        }
      },
      
      reconnect: function(){
        if(this.options.reconnect_attempts){
          this.attempting_to_reconnect = true;
          this.fire_event('reconnect');
          this.logger('Will attempt to reconnect ' + this.options.reconnect_attempts + ' times, the first in ' + (this.options.reconnect_intervals || 3) + ' seconds');
          for(var i=0; i < this.options.reconnect_attempts; i++){
            setTimeout(function(){
              var j = $.Juggernaut
              if(!j.is_connected){
                j.logger('Attempting reconnect');
                if(!j.ever_been_connected){
                  j.refreshFlashObject();
                } else {
                  j.connect();
                }
              }
            }, (this.options.reconnect_intervals || 3) * 1000 * (i + 1))
          }
        }
      }
      
      
    }
  });
})(jQuery)