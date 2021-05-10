// ==UserScript==
// @name         OPR China Map Helper
// @version      0.9
// @category     Info
// @namespace    https://github.com/Ingrass/OPR-Tools/
// @updateURL    https://github.com/Ingrass/OPR-Tools/raw/master/Scripts/OPR_China_Map_Helper.meta.js
// @downloadURL  https://github.com/Ingrass/OPR-Tools/raw/master/Scripts/OPR_China_Map_Helper.user.js
// @description  Add some buttons for China map in OPR
// @author       Ethern Triomphe346 lokpro 记忆的残骸 stdssr convoi
// @include      https://wayfarer.nianticlabs.com/review*
// @grant        none
// @require      https://cdn.jsdelivr.net/npm/prcoords@1.0.0/js/PRCoords.js
// ==/UserScript==

/*
v0.9 10/5/2021
- 適用審PHOTO的情況

v0.8 21/12/2020
- 可顯示/隱藏按鈕

v0.7.3 16/12/2020
- 拿掉 copy 功能；因功能雞肋且為它需要調用一個 lib

v0.7.2 31/10/2020
- 適用Edit文字的情況

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

window.ChinaMapHelper = {
	BUTTONS: [
		{ name:"intel", fn:"get_intel_link" },
		{ name:"百度", fn:"get_baidu_link" },
		{ name:"腾讯", fn:"get_tencent_link" },
		{ name:"高德", fn:"get_autonavi_link" },
		{ name:"OSM", fn:"get_OSM_link" },
		{ name:"百/腾", fn:"get_BaiduQQ_link" },
		{ name:"百/腾/高", fn:"get_BTA_link" },
		{ name:"百/腾/高/OSM+", fn:"get_BTAO_link" },
	],

	loadSettings(){
		let defaultVal = {buttonsToShow:["intel","百度","腾讯","高德","OSM","百/腾"]};
		let settings = localStorage.getItem( "OPRChinaMapHelperSettings" );
		if( settings ){
			this.settings = JSON.parse(settings);
		}else{
			this.settings =  defaultVal;
		}
	},

	saveSettings(){
		localStorage.setItem( "OPRChinaMapHelperSettings", JSON.stringify(this.settings) );
	},
	
	updateButtonsDisplay(){
		let buttonsToShow = this.settings.buttonsToShow;
		var css = "";
	
		this.BUTTONS.forEach( (b,i)=>{
			let show = buttonsToShow.includes( b.name );
	
			css += `
.ChinaMapHelper .mapHelperButton:nth-child(${i+2}) {
	display: ${show?"inline-block":"none"};
}

.mapHelperEditMode	.ChinaMapHelper .mapHelperButton:nth-child(${i+2}) .checkbox:after {
	content: "${show?"☑":"☐"}";
}
			`;
		});
	
		var node = document.createElement('style');
		node.appendChild(document.createTextNode(css));
		document.getElementsByTagName('head')[0].appendChild(node);
	},

	toggleButtonShow( index ){
		let name = this.BUTTONS[index].name;
		let buttonsToShow = this.settings.buttonsToShow;

		if( buttonsToShow.includes( name ) ){
			this.settings.buttonsToShow = buttonsToShow.filter( n=>n!=name );
		}else{
			buttonsToShow.push( name );
		}
		this.saveSettings();
		this.updateButtonsDisplay();
	},
};

function LinkInfo(portalInfo){
	this.lng = portalInfo.lng;
	this.lat = portalInfo.lat;
	this.title = portalInfo.title;
	this.otherLocations = portalInfo.otherLocations || [];
}

LinkInfo.prototype. genButtons = function(){
	let html = `<a class='button-secondary button-settings'
		onclick='document.body.classList.toggle("mapHelperEditMode");'
		>+</a>`;

	ChinaMapHelper.BUTTONS.forEach( (b,i)=>{
		html += `<a class='mapHelperButton button-secondary button-map' target='mapHelper1'	href='${this[b.fn]()}'>
			<span class="checkbox" onclick="
				event.stopPropagation();
				event.preventDefault();
				window.ChinaMapHelper.toggleButtonShow(${i});
				return false;
				"></span>
		${b.name}</a>`;
	} );

	return html;
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
	let subCtrl, pageData;
	try {
		subCtrl = angular.element(document.getElementById('ReviewController')).scope().reviewCtrl;
		pageData = subCtrl.pageData;
		pageData.imageUrl; // test
		clearInterval(timer_waitInfo);
	} catch(e) {
		return;
	}
	// info OK

	if( ["NEW","PHOTO"].includes(subCtrl.reviewType) ) {
		let linkInfo1 = new LinkInfo(pageData);
		var div = document.createElement('div');
		div.className = "ChinaMapHelper";
		div.innerHTML = linkInfo1.genButtons();

		if( subCtrl.reviewType=="NEW"){
			document.querySelector("#map-card .card__footer").prepend(div);
			document.querySelector("#descriptionDiv").prepend( div.cloneNode(true) );
		}else{
			document.querySelector(".review-photo-upload").prepend(div);
		}

	} else {
	  //subCtrl.reviewType==='EDIT'
		//pageData.titleEdits;
		//pageData.locationEdits;
		//pageData.descriptionEdits;
		
		var table = document.createElement("TABLE");
		table.classList.add( "multiPointsTable" );
		var tr = table.insertRow();

		for(var i=0; i<pageData.locationEdits.length; i++){
			var p = pageData.locationEdits[i];
			var otherLocations = pageData.locationEdits.slice(0);
			otherLocations.splice(i,1);
			let linkInfo1 = new LinkInfo({
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

	ChinaMapHelper.loadSettings();
	ChinaMapHelper.updateButtonsDisplay();

	var css = `
	.ChinaMapHelper{
		display: inline-block;
	}
	.ChinaMapHelper .mapHelperButton,
	.ChinaMapHelper .button-settings{
		display: inline-block; 
		min-width: auto; 
		padding: 7px 6px; 
		margin-right: 5px; 
		margin-top: 5px;
		margin-bottom: 5px;
		color:black;
	}
	
	.mapHelperEditMode .ChinaMapHelper .mapHelperButton{
		display: inline-block !important;
		padding-left: 0px;
	}

	.mapHelperEditMode .ChinaMapHelper .mapHelperButton{
		display: inline-block !important;
		padding-left: 0px;
	}

	.ChinaMapHelper .checkbox{
		display: none;
	}
	.mapHelperEditMode .ChinaMapHelper .checkbox{
		display: inline;
	}

	.mapHelperEditMode .ChinaMapHelper .checkbox:after {
		padding: 0.7em;
		margin: 0;
		background-color: #00000033;
	}

	.multiPointsTable{
		width: 100%;
	}
	`;
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
