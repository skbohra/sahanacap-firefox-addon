

function naanExUtils(name) {
  this._exname = name;

  this._pref = Components.classes['@mozilla.org/preferences-service;1']
    .getService(Components.interfaces.nsIPrefService).getBranch("extensions." + name + ".");

  this._observer = Components.classes["@mozilla.org/observer-service;1"]
    .getService(Components.interfaces.nsIObserverService);

  this._login = Components.classes["@mozilla.org/login-manager;1"]
    .getService(Components.interfaces.nsILoginManager);
}

naanExUtils.prototype = {

  $: function(id) {
    return document.getElementById(id);
  },

  pref: function () {
    return this._pref;
  },

  notify: function(command) {
    var p = {
      "command": command
    };
    
    if (arguments[1]) {
      for (var i in arguments[1]) {
        p[i] = arguments[1][i];
      }
    }

    this._observer.notifyObservers(null,
                                   this._exname + "-command",
                                   p.toSource());
  },
  
  log: function(msg) {
    if (!this._console) {
      this._console = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
    }
    this._console.logStringMessage(msg);
  }

  

 
};
 

 	   