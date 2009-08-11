const Cc = Components.classes;
const Ci = Components.interfaces;

const IdenticaNotifierLogin = {

  util: new naanExUtils("identicanotifier"),
  keyconfig: ["togglePopup", "insertURL"],
  vkNames: [],
  platformKeys: {},
  localKeys: {},
  url: null,	
  urls: [],
  onLoad: function() {

    var $ = this.util.$;
    this.strings = document.getElementById("identicanotifier-strings");

    this.buildUserList();

    var interval = this.util.pref().getIntPref("interval");
    if (!interval || interval < 3) {
      interval = 3;
    }
    $("refresh-interval").value = interval;

    var popup = this.util.pref().getIntPref("popup-interval");
    if (!popup) {
      popup = 3;
    }
    $("popup-interval").value = popup;

    $("popup-autoclose").checked = this.util.pref().getBoolPref("autoClose");
    $("balloon-popup").checked   = this.util.pref().getBoolPref("popup");

    $("sound").checked         = this.util.pref().getBoolPref("sound");
    $("sound-file").value      = this.util.pref().getCharPref("soundFile");
    $("sound-file").disabled   = !$("sound").checked;
    $("choose-sound").disabled = !$("sound").checked;

    this.localeKeys = document.getElementById("localeKeys");

    var platformKeys = document.getElementById("platformKeys");
    this.platformKeys.shift   = platformKeys.getString("VK_SHIFT");
    this.platformKeys.meta    = platformKeys.getString("VK_META");
    this.platformKeys.alt     = platformKeys.getString("VK_ALT");
    this.platformKeys.control = platformKeys.getString("VK_CONTROL");
    this.platformKeys.sep     = platformKeys.getString("MODIFIER_SEPARATOR");

    pref = Components.classes['@mozilla.org/preferences-service;1']
      .getService(Components.interfaces.nsIPrefService).getBranch("ui.key.");

    switch (pref.getIntPref("accelKey")) {
    case 17:
      this.platformKeys.accel = this.platformKeys.control;
      break;
    case 18: 
      this.platformKeys.accel = this.platformKeys.alt;
      break;
    case 224:
      this.platformKeys.accel = this.platformKeys.meta;
      break;
    default:
      this.platformKeys.accel = (window.navigator.platform.search("Mac") == 0 ?
                                 this.platformKeys.meta : this.platformKeys.control);
    }

    for (var property in KeyEvent) {
      this.vkNames[KeyEvent[property]] = property.replace("DOM_","");
    }
    this.vkNames[8] = "VK_BACK";

    for (var i in this.keyconfig) {
      var pref = this.util.pref().getCharPref(this.keyconfig[i]);
      var param = pref.split(/,/);
      var e = $("identicanotifier-key-" + this.keyconfig[i]);
      e.value = this.getPrintableKeyName(param[2], param[0], param[1]);
      e.initialValue = e.pref = pref;
    }
 Components.classes["@mozilla.org/observer-service;1"]
        .getService(Components.interfaces.nsIObserverService)
        .addObserver(IdenticaNotifierLogin, "identicanotifier-status", false);
  },

  onUnload: function() {
    try {
      window.opener.gIdenticaNotifier._prefWindow = null;
    }
    catch (e) {}
  },

    
   onStoreInDatabase: function(obj){
   	
  	var db = Cc["@uncryptic.com/identifox-database;1"].getService(Components.interfaces.nsIIdentiFoxDatabase);
	db.openDatabase();
  	
	var stmt = db.prepare("INSERT INTO subscriptions VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)");
    
    
    stmt.bindStringParameter( 0, obj['id']);
    stmt.bindStringParameter(  1, this.url);
    stmt.bindStringParameter(  2, obj['title']);
    stmt.bindStringParameter( 3, obj['last_updated']);
    stmt.bindInt32Parameter(  4, 0);
    stmt.bindStringParameter(  5, obj['title']);
    stmt.bindStringParameter(  6, obj['subscription_date']);
    stmt.bindInt32Parameter(  7, '0');
    stmt.bindInt32Parameter(  8, '0');
    stmt.bindInt32Parameter(  9, obj['unread']);
    stmt.bindStringParameter(  10, 'true');
    
   try {
   stmt.execute();
   }
   		
   
   
   catch (e) {
    dump("Insert DB error: " + e.message);
    }
    stmt.finalize();
  },
     
   
 
  onAddAccount: function() {
    var msg = this.strings.getString("AddAccount");
    var url = {value: ""};
    var urls = [];
    var i = 0;
    
	
   if (!this.promptSubscriptionDialog(url, msg)) return;

    
    
    /*for (var i = 0; i < list.itemCount; ++i) {
      if (list.getItemAtIndex(i).value == url.value) {
        var err = this.strings.getFormattedString("AccountAlreadyExist", [url.value]);
        alert(err);
        return;
      }
  }*/
    this.url = url.value;
    if(!url.value.match("([^\s]+(?=\.(xml|atom|rss))\.\2)")){
   		this.urls[0]=url.value;
    	this.fetchOneByOne();
    }
    else 
    {
    this.fetchPage(url.value);
    }
    },
    
    fetchOneByOne: function(){
    var url = this.urls.pop();
    if(url){
    	this.addAccount(url);
    }
    
    		
    },
   
    addAccount: function(url){
          
	  var request = Cc["@uncryptic.com/identifox-http-request;1"].createInstance(Ci.nsIIdentiFoxHttpRequest);
   	  var target = this;
      var dataArray = new Array();
   	  request.setURL(url);
      request.asyncOpen();
	  var list = this.util.$("accounts");	
      request.onerror   = function(p) {target.onError(request);}
      request.ontimeout = function(p) {target.onTimeout(request);}
    
      request.onload    = function(p) {
      switch (Number(request.status)) {
     case 400:
      //this.rateLimitExceeded(req);
    	return;
      break;

    case 401:
      /*if (req.callback == "statuses_friends_timeline" ||
          !this.dispatchError(req)) {
        this._accounts[this._user] = null;
        this._user = null;
        this._pass = null;
        this.notifyStatus("authFail");
      }*/
      break;

    case 403:
    case 404:
    case 500:
    case 502:
    case 503:
      
      break;
 
    case 200:
    case 304:
    default:
        target.url = url;
        
        dataArray = target.convertIntoArray(request.responseText); 
        target.onStoreInDatabase(dataArray);
    
      var item = list.appendItem(dataArray["title"], url);
      item.setAttribute("type","checkbox");
      
      //list.selectItem(item);
 		this.updateButtonState();
 		
      }
      }
    
    this.fetchOneByOne();
   },
   

	
	fetchPage: function(url){
		
	var request = Cc["@uncryptic.com/identifox-http-request;1"].createInstance(Ci.nsIIdentiFoxHttpRequest);
   	  var target = this;
      var dataArray = new Array();
   	  request.setURL(url);
      request.asyncOpen();
		
      request.onerror   = function(p) {target.onError(request);}
      request.ontimeout = function(p) {target.onTimeout(request);}
    
      request.onload    = function(p) {
      switch (Number(request.status)) {
     case 400:
      return;
      break;

    case 401:
      
      break;

    case 403:
    case 404:
    case 500:
    case 502:
    case 503:
      
      break;
 
    case 200:
    case 304:
    default:
       	 		target.getLinks(request.responseText);
      }
      }
	},
	
	
 getLinks: function(str){
	
    	var reg = "\\<link(/?[^\\>]+)\\>";
    	var patt=new RegExp(reg,'g');
	var links =[];
	var link;
	
	while(link = patt.exec(str))
	{
        	links.push(link[0]);
 	}       
	this.getUrl(links);
},


getUrl: function(result)
{
var i =0; var url = [];
var type = []; var urls = [];

while(result[i])
{
alert(result[i]);
if(result[i].match("application"))
{

    var reg = 'href= "(.+?)"';
    var patt=new RegExp(reg,'g');
	url = patt.exec(result[i]);
	url[1] =this.url+url[1];
	urls.push(url[1]);
}
i++;

}
 this.urls = urls;
 alert(urls);
 this.fetchOneByOne();

},

   
   convertIntoArray: function(data){
		
		var parser = new DOMParser();
		var xmlDoc=parser.parseFromString(data,"text/xml");
		var responseArray = new Array();
		responseArray["title"]= xmlDoc.getElementsByTagName("feed")[0].getElementsByTagName("title")[0].childNodes[0].nodeValue;
		responseArray["id"]=xmlDoc.getElementsByTagName("feed")[0].getElementsByTagName("id")[0].childNodes[0].nodeValue;
		//responseArray["author"]='author';
		responseArray["last_updated"]=xmlDoc.getElementsByTagName("feed")[0].getElementsByTagName("updated")[0].childNodes[0].nodeValue;
		responseArray["feed_url"]=xmlDoc.getElementsByTagName("feed")[0].getElementsByTagName("link")[0].attributes.getNamedItem("href").nodeValue;
		responseArray["total_entries"]=xmlDoc.getElementsByTagName("feed")[0].getElementsByTagName("entry").length;
		responseArray["unread"]=xmlDoc.getElementsByTagName("feed")[0].getElementsByTagName("entry").length;
		responseArray["verified"]=0;
		responseArray["deleted"]=0;
        responseArray["subscription_date"]=0;  		
       
        return responseArray;
	},


 
   
  onEditAccount: function() {

    var list = this.util.$("accounts");
    var url = list.selectedItem.value;
    var msg = this.strings.getFormattedString("EditAccount", [url]);
    var url = {value: url};
    if (!this.promptSubscriptionDialog(url, msg)) return;
	    this.showMessage(this.strings.getFormattedString("AccountModified", [url.value]));
    	this.accountChanged = true;
  },

  promptSubscriptionDialog: function(url, msg) {
    var prompt = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService);
    while (1) {
      var result = prompt.prompt(window, "SahanaFox", msg, url, "", {value:false});
      if (!result) return false;
      if (url.value) return true;
    }
    return true;
  },

  onRemoveAccount: function() {
    
    var list = this.util.$("accounts");
    var url = list.selectedItem.value;
    var msg = this.strings.getFormattedString("RemoveAccountConfirm", [url]);
    var prompt = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService);
    var result = prompt.confirm(window, "SahanaFox", msg);
    if (!result) return;
		
  	var db = Cc["@uncryptic.com/identifox-database;1"].getService(Components.interfaces.nsIIdentiFoxDatabase);
	db.openDatabase();
  	
	var stmt = db.prepare("DELETE FROM subscriptions WHERE feed_url = ?1");
    stmt.bindStringParameter( 0, url);
       
   try {
   stmt.execute();
   }
   		
   catch (e) {
    dump("Delete DB error: " + e.message);
  	
    }
    stmt.finalize();
    
    list.removeItemAt(list.selectedIndex);
    this.updateButtonState();
    this.showMessage(this.strings.getFormattedString("AccountRemoved", [url]));
    this.accountChanged = true;
  },

  
  
  onCheckSound: function(flag) {
    document.getElementById('sound-file').disabled = flag;
    document.getElementById('choose-sound').disabled = flag;
  },

  onBrowseFile: function() {
    const nsIFilePicker = Components.interfaces.nsIFilePicker;
    var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
    fp.init(window, this.strings.getString("ChooseSoundFile"), nsIFilePicker.modeOpen);
    if (navigator.platform == "MacPPC" || 
        navigator.platform == "MacIntel") {
      fp.appendFilter(this.strings.getString("SoundFileFilter") + " (*.wav, *.aiff)" , "*.wav; *.aiff");
    }
    else {
      fp.appendFilter(this.strings.getString("SoundFileFilter") + " (*.wav)", "*.wav");
    }

    var ret = fp.show();
    if (ret == nsIFilePicker.returnOK || ret == nsIFilePicker.returnReplace) {
      var file = fp.file;
      this.util.$("sound-file").value = file.path;
    }
  },

  buildUserList: function() {
     	
    var list = this.util.$("accounts");
    var url; var checked;
    while (list.firstChild) list.removeChild(menu.firstChild);

    var db = Cc["@uncryptic.com/identifox-database;1"].getService(Components.interfaces.nsIIdentiFoxDatabase);
	db.openDatabase();
  	var i =0;
	var stmt = db.prepare("SELECT * FROM subscriptions");
	while (stmt.executeStep()){
    url = stmt.getString(1);
    checked = stmt.getString(10);
    								
    var name = stmt.getString(2);
    var item = list.appendItem(name, url);
    item.setAttribute("type","checkbox");
    if(checked=="true")
    item.setAttribute("checked", "true");
	}
    
    stmt.finalize();
    this.updateButtonState();
    
  },

  updateButtonState: function() {

    var list = this.util.$("accounts");
    if (list.itemCount) {
      this.util.$("remove-account-button").disabled = false;
      this.util.$("edit-account-button").disabled = false;
    }
    else {
      this.util.$("remove-account-button").disabled = true;
      this.util.$("edit-account-button").disabled = true;
    }

  },

  showMessage: function(msg) {
    this.util.$("message").value = msg;
  },

  recognize: function(e) {
    e.preventDefault();
    e.stopPropagation();

    var modifiers = [];
    if(e.altKey)   modifiers.push("alt");
    if(e.ctrlKey)  modifiers.push("control");
    if(e.metaKey)  modifiers.push("meta");
    if(e.shiftKey) modifiers.push("shift");

    modifiers = modifiers.join(" ");

    var key = "";
    var keycode = "";
    if(e.charCode) {
      key = String.fromCharCode(e.charCode).toUpperCase();
    }
    else { 
      keycode = this.vkNames[e.keyCode];
      if(!keycode) return;
    }

    var val = this.getPrintableKeyName(modifiers, key, keycode);
    if (val) {
      e.target.value = val;
      e.target.pref = key + "," + keycode + "," + modifiers;
    }

    this.showMessage(this.strings.getString("WarnKeyConfig"));
  },

  revert: function(e) {
    var target = e.target.previousSibling;
    var param = target.initialValue.split(/,/);
    target.value = this.getPrintableKeyName(param[2], param[0], param[1]);
    target.pref  = param[0] + "," + param[1] + "," + param[2];
  },

  getPrintableKeyName: function(modifiers,key,keycode) {
    if(modifiers == "shift,alt,control,accel" && keycode == "VK_SCROLL_LOCK") return "";

    if (!modifiers && !keycode)
      return "";

    var val = "";
    if(modifiers) {
      val = modifiers.replace(/^[\s,]+|[\s,]+$/g,"").split(/[\s,]+/g).join(this.platformKeys.sep);
    }

    var   mod = ["alt", "shift", "control", "meta", "accel"];
    for (var i in mod) {
      val = val.replace(mod[i], this.platformKeys[mod[i]]);
    }

    if (val)
      val += this.platformKeys.sep;

    if(key) {
      val += key;
    }
    if(keycode) {
      try {
        val += this.localeKeys.getString(keycode);
      }
      catch(e) {
        val += keycode;
      }
    }

    return val;
  },

  onSubmit: function() {
    var $ = this.util.$;

    this.util.pref().setIntPref("interval", $("refresh-interval").value);
    this.util.pref().setIntPref("popup-interval", $("popup-interval").value);
    this.util.pref().setBoolPref("autoClose", $("popup-autoclose").checked);
    this.util.pref().setBoolPref("popup", $("balloon-popup").checked);

    this.util.pref().setBoolPref("sound", $("sound").checked);
    this.util.pref().setCharPref("soundFile", $("sound-file").value);

    /*for (var i in this.keyconfig) {
      var elem = $("identicanotifier-key-" + this.keyconfig[i]);
      this.util.pref().setCharPref(this.keyconfig[i], elem.pref);
    }*/

    this.util.notify("updatePref");
    var list = this.util.$("accounts")
    var listitems= list.getRowCount();
    for(var i=0;i<listitems;i++)
   	{ 
   		var db = Cc["@uncryptic.com/identifox-database;1"].getService(Components.interfaces.nsIIdentiFoxDatabase);
		db.openDatabase();
  		var stmt = db.prepare("UPDATE subscriptions SET enabled = ?1 WHERE feed_url = ?2");
    
    
    stmt.bindStringParameter( 0, list.getItemAtIndex(i).checked);
	stmt.bindStringParameter( 1, list.getItemAtIndex(i).value);        
   try {
   stmt.execute();
   }
   		
   
   
   catch (e) {
    dump("Delete DB error: " + e.message);
 	
    }
    stmt.finalize();
 	
  	}
    return true;
  },

  onCancel: function() {
    try {
      window.opener.gIdenticaNotifier._prefWindow = null;
    }
    catch (e) {}
  },
  
  observe: function(subject, topic, data) {
    if (topic != "identicanotifier-status") return;

    var msg = eval('(' + data + ')');
    if (this[msg.state]) {
      this[msg.state](msg.data);
    }
  }
  
};

