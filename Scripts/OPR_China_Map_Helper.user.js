// ==UserScript==
// @name         OPR China Map Helper
// @version      0.4.4
// @category     Info
// @namespace    https://github.com/Ingrass/OPR-Tools/
// @updateURL    http://ethern.me/ingress/OPR_China_Map_Helper.user.js
// @downloadURL  http://ethern.me/ingress/OPR_China_Map_Helper.user.js
// @description  Add some buttons for China map in OPR
// @author       Ethern Triomphe346 19John 记忆的残骸 stdssr
// @match        https://opr.ingress.com/recon
// @grant        none
// @require      https://cdn.jsdelivr.net/clipboard.js/1.6.1/clipboard.min.js
// ==/UserScript==

(function() {
    //constants
    var x_PI = 3.14159265358979324 * 3000.0 / 180.0;
    var PI = 3.1415926535897932384626;
    var a = 6378245.0;
    var ee = 0.00669342162296594323;

    //global var
    var name;
    var postion;
    var description;

    function transform_lat(lng, lat) {
        var lat1 = +lat;
        var lng1 = +lng;
        var ret = -100.0 + 2.0 * lng1 + 3.0 * lat1 + 0.2 * lat1 * lat1 + 0.1 * lng1 * lat1 + 0.2 * Math.sqrt(Math.abs(lng1));
        ret += (20.0 * Math.sin(6.0 * lng1 * PI) + 20.0 * Math.sin(2.0 * lng1 * PI)) * 2.0 / 3.0;
        ret += (20.0 * Math.sin(lat1 * PI) + 40.0 * Math.sin(lat1 / 3.0 * PI)) * 2.0 / 3.0;
        ret += (160.0 * Math.sin(lat1 / 12.0 * PI) + 320 * Math.sin(lat1 * PI / 30.0)) * 2.0 / 3.0;
        return ret;
    }

    function transform_lng(lng, lat) {
        var lat1 = +lat;
        var lng1 = +lng;
        var ret = 300.0 + lng1 + 2.0 * lat1 + 0.1 * lng1 * lng1 + 0.1 * lng1 * lat1 + 0.1 * Math.sqrt(Math.abs(lng1));
        ret += (20.0 * Math.sin(6.0 * lng1 * PI) + 20.0 * Math.sin(2.0 * lng1 * PI)) * 2.0 / 3.0;
        ret += (20.0 * Math.sin(lng1 * PI) + 40.0 * Math.sin(lng1 / 3.0 * PI)) * 2.0 / 3.0;
        ret += (150.0 * Math.sin(lng1 / 12.0 * PI) + 300.0 * Math.sin(lng1 / 30.0 * PI)) * 2.0 / 3.0;
        return ret;
    }

    function out_of_china(lng, lat) {
        var lat1 = +lat;
        var lng1 = +lng;
        // 纬度3.86~53.55,经度73.66~135.05
        return !(lng1 > 73.66 && lng1 < 135.05 && lat1 > 3.86 && lat1 < 53.55);
    }

    /**
     * WGS-84 to 火星坐标系(GCJ-02)
     * @param lng
     * @param lat
     * @returns {*[]}
     */
    function wgs84togcj02(lng, lat) {
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
    }

    /**
     * 火星坐标系(GCJ-02) to 百度坐标系(BD-09) 的转换
     * @param lng
     * @param lat
     * @returns {*[]}
     */
    function gcj02tobd09(lng, lat) {
        var lat1 = +lat;
        var lng1 = +lng;
        var z = Math.sqrt(lng1 * lng1 + lat1 * lat1) + 0.00002 * Math.sin(lat1 * x_PI);
        var theta = Math.atan2(lat1, lng1) + 0.000003 * Math.cos(lng1 * x_PI);
        var bd_lng = z * Math.cos(theta) + 0.0065;
        var bd_lat = z * Math.sin(theta) + 0.006;
        return [bd_lng, bd_lat];
    }

    function get_portal_info() {
        var name = target.getElementsByTagName('a')[0].innerHTML;
        var position = target.getElementsByTagName('a')[1].getAttribute("href");
        // var description = target.getElementsByTagName('a')[2].get
        name = /^\s*(.*)\s*$/.exec(name)[1];
        position = /@(.*)$/.exec(position)[1];
        //TODO: to be verified
        // if (position.indexOf("www.ingress.com/intel?ll=") >= 0) {
        //     position = /=(.*)$/.exec(position)[1];
        //     var end = position.indexOf("&z=20");
        //     if (end >= 0) {
        //         position = position.substring(0, end);
        //     }
        // } else {
        //     position = /@(.*)$/.exec(position)[1];
        // }
        return [name, position];
    }

    function get_image_link() {
        var img = document.getElementsByClassName("center-cropped-img")[0];
        return img.getAttribute("src");
    }

    function get_tencent_link() {
        var portal_info = get_portal_info();
        var name = portal_info[0];
        var position = portal_info[1];
        var wgs_lat = position.split(",")[0];
        var wgs_lng = position.split(",")[1];
        var gcj = wgs84togcj02(wgs_lng, wgs_lat);
        return "http://map.qq.com/?type=marker&isopeninfowin=1&markertype=1&name=" + name + "&addr=" + position + "&pointy=" + gcj[1] + "&pointx=" + gcj[0];
    }

    function goto_tencent_map() {
        var href = get_tencent_link();
        window.open(href, "map");
    }

    function get_baidu_link() {
        var portal_info = get_portal_info();
        var name = portal_info[0];
        var position = portal_info[1];
        var wgs_lat = position.split(",")[0];
        var wgs_lng = position.split(",")[1];
        return "http://api.map.baidu.com/marker?location=" + wgs_lat + "," + wgs_lng + "&title=" + name + "&content=Application&output=html&coord_type=wgs84";
    }

    function goto_baidu_map() {
        var href = get_baidu_link();
        window.open(href, "map");
    }

    function get_OSM_link() {
        var portal_info = get_portal_info();
        // var name = portal_info[0];
        var position = portal_info[1];
        var wgs_lat = position.split(",")[0];
        var wgs_lng = position.split(",")[1];
        return "http://www.openstreetmap.org/?mlat=" + wgs_lat + "&mlon=" + wgs_lng + "#map=16/" + wgs_lat + "/" + wgs_lng;
    }

    function goto_OSM() {
        var href = get_OSM_link();
        window.open(href, "map");
    }

    //AutoNavi (高德地图)
    function get_autonavi_link() {
        var portal_info = get_portal_info();
        var name = portal_info[0];
        var position = portal_info[1];
        var wgs_lat = position.split(",")[0];
        var wgs_lng = position.split(",")[1];
        return "http://uri.amap.com/marker?position=" + wgs_lng + "," + wgs_lat + "&name=" + name + "&coordinate=wgs84&callnative=0";
    }

    function goto_autonavi_map() {
        href = get_autonavi_link();
        window.open(href, "map");
    }

    function get_intel_link() {
        var portal_info = get_portal_info();
        var position = portal_info[1];
        var wgs_lat = position.split(",")[0];
        var wgs_lng = position.split(",")[1];
        return "https://ingress.com/intel?z=16&ll=" + wgs_lat + "," + wgs_lng;
    }

    function goto_intel_map() {
        var href = get_intel_link();
        window.open(href, "map");
    }

    function get_multimap_link() {
        var portal_info = get_portal_info();
        // var name = portal_info[0];
        var position = portal_info[1];
        var wgs_lat = position.split(",")[0];
        var wgs_lng = position.split(",")[1];
        return "http://kitten-114.getforge.io/index.html#" + wgs_lng + "," + wgs_lat;
    }

    function goto_multimap() {
        var href = get_multimap_link();
        window.open(href, "map");
    }

    function get_clipboard() {
        var portal_info = get_portal_info();
        var result = "";
        result += "OPR Portal Candidate\n";
        result += "Title: " + portal_info[0] + "\n";
        result += "Image: " + get_image_link() + "=s0\n";
        result += "Baidu Map link: " + get_baidu_link() + "\n";
        return result;
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
    var textnode_Tencent = document.createTextNode("Tencent");
    tencent_map_button.className += "button";
    tencent_map_button.onclick = goto_tencent_map;
    tencent_map_button.appendChild(textnode_Tencent);
    target.appendChild(tencent_map_button);

    //Baidu Map Button
    var baidu_map_button = document.createElement("button");
    var textnode_Baidu = document.createTextNode("Baidu");
    baidu_map_button.className += "button";
    baidu_map_button.onclick = goto_baidu_map;
    baidu_map_button.appendChild(textnode_Baidu);
    target.appendChild(baidu_map_button);

    //AutoNavi Button
    var autonavi_button = document.createElement("button");
    var textnode_AutoNavi = document.createTextNode("AutoNavi");
    autonavi_button.className += "button";
    autonavi_button.onclick = goto_autonavi_map;
    autonavi_button.appendChild(textnode_AutoNavi);
    target.appendChild(autonavi_button);

    //OSM Button
    var OSM_button = document.createElement("button");
    var textnode_OSM = document.createTextNode("OSM");
    OSM_button.className += "button";
    OSM_button.onclick = goto_OSM;
    OSM_button.appendChild(textnode_OSM);
    target.appendChild(OSM_button);

    //Testing_multimaps Button
    var Multimap_button = document.createElement("button");
    var textnode_Tencent_Baidu = document.createTextNode("Tencent+Baidu");
    Multimap_button.className += "button";
    Multimap_button.onclick = goto_multimap;
    Multimap_button.appendChild(textnode_Tencent_Baidu);
    target.appendChild(Multimap_button);

    //margin
    target.appendChild(document.createElement("br"));
    target.appendChild(document.createElement("br"));

    //Copy portal info to clipboard Button
    var clipboard_button = document.createElement("button");
    var textnode_copy = document.createTextNode("Copy to Clipboard");
    clipboard_button.className += "button";
    clipboard_button.className += " clipbtn";
    clipboard_button.appendChild(textnode_copy);
    target.appendChild(clipboard_button);

    new Clipboard('.clipbtn', {
        text: function(trigger) {
            return get_clipboard();
        }
    });

})();