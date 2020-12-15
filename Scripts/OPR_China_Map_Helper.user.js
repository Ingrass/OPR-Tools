// ==UserScript==
// @name         OPR China Map Helper
// @version      0.7.3
// @category     Info
// @namespace    https://github.com/Ingrass/OPR-Tools/
// @updateURL    https://github.com/Ingrass/OPR-Tools/raw/master/Scripts/OPR_China_Map_Helper.user.js
// @downloadURL  https://github.com/Ingrass/OPR-Tools/raw/master/Scripts/OPR_China_Map_Helper.user.js
// @description  Add some buttons for China map in OPR
// @author       Ethern Triomphe346 19John 记忆的残骸 stdssr convoi
// @include      https://opr.ingress.com/recon*
// @include      https://wayfarer.nianticlabs.com/review*
// @grant        none
// @require      https://cdn.jsdelivr.net/npm/prcoords@1.0.0/js/PRCoords.js
// ==/UserScript==

/*
v0.7.3 16/12/2020
- 拿掉 copy 功能；因功能雞肋且為它需要調用一個 lib

v0.7.2 31/10/2020
- Edit文字的情況也可顯示附加按鈕

v0.7 21/10/2020
- 因應 Wayfarer變數名稱轉變 的修正

v0.6 12/10/2019
- 修复 Title Edit 的搜索功能

v0.5.8 12/10/2019
- 增加对 Wayfarer 编辑的外部地图辅助 buttons (Gmap被移除，可使用地图左下Google标识跳转)

v0.5.7 12/10/2019
- 适配 Niantic Wayfarer 美术风格
- 调整 button 位置
- 修复搜索功能
- 暂时下线 v0.5.6 的更新，还不明确edit样式，有条件想测试的朋友可以取消181行注释并提供反馈

v0.5.6 11/10/2019
- 修復新的 OPR "Edit" 的外部地圖輔助 buttons

v0.5.5 11/10/2019
- 适用新的 OPR 地址

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

function LinkInfo(portalInfo){
	this.lng = portalInfo.lng;
	this.lat = portalInfo.lat;
	this.title = portalInfo.title;
	this.otherLocations = portalInfo.otherLocations || [];
}

LinkInfo.prototype. genButtons = function(){
	var a = [
		[ "intel", this.get_intel_link],
		[ "百度", this.get_baidu_link],
		[ "腾讯", this.get_tencent_link],
		[ "高德", this.get_autonavi_link],
		[ "OSM", this.get_OSM_link],
		[ "百/腾", this.get_BaiduQQ_link],
		[ "百/腾/高", this.get_BTA_link],
		[ "百/腾/高/OSM+", this.get_BTAO_link],
	];

	var s = "";

	for(var i=0; i<a.length; i++) {
		s += "<a class='mapHelperButton button-secondary' target='mapHelper1' href='"
			+a[i][1].call(this)+"'>"+a[i][0]+"</a>";
	}

	return s;
};

LinkInfo.prototype.get_tencent_link = function() {
	var gcj = PRCoords.wgs_gcj({ lat: this.lat, lon: this.lng});
	return "https://map.qq.com/?type=marker&isopeninfowin=1&markertype=1&name=" 
		+ encodeURIComponent(this.title).replace(/\'/g,"%27") + "&addr=+&pointy=" + gcj.lat + "&pointx=" + gcj.lon;
};

LinkInfo.prototype.get_baidu_link = function() {
	return "https://api.map.baidu.com/marker?location=" + this.lat + "," + this.lng + "&title=" 
		+ encodeURIComponent(this.title).replace(/\'/g,"%27") + "&content=Application&output=html&coord_type=wgs84";
};

LinkInfo.prototype.get_OSM_link = function() {
	return "https://www.openstreetmap.org/?mlat=" + this.lat + "&mlon=" + this.lng + "&zoom=16";
};

//AutoNavi (高德地图)
LinkInfo.prototype.get_autonavi_link = function() { 
	return "https://uri.amap.com/marker?position=" + this.lng + "," + this.lat + "&name=" 
		+ encodeURIComponent(this.title).replace(/\'/g,"%27") + "&coordinate=wgs84&callnative=0";
};

LinkInfo.prototype.get_intel_link = function() {
	return "https://intel.ingress.com/intel?z=16&ll=" + this.lat + "," + this.lng +"&pll="+this.lat+","+this.lng;
};

LinkInfo.prototype.get_GoogleMap_link = function() {
	return "https://maps.google.com/?q=@" + this.lat + "," + this.lng;
};

LinkInfo.prototype.get_BaiduQQ_link = function() {
	var s = this.otherLocations.map(x => x.lat + "," + x.lng).join();
	return "https://brainstorming.azurewebsites.net/index.html#" + this.lat + "," + this.lng+"," +(s||"0");
};

// Baidu, Tencent, AutoNavi
LinkInfo.prototype.get_BTA_link = function() {
	var s = this.otherLocations.map(x => x.lat + "," + x.lng).join();
	return "https://brainstorming.azurewebsites.net/index3.html#" + this.lat + "," + this.lng+"," +(s||"0");
};

// Baidu, Tencent, AutoNavi, OSM
LinkInfo.prototype.get_BTAO_link = function() {
	var s = this.otherLocations.map(x => x.lat + "," + x.lng).join();
  return "https://brainstorming.azurewebsites.net/index5.html#" + this.lat + "," + this.lng+"," +(s||"0");
};

var timer_waitInfo = setInterval(function(){
	// 等待 subCtrl 能夠取得
	try {
		subCtrl = angular.element(document.getElementById('ReviewController')).scope().reviewCtrl;
		pageData = subCtrl.pageData;
		pageData.imageUrl; // test
		clearInterval(timer_waitInfo);
	} catch(e) {
		return;
	}
	// info OK

	PortalInfo.imageUrl = pageData.imageUrl;
	PortalInfo.title = pageData.title;
	PortalInfo.description = pageData.description;
	PortalInfo.streetAddress = pageData.streetAddress;
	PortalInfo.lat = pageData.lat;
	PortalInfo.lng = pageData.lng;

	if(subCtrl.reviewType==='NEW') {
		window.linkInfo1 = new LinkInfo(PortalInfo);
		var div = document.createElement('div');
		div.className = "ChinaMapHelper";
		div.innerHTML = linkInfo1.genButtons()
		document.querySelector("#map-card .card__footer").prepend(div);

	} else {
	    //subCtrl.reviewType==='EDIT' or 'PHOTO'
		//pageData.titleEdits;
		//pageData.locationEdits;
		//pageData.descriptionEdits;

		var table = document.createElement("TABLE");
		var tr = table.insertRow();

		for(var i=0; i<pageData.locationEdits.length; i++){
			var p = pageData.locationEdits[i];
			var otherLocations = pageData.locationEdits.slice(0);
			otherLocations.splice(i,1);
			window.linkInfo1 = new LinkInfo({
				lng:p.lng,
				lat:p.lat,
				title: i.toString(),
				otherLocations: otherLocations,
			});

			var td = tr.insertCell();
			var div = document.createElement('div');
			div.className = "ChinaMapHelper";
			div.innerHTML = linkInfo1.genButtons();
			td.appendChild(div);
		}

		document.querySelectorAll(".map-card.map-edit-card .card__body, .known-information-card .card__body").forEach( (card)=>{
			card.appendChild( table.cloneNode(true) );
		});

	}

	var css = `
	.ChinaMapHelper{
		display: inline-block;
	}
	.ChinaMapHelper>.button-secondary {
		display: inline-block; 
		min-width: auto; 
		padding: 7px 12px; 
		margin-right: 5px; 
		margin-top: 5px;
		margin-bottom: 5px;
		color:black;
	}`;
	var node = document.createElement('style');
	node.appendChild(document.createTextNode(css));
	document.getElementsByTagName('head')[0].appendChild(node);

	// add "Search" to "edit" texts
	document.querySelectorAll(".titleEditBox.poi-edit-box .poi-edit-text").forEach(function(box) {
	  var p = box.querySelector("p") || box;
	  var searchTerm = encodeURIComponent(p.innerText).replace(/\'/g,"%27");
	  var span = document.createElement('span');
	  span.style.cssFloat = "right";
	  span.innerHTML =
		"<a target='ChinaMapHelperSearch' href='https://www.google.com/search?q="+searchTerm+"'>🔍</a>"
	  p.appendChild(span);
	});

}, 99);
