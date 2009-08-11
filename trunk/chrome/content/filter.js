const IdenticaNotifierFilter = {
	  util: new naanExUtils("identicanotifier"),

	onLoad: function() {
    	var $ = this.util.$;
		$("met").checked = this.util.pref().getBoolPref("met");
    	$("safety").checked   = this.util.pref().getBoolPref("safety");
		$("health").checked   = this.util.pref().getBoolPref("health");
		$("days").value   = this.util.pref().getCharPref("days");
		
	},
	onUnLoad: function(){
		 try {
      window.opener.gIdenticaNotifier._filterWindow = null;
    }
    catch (e) {}
	},

	onSubmit: function() {
    var $ = this.util.$;
	
    this.util.pref().setBoolPref("met", $("met").checked);
    this.util.pref().setBoolPref("health", $("health").checked);
    this.util.pref().setBoolPref("safety", $("safety").checked);
    this.util.pref().setCharPref("days", $("days").value);
    return true;
	},
	
	onCancel: function(){
		  try {
      window.opener.gIdenticaNotifier._filterWindow = null;
    }
    catch (e) {}
  }
  	
}