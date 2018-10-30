// ==UserScript==
// @name         OPR China Map Helper
// @version      0.5.1.2
// @category     Info
// @namespace    https://github.com/Ingrass/OPR-Tools/
// @updateURL    https://github.com/Ingrass/OPR-Tools/raw/master/Scripts/OPR_China_Map_Helper.user.js
// @downloadURL  https://github.com/Ingrass/OPR-Tools/raw/master/Scripts/OPR_China_Map_Helper.user.js
// @description  Add some buttons for China map in OPR
// @author       Ethern Triomphe346 19John 记忆的残骸 stdssr
// @include     https://opr.ingress.com/recon*
// @grant        none
// @require      https://cdn.jsdelivr.net/clipboard.js/1.6.1/clipboard.min.js
// ==/UserScript==

/*
v0.5.1.2
intel地址更改

v0.5
- 支援審核 'Edit'
	- 改寫結構
	- GpsUtil 封裝成一個 function
	- 可呈現多個 location 的地圖按鈕
	- 對 title edit 加入 Google 和 百度 search 的按鈕
*/


// GpsUtil
var GpsUtil = (function(){
	//constants
	var x_PI = 3.14159265358979324 * 3000.0 / 180.0;
	var PI = 3.1415926535897932384626;
	var a = 6378245.0;
	var ee = 0.00669342162296594323;
	
	var transform_lat = function(lng, lat) {
	  var lat1 = +lat;
	  var lng1 = +lng;
	  var ret = -100.0 + 2.0 * lng1 + 3.0 * lat1 + 0.2 * lat1 * lat1 + 0.1 * lng1 * lat1 + 0.2 * Math.sqrt(Math.abs(lng1));
	  ret += (20.0 * Math.sin(6.0 * lng1 * PI) + 20.0 * Math.sin(2.0 * lng1 * PI)) * 2.0 / 3.0;
	  ret += (20.0 * Math.sin(lat1 * PI) + 40.0 * Math.sin(lat1 / 3.0 * PI)) * 2.0 / 3.0;
	  ret += (160.0 * Math.sin(lat1 / 12.0 * PI) + 320 * Math.sin(lat1 * PI / 30.0)) * 2.0 / 3.0;
	  return ret;
	};

	var transform_lng = function(lng, lat) {
	  var lat1 = +lat;
	  var lng1 = +lng;
	  var ret = 300.0 + lng1 + 2.0 * lat1 + 0.1 * lng1 * lng1 + 0.1 * lng1 * lat1 + 0.1 * Math.sqrt(Math.abs(lng1));
	  ret += (20.0 * Math.sin(6.0 * lng1 * PI) + 20.0 * Math.sin(2.0 * lng1 * PI)) * 2.0 / 3.0;
	  ret += (20.0 * Math.sin(lng1 * PI) + 40.0 * Math.sin(lng1 / 3.0 * PI)) * 2.0 / 3.0;
	  ret += (150.0 * Math.sin(lng1 / 12.0 * PI) + 300.0 * Math.sin(lng1 / 30.0 * PI)) * 2.0 / 3.0;
	  return ret;
	};

	var out_of_china = function(lng, lat) {
	  var lat1 = +lat;
	  var lng1 = +lng;
	  // 纬度3.86~53.55,经度73.66~135.05
	  return !(lng1 > 73.66 && lng1 < 135.05 && lat1 > 3.86 && lat1 < 53.55);
	};

	/**
	* WGS-84 to 火星坐标系(GCJ-02)
	* @param lng
	* @param lat
	* @returns {*[]}
	*/
	this. wgs84togcj02 = function(lng, lat) {
	  var lat1 = +lat;
	  var lng1 = +lng;
	  if (out_of_china(lng1, lat1)) {
			return [lng1, lat1];
	  } else {
			var dlat = transform_lat(lng1 - 105.0, lat1 - 35.0);
			var dlng = transform_lng(lng1 - 105.0, lat1 - 35.0);
			var radlat = lat1 / 180.0 * PI;
			var magic = Math.sin(radlat);
			magic = 1 - ee * magic * magic;
			var sqrtmagic = Math.sqrt(magic);
			dlat = (dlat * 180.0) / ((a * (1 - ee)) / (magic * sqrtmagic) * PI);
			dlng = (dlng * 180.0) / (a / sqrtmagic * Math.cos(radlat) * PI);
			var mglat = lat1 + dlat;
			var mglng = lng1 + dlng;
			return [mglng, mglat];
	  }
	};

	/**
	* 火星坐标系(GCJ-02) to 百度坐标系(BD-09) 的转换
	* @param lng
	* @param lat
	* @returns {*[]}
	*/
	this. gcj02tobd09 = function(lng, lat) {
	  var lat1 = +lat;
	  var lng1 = +lng;
	  var z = Math.sqrt(lng1 * lng1 + lat1 * lat1) + 0.00002 * Math.sin(lat1 * x_PI);
	  var theta = Math.atan2(lat1, lng1) + 0.000003 * Math.cos(lng1 * x_PI);
	  var bd_lng = z * Math.cos(theta) + 0.0065;
	  var bd_lat = z * Math.sin(theta) + 0.006;
	  return [bd_lng, bd_lat];
	};
	
	return this;
})(); 
// END GpsUtil

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
	var gcj = GpsUtil.wgs84togcj02(this.lng, this.lat);
	return "http://map.qq.com/?type=marker&isopeninfowin=1&markertype=1&name=" + encodeURIComponent(this.title).replace(/\'/g,"%27") + "&addr=+&pointy=" + gcj[1] + "&pointx=" + gcj[0];
};

