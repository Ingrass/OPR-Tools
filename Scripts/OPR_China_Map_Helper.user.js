// ==UserScript==
// @name         OPR China Map Helper
// @version      0.5.4
// @category     Info
// @namespace    https://github.com/Ingrass/OPR-Tools/
// @updateURL    https://github.com/Ingrass/OPR-Tools/raw/master/Scripts/OPR_China_Map_Helper.user.js
// @downloadURL  https://github.com/Ingrass/OPR-Tools/raw/master/Scripts/OPR_China_Map_Helper.user.js
// @description  Add some buttons for China map in OPR
// @author       Ethern Triomphe346 19John 记忆的残骸 stdssr convoi
// @include     https://opr.ingress.com/recon*
// @grant        none
// @require      https://cdn.jsdelivr.net/npm/clipboard@2.0.4/dist/clipboard.min.js
// @require      https://cdn.jsdelivr.net/npm/prcoords@1.0.0/js/PRCoords.js
// ==/UserScript==

/*
v0.5.4 18/9/2019
- brainstorming.azurewebsites.net uses https

v0.5.3 6/7/2019
- Require PRCoords instead of GpsUtil. Thanks to @shizhao mentioned that in #1.
- Use https on external links whenever possible
- Upgrade Clipboard to 2.0.4 and adapt to new usage signature
- Fix underline on Copy button on hover

v0.5.2 18/4/2019
brainstorming.azurewebsites.net 取代 kitten-114.getforge.io，kitten-114.getforge.io 將會停用

v0.5.1.2
intel地址更改

v0.5
- 支援審核 'Edit'
- 改寫結構
- GpsUtil 封裝成一個 function
- 可呈現多個 location 的地圖按鈕
- 對 title edit 加入 Google 和 百度 search 的按鈕
*/

// Global
window.PortalInfo = {};
//window.linkInfo1;
var subCtrl;
var pageData;

function LinkInfo( portalInfo ){
	this.lng = portalInfo.lng;
	this.lat = portalInfo.lat;
	this.title = portalInfo.title;
	this.otherLocations = portalInfo.otherLocations || [];
}

LinkInfo.prototype. genButtons = function( isEdit=false ){
	var a = [
		[ "intel", this.get_intel_link],
		[ "百度", this.get_baidu_link],
		[ "腾讯", this.get_tencent_link],
		[ "高德", this.get_autonavi_link],
		[ "OSM", this.get_OSM_link],
		[ "百/腾", this.get_BaiduQQ_link],
		//[ "百/腾/高", this.get_BaiduQQGaoDe_link], // 需要的請自行打開
		//[ "百/腾/高/OSM+", this.get_BaiduQQGaoDeOSM_link],
	];
	
	var a_for_edit = [
		[ "Gmap", this.get_GoogleMap_link],
	];
	
	var s = "";
	
	if( isEdit ){
		for( var i=0; i<a_for_edit.length; i++ ){
			s += "<a class='mapHelperButton button' target='mapHelper1' href='"
				+a_for_edit[i][1].call(this)+"'>"+a_for_edit[i][0]+"</a>";
		}
	}
	
	for( var i=0; i<a.length; i++ ){
		s += "<a class='mapHelperButton button' target='mapHelper1' href='"
			+a[i][1].call(this)+"'>"+a[i][0]+"</a>";
	}
	
	return s;
};

