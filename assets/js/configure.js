"use strict";jQuery(document).ready(function(t){new Vue({el:"main",data:{loading:!1,state:"considerations",syscheck:{ok:!1,error:"",results:[]},conf:{title:"Wiki",host:"",port:80,lang:"en",db:"mongodb://localhost:27017/wiki"},considerations:{https:!1,port:!1,localhost:!1}},methods:{proceedToWelcome:function(t){this.state="welcome",this.loading=!1},proceedToSyscheck:function(t){var s=this;this.state="syscheck",this.loading=!0,s.syscheck={ok:!1,error:"",results:[]},_.delay(function(){axios.post("/syscheck").then(function(t){t.data.ok===!0?(s.syscheck.ok=!0,s.syscheck.results=t.data.results):(s.syscheck.ok=!1,s.syscheck.error=t.data.error),s.loading=!1,s.$nextTick()}).catch(function(t){window.alert(t.message)})},1e3)},proceedToGeneral:function(t){this.state="general",this.loading=!1},proceedToConsiderations:function(t){this.considerations={https:!_.startsWith(this.conf.host,"https"),port:!1,localhost:_.includes(this.conf.host,"localhost")},this.state="considerations",this.loading=!1},proceedToDb:function(t){this.state="db",this.loading=!1}}})});