LinkInfo.prototype.  get_baidu_link = function() {
	return "http://api.map.baidu.com/marker?location=" + this.lat + "," + this.lng + "&title=" + encodeURIComponent(this.title).replace(/\'/g,"%27") + "&content=Application&output=html&coord_type=wgs84";
};

LinkInfo.prototype.  get_OSM_link = function() {
	return "http://www.openstreetmap.org/?mlat=" + this.lat + "&mlon=" + this.lng + "&zoom=16";
};

LinkInfo.prototype.  get_autonavi_link = function() { //AutoNavi (高德地图)
	return "http://uri.amap.com/marker?position=" + this.lng + "," + this.lat + "&name=" + encodeURIComponent(this.title).replace(/\'/g,"%27") + "&coordinate=wgs84&callnative=0";
};

LinkInfo.prototype.  get_intel_link = function() {
	return "https://intel.ingress.com/intel?z=16&ll=" + this.lat + "," + this.lng +"&pll="+this.lat+","+this.lng;
};

LinkInfo.prototype.  get_GoogleMap_link = function() {
	return "http://maps.google.com/?q=@" + this.lat + "," + this.lng;
};

LinkInfo.prototype.  get_BaiduQQ_link = function() {
	var s = this.otherLocations.map( x => x.lat + "," + x.lng ).join();
	return "http://kitten-114.getforge.io/index.html#" + this.lat + "," + this.lng+"," +(s||"0");
};
LinkInfo.prototype.  get_BaiduQQGaoDe_link = function() {
	var s = this.otherLocations.map( x => x.lat + "," + x.lng ).join();
	return "http://kitten-114.getforge.io/index3.html#" + this.lat + "," + this.lng+"," +(s||"0");
};
LinkInfo.prototype.  get_BaiduQQGaoDeOSM_link = function() {
	var s = this.otherLocations.map( x => x.lat + "," + x.lng ).join();
  return "http://kitten-114.getforge.io/index5.html#" + this.lat + "," + this.lng+"," +(s||"0");
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
			+"<a class='mapHelperButton button clipbtn'>Copy</a>";
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
		.ChinaMapHelper>a { display: inline-block; } \
		.ChinaMapHelper>a:hover { color:white; } \
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
		+"<a target='ChinaMapHelperSearch' href='http://www.google.com/search?q="+searchTerm+"'>Google search</a>"
	  p.appendChild( span );
	});
	
	new Clipboard('.clipbtn', {
	  text: function(trigger) {
			return get_copy_text();
	  }
	});

}, 99 );
