jQuery.fn.juggernaut = function(){
  is_connected: false,
  attempting_to_reconnect: false,
  ever_been_connected: false,
  hasFirebug: "console" in window && "firebug" in window.console,

  var settings  = {
    
  };

  jQuery(document).ready(function(){
    juggernaut = this;
    this.appendFlashObject()
  })
  // initialize: function(options) {
  //   this.options = options;
  //   Event.observe(window, 'load', function() {      
  //     juggernaut = this;
  //     this.appendFlashObject()
  //   }.bind(this));
  // },
  
  
  logger: function(msg) {
    if (this.options.debug) {
      msg = "Juggernaut: " + msg + " on " + this.options.host + ':' + this.options.port;
      this.hasFirebug ? console.log(msg) : alert(msg);
    }
  },
  
};