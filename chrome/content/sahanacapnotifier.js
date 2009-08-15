//
// Implementation of SahanaFox content JS
//


function IdenticaNotifier() {
  this._prefWindow = null;
  this._filterWindow = null;
  this._showBalloon = true;
  this._timer = null;
  this._alertQueue = new Array();
  this._util = new naanExUtils("identicanotifier");
  this._onFocus = false;
  this._needToUpdate = false;
  
}

IdenticaNotifier.prototype = {

  $: function(name) {
    return document.getElementById(name);
  },

  load: function() {

    this.initKeyConfig();
    
    // Don't init SahanaFox when the window is popup.
    if (window.toolbar.visible == false) {
      var btn = this.$("identicanotifier-statusbar-button");;
      var parent = btn.parentNode;
      parent.removeChild(btn);
      return;
    }

    this._strings = this.$("identicanotifier-strings");

    var target = this;

    Components.classes["@mozilla.org/observer-service;1"]
        .getService(Components.interfaces.nsIObserverService)
        .addObserver(gIdenticaNotifier, "identicanotifier-status", false);

    // Setup menuitem
    var menu = this.$("identicanotifier-menuitem-togglepopup");
    var disable = this.$("identicanotifier-menuitem-disable");
    this._showBalloon = this._util.pref().getBoolPref("popup");
    this._disable = this._util.pref().getBoolPref("disable");
    menu.setAttribute("checked", this._showBalloon);
    disable.setAttribute("checked", this._disable);

    this._popup = this.$("identicanotifier-popup");

    this._unescapeHTML = Components.classes["@mozilla.org/feed-unescapehtml;1"]
                           .getService(Components.interfaces.nsIScriptableUnescapeHTML);

  
      this._util.notify("initSession");
      this.setButtonState("active");
    

  },

  unload: function() {
    if (window.toolbar.visible == false) return;

    Components.classes["@mozilla.org/observer-service;1"]
        .getService(Components.interfaces.nsIObserverService)
          .removeObserver(gIdenticaNotifier, "identicanotifier-status");
  },

  observe: function(subject, topic, data) {
    if (topic != "identicanotifier-status") return;

    var msg = eval('(' + data + ')');
    if (this[msg.state]) {
      this[msg.state](msg.data);
    }
  },

    
  noUpdate: function(data) {
    this.updateTooltip();
    this.showMessage();
  },

  updateTooltip: function() {
    var elem = this.$("identicanotifier-last-update");
    var d = new Date();
    var h = d.getHours();
    if (h < 10) h = '0' + h;
    var m = d.getMinutes();
    if (m < 10) m = '0' + m;
    elem.value = "Last update: " + h + ":" + m;
  },

  
  internalError: function(data) {
    this.showMessage(data);
    this.updateTooltip();
   },
	
	
  onTimeoutBalloon: function() {

    if (this._onFocus) {
      this._needToUpdate = true;
      return;
    }

    this.removeBalloon();
    if (this._alertQueue.length) {
      this.showBalloon();
    }
    else {
      this.showUnreadCount(0);
    }
  },

  showMessage: function(message) {
    var elem = this.$("identicanotifier-status-tooltip");
    if (message) {
      this.setButtonState("error");
      elem.setAttribute("value", message);
    }
    else {
      this.setButtonState("active");
      elem.setAttribute("value", "SahanaFox");
    }
  },
  
  showUnreadCount: function(count) {
    var msg = {"state": "setUnreadCount", "data": count};

    Components.classes["@mozilla.org/observer-service;1"]
        .getService(Components.interfaces.nsIObserverService)
    .notifyObservers(null, "identicanotifier-status", msg.toSource());
  },

  setUnreadCount: function(count) {
    var elem = this.$("identicanotifier-statusbar-text");
    var value;

    var notifier = Components.classes['@uncryptic/identicanotifier;1']
      .getService(Components.interfaces.nsIIdenticaNotifier);

    //var unread = notifier.getUnreadCount();
     
    if (count == 0) {
      //value = unread || "";
    }
    else if (count > 0) {
      //value = count;
    }
    else {
    	
      //value = "";
    }
    //elem.setAttribute("value", value);
  },

  setButtonState: function(state) {
    var btn = this.$("identicanotifier-statusbar-button");
    btn.setAttribute("state", state);
  },

  updateBalloon: function(data) {
  	this.setButtonState("active");
  	this._alertQueue = data;
    if (!this.isActiveWindow()) {
      //this.showUnreadCount(0);
      return;
    }

    if (this._popup.isOpen) {

      // Append message balloon to top of popup menu
      //
      var msgs = this._alertQueue;
      for (var i = 0; i < msgs.length; ++i) {
      	 	
      	
        var msg = msgs[i];
        var elem = this.createMessageBalloon(msg, true);
        this._popup.addBalloon(elem);
      	
      }
      
      
      return;
    }

  
    if (!this._showBalloon) {
      
      return;
    }
    else {
      
    }

    var count = data.length;

    if (count == 0) {
    	
      return;
    }

    if (count > 5) {
      this._messageQueue = new Array();
      this.showNotice( count +" Alerts Receieved");
    }
    else {
         	
      //this.setUnreadCount(count);
        this.showBalloon();
      
    }
  },

  showBalloon: function() {
	
  	var elem = this.createMessageBalloon(this._alertQueue.shift(), false);
    elem.setAttribute("type", "balloon");
    this.popupBalloon(elem);
    
  },

  showNotice: function(msg) {
    var elem = document.createElement("vbox");
    elem.className = "identicanotifier-notice";
    elem.setAttribute("value", msg);
	this.popupBalloon(elem);
  },

  popupBalloon: function(elem) {
  	
    var box = document.createElement("vbox");
    box.id = "identicanotifier-balloon";

    box.appendChild(elem);
    var panel = this.$("identicanotifier-panel");
    panel.appendChild(box);

    var interval = this._util.pref().getIntPref("popup-interval");
    if (!interval) {
      interval = 3;
    }
    this._timer = setTimeout("gIdenticaNotifier.onTimeoutBalloon()", interval * 1000);

    var statusbar = this.$("status-bar");
    panel.openPopup(statusbar, "before_end", -16, 2, false, true);
    
  },

  showPopup: function(obj) {

    if (!this.isActiveWindow()) {
      return;
    }
    // remove balloon
    this.removeBalloon();
  
    this._popup.removeStatuses();
	var met = this._util.pref().getBoolPref("met");
    var health = this._util.pref().getBoolPref("health");
    var safety = this._util.pref().getBoolPref("safety");
    for (var i in obj) {
    	if(this.getDays(obj[i]["updated"])<= this._util.pref().getCharPref("days")){
    		if((obj[i]["category"] == "Met" && met == 1) || (obj[i]["category"] == "Safety" && safety == 1)|| (obj[i]["category"] == "Health" && health == 1))
    		{var elem = this.createMessageBalloon(obj[i], true);
     		 this._popup.appendChild(elem);
    		}
    	}
    }

 	 this._popup.show();
 	 

     if (navigator.platform.match("Mac")) {
      this._popup.input.style.padding = "0px";
    }

     //
    // workaround to make sure re-calc scrollbar size
    //
    var obj = this;
    setTimeout(function() {obj._popup.recalcScrollbar(true);}, 100);
  },
  
  
  getDays: function(time){
    var D = time.replace(/^(\d{4})-(\d{2})-(\d{2})T([0-9:]*)([.0-9]*)(.)(.*)$/,
  	"$1/$2/$3 $4 GMT") 
	D = Date.parse(D) + 1000*RegExp.$5 
	var k = +1 
	D -= k * Date.parse("1970/01/01 "+RegExp.$7+" GMT") * (RegExp.$6+"1") 
	system_date = new Date(D);
    user_date = new Date();
    delta_minutes = Math.floor((user_date - system_date) / (60 * 60 *  24 * 1000));
    return delta_minutes;
	},


  onPopupHidden: function(event) {
    if (event.target.nodeName == "panel") {
      this.closePopup(true);
    }
  },

  closePopup: function(force) {

    if (this._popup.isOpen) {
    
        this._popup.hide();
    
    }
  },

  removeBalloon: function() {
    if (this._timer) {
      clearTimeout(this._timer);
    }

    try {
      var panel = this.$("identicanotifier-panel");
      panel.removeChild(this.$("identicanotifier-balloon"));
      panel.hidePopup();
    }
    catch (e) {}
  },

  createMessageBalloon: function(data, highlight) {
	
    var elem = document.createElement("vbox");
    elem.className = "identicanotifier-status";
       
    	
    try {
       
     var msg = document.createElement("description");
     msg.className = "twitternotifier-message-body";
     msg.appendChild(document.createTextNode(data["title"]));
     elem.setAttribute("text", data["title"].toLowerCase());
     elem.setAttribute("time", data["area"]);
     
     if(data["severity"] == "Severe")
     elem.setAttribute("profile_image_url","chrome://identicanotifier/content/severe.png");
     else if(data["severity"] == "Moderate")
     elem.setAttribute("profile_image_url","chrome://identicanotifier/content/moderate.png");
     else if(data["severity"] == "Minor")
     elem.setAttribute("profile_image_url","chrome://identicanotifier/content/minor.png");
     elem.setAttribute("name", "Severity-"+data["severity"]);
     var info = document.createElement("description");
     info.className = "identicanotifier-message-body";
     var category = document.createTextNode("Category:"+data["category"]+" ");
     var time = this.createAnchorText(data["link"], this.getLocalTimeForDate(data["updated"]),"twitternotifier-permalink");
     info.appendChild(category);
     info.appendChild(time);
     info.style.display = "block";
     info.style.fontSize = (10) + "px";
     elem.appendChild(msg);
     elem.appendChild(info);
     
	  
    }
    catch (e) {
      this.log("Failed to create message balloon: " + e.message);
    }

    return elem;
  },

  setFocusToInput: function() {
    this._popup.input.value = this._popup.text;
    this._popup.input.select();
    var pos = this._popup.input.value.length;
    try {
      this._popup.input.setSelectionRange(pos, pos);
    }
    catch (e) {};
  },

 
  onClickStatusbarIcon: function(e) {
    if (e.button == 0) {
      this.onOpenPopup();
    }
  },

  onOpenPopup: function() {
    	this._util.notify("getRecent");
    	//this.setUnreadCount();
    if (this._popup.isOpen) {
     this.closePopup(true);
    }
        
    
  },

  onBalloonClick: function(e) {
    var node = e.target;
    if (e.button == 0) {
      var url = node.getAttribute('href');

      if (url) {
        this.showMessage();
        this.openURL(url);
        this.closePopup(false);
      }
    }
   
  },

 
   onBalloonMouseOver: function(e) {
    this._onFocus = true;
  },

  onBalloonMouseOut: function(e) {
    this._onFocus = false;
    if (this._needToUpdate) {
      this._needToUpdate = false;
      if (this._timer) {
        clearTimeout(this._timer);
      }
      this._timer = setTimeout("gIdenticaNotifier.onTimeoutBalloon()", 1000);
    }
  },

  
  openURL: function(url) {
    var tabbrowser = gBrowser;
    var tabs = tabbrowser.tabContainer.childNodes;
    for (var i = 0; i < tabs.length; ++i) {
      var tab = tabs[i];
      try {
        var browser = tabbrowser.getBrowserForTab(tab);
        if (browser) {
          var doc = browser.contentDocument;
          var loc = doc.location.toString();
          if (loc == url) {
            gBrowser.selectedTab = tab;
            return;
          }
        }
      }
      catch (e) {
      }
    }
    
    // There is no tab. open new tab...
    var tab = gBrowser.addTab(url, null, null);
    gBrowser.selectedTab = tab;
  },

  updateStatuses: function(e) {
    this._util.notify("updateDents");
  },

  markAllRead: function(e) {
    this.showUnreadCount(-1);
    
    for (var i = 0; i < this._popup.childNodes.length; ++i) {
      var e = this._popup.childNodes[i];
      e.setAttribute("unread", true);
    }
    this._util.notify("markAllRead");
    if (this._popup.isOpen) {
      this._popup.markRead();
    }
  },

  onPreference: function(e) {
    if (this._prefWindow) {
      this._prefWindow.focus();
      return true;
    }

    this._prefWindow = window.openDialog("chrome://identicanotifier/content/login.xul", 
                                         "_blank",
                                         "chrome,resizable=no,dependent=yes");
    return true;
  },

  onFilterOptions: function(e){
  	  if (this._filterWindow) {
      this._filterWindow.focus();
      return true;
    }

    this._filterWindow = window.openDialog("chrome://identicanotifier/content/filter.xul", 
                                         "_blank",
                                         "chrome,resizable=no,dependent=yes");
    return true;
  	
  },
  
    onDisable: function(e){
   	var menu = this.$("identicanotifier-menuitem-disable");
    this._disable = !this._disable;
    menu.setAttribute("checked", this._disable);
    this._util.pref().setBoolPref("disable", this._disable);
  	
  },
  
  
  onTogglePopup: function(e) {
    var menu = this.$("identicanotifier-menuitem-togglepopup");
    this._showBalloon = !this._showBalloon;
    menu.setAttribute("checked", this._showBalloon);
    this._util.pref().setBoolPref("popup", this._showBalloon);
  },

  
  

  
  //
  // Private utilities
  //
  isActiveWindow: function() {

    if (navigator.platform == "Win32" &&
        window.screenX == -32000 &&
        window.screenY == -32000) {
        return false;
    }

    var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
      .getService(Components.interfaces.nsIWindowMediator);
    var win = wm.getMostRecentWindow("");
    return (win == window) ? true : false;
  },

 
  

  
  createAnchorText: function(link, text, doTinyURL) {
      var anchor = document.createElement("a");
      anchor.className = "identicanotifier-hyperlink";
      anchor.setAttribute("href", link);

      anchor.setAttribute("tooltiptext", link);

      if (doTinyURL && link.match(this._tinyURL)) {
        anchor.setAttribute("onmouseover", "gIdenticaNotifier.onHoverTinyURL(this)");
      }
      anchor.appendChild(document.createTextNode(text));

      return anchor;
  },


  checkMenuItem: function(user, container) {
    var menu = this.$(container);
    if (menu) {
      for (var i = 0; i < menu.childNodes.length; ++i) {
        if (menu.childNodes[i].getAttribute("label") == user) {
          menu.childNodes[i].setAttribute("checked", true);
        }
        else {
          menu.childNodes[i].setAttribute("checked", false);
        }
      }
    }
  },

  initKeyConfig: function() {
    // setup short cut keys
    var key = ["togglePopup", "insertURL"];

    for (var i = 0; i < key.length; ++i) {
      var pref = this._util.pref().getCharPref(key[i]);
      var params = pref.split(/,/);

      var elem = this.$("identicanotifier-key-" + key[i]);

      if (elem) {
        if (params[0])
          elem.setAttribute("key", params[0]);
        if (params[1])
          elem.setAttribute("keycode", params[1]);
        elem.setAttribute("modifiers", params[2]);
      }
    }

  },

  removeAllChild: function(obj) {
    while(obj.firstChild) obj.removeChild(obj.firstChild);
  },

  getLocalTimeForDate: function(time) {
	
	var D = time.replace(/^(\d{4})-(\d{2})-(\d{2})T([0-9:]*)([.0-9]*)(.)(.*)$/,
  	"$1/$2/$3 $4 GMT") 
	D = Date.parse(D) + 1000*RegExp.$5 
	var k = +1 
	D -= k * Date.parse("1970/01/01 "+RegExp.$7+" GMT") * (RegExp.$6+"1") 
	system_date = new Date(D);
    user_date = new Date();
    delta_minutes = Math.floor((user_date - system_date) / (60 * 1000));
    if (Math.abs(delta_minutes) <= (8 * 60)) { // eight weeks... I'm lazy to count days for longer than that
      distance = this.distanceOfTimeInWords(delta_minutes);
      if (delta_minutes < 0) {
        return this._strings.getFormattedString("DateTimeFromNow", [distance]);
      } else {
        return this._strings.getFormattedString("DateTimeAgo", [distance]);
      }
    } else {
      return this._strings.getFormattedString("OnDateTime", [system_date.toLocaleDateString()]);
    }
  },

  // a vague copy of rails' inbuilt function, 
  // but a bit more friendly with the hours.
  distanceOfTimeInWords: function(minutes) {
    if (minutes.isNaN) return "";

    var index;

    minutes = Math.abs(minutes);
    if (minutes < 1)         index = 'LessThanAMinute';
    else if (minutes < 50)   index = (minutes == 1 ? 'Minute' : 'Minutes');
    else if (minutes < 90)   index = 'AboutOneHour';
    else if (minutes < 1080) {
      minutes = Math.round(minutes / 60);
      index = 'Hours';
    }
    else if (minutes < 1440) index = 'OneDay';
    else if (minutes < 2880) index = 'AboutOneDay';
    else {
      minutes = Math.round(minutes / 1440);
      index = 'Days';
    }
    return this._strings.getFormattedString(index, [minutes]);
  },

  log: function(msg) {
    var pref = Components.classes['@mozilla.org/preferences-service;1']
      .getService(Components.interfaces.nsIPrefBranch);

    if (pref.getBoolPref("extensions.identicanotifier.debug")) {
      if (this._console == null) 
        this._console = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
      this._console.logStringMessage(msg);
      dump(msg + "\n");
    }
  }

};

var gIdenticaNotifier = new IdenticaNotifier();

window.addEventListener("load", function(e) { gIdenticaNotifier.load(e); }, false);
window.addEventListener("unload", function(e) { gIdenticaNotifier.unload(e); }, false);