LinkInfo.prototype. get_tencent_link = function() {
	var gcj = PRCoords.wgs_gcj({ lat: this.lat, lon: this.lng});
	return "https://map.qq.com/?type=marker&isopeninfowin=1&markertype=1&name=" + encodeURIComponent(this.title).replace(/\'/g,"%27") + "&addr=+&pointy=" + gcj.lat + "&pointx=" + gcj.lon;
};

LinkInfo.prototype.  get_baidu_link = function() {
	return "https://api.map.baidu.com/marker?location=" + this.lat + "," + this.lng + "&title=" + encodeURIComponent(this.title).replace(/\'/g,"%27") + "&content=Application&output=html&coord_type=wgs84";
};

LinkInfo.prototype.  get_OSM_link = function() {
	return "https://www.openstreetmap.org/?mlat=" + this.lat + "&mlon=" + this.lng + "&zoom=16";
};

LinkInfo.prototype.  get_autonavi_link = function() { //AutoNavi (高德地图)
	return "https://uri.amap.com/marker?position=" + this.lng + "," + this.lat + "&name=" + encodeURIComponent(this.title).replace(/\'/g,"%27") + "&coordinate=wgs84&callnative=0";
};

LinkInfo.prototype.  get_intel_link = function() {
	return "https://intel.ingress.com/intel?z=16&ll=" + this.lat + "," + this.lng +"&pll="+this.lat+","+this.lng;
};

LinkInfo.prototype.  get_GoogleMap_link = function() {
	return "https://maps.google.com/?q=@" + this.lat + "," + this.lng;
};

LinkInfo.prototype.  get_BaiduQQ_link = function() {
	var s = this.otherLocations.map( x => x.lat + "," + x.lng ).join();
	return "https://brainstorming.azurewebsites.net/index.html#" + this.lat + "," + this.lng+"," +(s||"0");
};
LinkInfo.prototype.  get_BaiduQQGaoDe_link = function() {
	var s = this.otherLocations.map( x => x.lat + "," + x.lng ).join();
	return "https://brainstorming.azurewebsites.net/index3.html#" + this.lat + "," + this.lng+"," +(s||"0");
};
LinkInfo.prototype.  get_BaiduQQGaoDeOSM_link = function() {
	var s = this.otherLocations.map( x => x.lat + "," + x.lng ).join();
  return "https://brainstorming.azurewebsites.net/index5.html#" + this.lat + "," + this.lng+"," +(s||"0");
};

function get_copy_text() {
	var result = "";
	result += "OPR Portal Candidate\n";
	result += "Title: " + PortalInfo.title + "\n";
	result += "Desc: " + PortalInfo.description + "\n";
	result += "Addr: " + PortalInfo.streetAddress + "\n";
	result += "Image: " + PortalInfo.imageUrl + "\n";
	result += "Baidu Map: " + linkInfo1.get_baidu_link() + "\n";
	return result;
}

var timer_waitInfo = setInterval( function(){
	// 等待 subCtrl 能夠取得
	try {
		subCtrl = angular.element(document.getElementById('NewSubmissionController')).scope().subCtrl;
		pageData = subCtrl.pageData;
		pageData.imageUrl; // test
		clearInterval( timer_waitInfo );
	} catch (e) {
		return;
	}
	// info OK
	
	PortalInfo.imageUrl = pageData.imageUrl;
	PortalInfo.title = pageData.title;
	PortalInfo.description = pageData.description;
	PortalInfo.streetAddress = pageData.streetAddress;
	PortalInfo.lat = pageData.lat;
	PortalInfo.lng = pageData.lng;
	
	if( subCtrl.reviewType==='NEW' ){
		window.linkInfo1 = new LinkInfo(PortalInfo);
		var div = document.createElement('div');
		div.className = "ChinaMapHelper";
		div.innerHTML = linkInfo1.genButtons()
			+"<button class='mapHelperButton button clipbtn' type='button'>Copy</button>";
		document.getElementById("descriptionDiv").appendChild(div);
		
	}else{ //subCtrl.reviewType==='EDIT'
		//pageData.titleEdits;
		//pageData.locationEdits;
		//pageData.descriptionEdits;
		
		var table = document.createElement("TABLE");
		var tr = table.insertRow();
		
		for( var i=0; i<pageData.locationEdits.length; i++){
			var p = pageData.locationEdits[i];
			var otherLocations = pageData.locationEdits.slice(0);
			otherLocations.splice(i,1);
			window.linkInfo1 = new LinkInfo( {
				lng:p.lng,
				lat:p.lat,
				title: i.toString(),
				otherLocations: otherLocations,
			} );
			
			var td = tr.insertCell();
			var div = document.createElement('div');
			div.className = "ChinaMapHelper";
			div.innerHTML = linkInfo1.genButtons( true );
			td.appendChild(div);
		}
		document.getElementById("WhatIsItController").parentNode.prepend(table);
	}
	
	var css = ' \
		.ChinaMapHelper>a,button { display: inline-block; } \
		.ChinaMapHelper>a:hover,button:hover { color:white; } \
	';
	var node = document.createElement('style');
	node.type = 'text/css';
	node.appendChild(document.createTextNode(css));
	document.getElementsByTagName('head')[0].appendChild(node);

	// add "Search" to "edit" texts
	document.querySelectorAll(".titleEditBox,h3.ng-binding").forEach( function( box ) {
	  var p = box.querySelector( "p" ) || box;
	  var searchTerm = encodeURIComponent( p.innerText ).replace(/\'/g,"%27");
	  var span = document.createElement('span');
	  span.style.cssFloat = "right";
	  span.innerHTML =
		"<a target='ChinaMapHelperSearch' href='https://www.baidu.com/s?wd="+searchTerm+"'>百度一下</a> | "
		+"<a target='ChinaMapHelperSearch' href='https://www.google.com/search?q="+searchTerm+"'>Google search</a>"
	  p.appendChild( span );
	});
	
	new ClipboardJS('.clipbtn', {
	  text: function(trigger) {
			return get_copy_text();
	  }
	});

}, 99 );
