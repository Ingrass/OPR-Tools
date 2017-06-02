// ==UserScript==
// @name         OPR China Map Helper
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Add some buttons for China map in OPR
// @author       Ethern Triomphe346 记忆的残骸
// @match        https://opr.ingress.com/recon
// @grant        none
// ==/UserScript==
(function () {
    //constants
    var x_PI = 3.14159265358979324 * 3000.0 / 180.0;
    var PI = 3.1415926535897932384626;
    var a = 6378245.0;
    var ee = 0.00669342162296594323;

    //global var
    var name;
    var postion;

    function transform_lat(lng, lat) {
        var lat = +lat;
        var lng = +lng;
        var ret = -100.0 + 2.0 * lng + 3.0 * lat + 0.2 * lat * lat + 0.1 * lng * lat + 0.2 * Math.sqrt(Math.abs(lng));
        ret += (20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) * 2.0 / 3.0;
        ret += (20.0 * Math.sin(lat * PI) + 40.0 * Math.sin(lat / 3.0 * PI)) * 2.0 / 3.0;
        ret += (160.0 * Math.sin(lat / 12.0 * PI) + 320 * Math.sin(lat * PI / 30.0)) * 2.0 / 3.0;
        return ret;
    }

    function transform_lng(lng, lat) {
        var lat = +lat;
        var lng = +lng;
        var ret = 300.0 + lng + 2.0 * lat + 0.1 * lng * lng + 0.1 * lng * lat + 0.1 * Math.sqrt(Math.abs(lng));
        ret += (20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) * 2.0 / 3.0;
        ret += (20.0 * Math.sin(lng * PI) + 40.0 * Math.sin(lng / 3.0 * PI)) * 2.0 / 3.0;
        ret += (150.0 * Math.sin(lng / 12.0 * PI) + 300.0 * Math.sin(lng / 30.0 * PI)) * 2.0 / 3.0;
        return ret;
    }

    function out_of_china(lng, lat) {
        var lat = +lat;
        var lng = +lng;
        // 纬度3.86~53.55,经度73.66~135.05
        return !(lng > 73.66 && lng < 135.05 && lat > 3.86 && lat < 53.55);
    }

    /**
     * WGS84转GCj02
     * @param lng
     * @param lat
     * @returns {*[]}
     */
    function wgs84togcj02(lng, lat) {
        var lat = +lat;
        var lng = +lng;
        if (out_of_china(lng, lat)) {
            return [lng, lat];
        } else {
            var dlat = transform_lat(lng - 105.0, lat - 35.0);
            var dlng = transform_lng(lng - 105.0, lat - 35.0);
            var radlat = lat / 180.0 * PI;
            var magic = Math.sin(radlat);
            magic = 1 - ee * magic * magic;
            var sqrtmagic = Math.sqrt(magic);
            dlat = (dlat * 180.0) / ((a * (1 - ee)) / (magic * sqrtmagic) * PI);
            dlng = (dlng * 180.0) / (a / sqrtmagic * Math.cos(radlat) * PI);
            var mglat = lat + dlat;
            var mglng = lng + dlng;
            return [mglng, mglat];
        }
    }

    /**
     * 火星坐标系 (GCJ-02) 到百度坐标系 (BD-09) 的转换
     * @param lng
     * @param lat
     * @returns {*[]}
     */
    function gcj02tobd09(lng, lat) {
        var lat = +lat;
        var lng = +lng;
        var z = Math.sqrt(lng * lng + lat * lat) + 0.00002 * Math.sin(lat * x_PI);
        var theta = Math.atan2(lat, lng) + 0.000003 * Math.cos(lng * x_PI);
        var bd_lng = z * Math.cos(theta) + 0.0065;
        var bd_lat = z * Math.sin(theta) + 0.006;
        return [bd_lng, bd_lat];
    }

    function get_portal_info() {
        var name = target.getElementsByTagName('a')[0].innerHTML;
        var position = target.getElementsByTagName('a')[1].getAttribute("href");
        name = /^\s*(.*)\s*$/.exec(name)[1];
        if (position.indexOf("www.ingress.com/intel?ll=") >= 0) {
            position = /=(.*)$/.exec(position)[1];
            var end = position.indexOf("&z=20");
            if (end >= 0) {
                position = position.substring(0, end);
            }
        } else {
            position = /@(.*)$/.exec(position)[1];
        }
        return [name, position];
    }

    function goto_intel_map() {
        var portal_info = get_portal_info();
        var position = portal_info[1];
        var href = "https://www.ingress.com/intel?ll=" + position + "&z=20";
        window.open(href, "Intel");
    }

    function goto_tencent_map() {
        var portal_info = get_portal_info();
        var name = portal_info[0];
        var position = portal_info[1];
        var wgs_lat = position.split(",")[0];
        var wgs_lng = position.split(",")[1];
        var gcj = wgs84togcj02(wgs_lng, wgs_lat);
        var href = "http://map.qq.com/?type=marker&isopeninfowin=1&markertype=1&name=" + name + "&addr=" + position + "&pointy=" + gcj[1] + "&pointx=" + gcj[0];
        window.open(href, "OPR_TecentMap");
    }

    function goto_baidu_map() {
        var portal_info = get_portal_info();
        var name = portal_info[0];
        var position = portal_info[1];
        var wgs_lat = position.split(",")[0];
        var wgs_lng = position.split(",")[1];
        var href = "http://api.map.baidu.com/marker?location=" + wgs_lat + "," + wgs_lng + "&title=" + name + "&content=Application&output=html&coord_type=wgs84";
        window.open(href, "OPR_BaiduMap");
    }

    function goto_gaode_map() {
        var portal_info = get_portal_info();
        var name = portal_info[0];
        var position = portal_info[1];
        var wgs_lat = position.split(",")[0];
        var wgs_lng = position.split(",")[1];
        var href = "http://uri.amap.com/marker?position=" + wgs_lng + "," + wgs_lat + "&name=" + name + "&coordinate=wgs84&callnative=0";
        window.open(href, "OPR_GaodeMap");
    }

    function goto_OSM() {
        var portal_info = get_portal_info();
        // var name = portal_info[0];
        var position = portal_info[1];
        var wgs_lat = position.split(",")[0];
        var wgs_lng = position.split(",")[1];
        var href = "http://www.openstreetmap.org/search?query=" + wgs_lat + "," + wgs_lng + "#map=16/" + wgs_lat + "/" + wgs_lng;
        window.open(href, "OPR_OSM");
    }

    var target = document.getElementById("descriptionDiv");
    target.appendChild(document.createElement("br"));
    target.appendChild(document.createElement("br"));

    //Ingress Intel Button
    var intel_map_button = document.createElement("button");
    var textnode = document.createTextNode("Intel");
    intel_map_button.className += "button";
    intel_map_button.onclick = goto_intel_map;
    intel_map_button.appendChild(textnode);
    target.appendChild(intel_map_button);

    //Tencent Map Button
    var tencent_map_button = document.createElement("button");
    var textnode = document.createTextNode("Tencent Map");
    tencent_map_button.className += "button";
    tencent_map_button.onclick = goto_tencent_map;
    tencent_map_button.appendChild(textnode);
    target.appendChild(tencent_map_button);

    //Baidu Map Button
    var baidu_map_button = document.createElement("button");
    var textnode = document.createTextNode("Baidu Map");
    baidu_map_button.className += "button";
    baidu_map_button.onclick = goto_baidu_map;
    baidu_map_button.appendChild(textnode);
    target.appendChild(baidu_map_button);

    //Gaode Map Button
    var gaode_map_button = document.createElement("button");
    var textnode = document.createTextNode("Gaode Map");
    gaode_map_button.className += "button";
    gaode_map_button.onclick = goto_gaode_map;
    gaode_map_button.appendChild(textnode);
    target.appendChild(gaode_map_button);

    //OSM Button
    var OSM_button = document.createElement("button");
    var textnode = document.createTextNode("OSM");
    OSM_button.className += "button";
    OSM_button.onclick = goto_OSM;
    OSM_button.appendChild(textnode);
    target.appendChild(OSM_button);
})();