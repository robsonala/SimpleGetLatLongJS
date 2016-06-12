/**
 * @author Robson Alviani
 * @version 0.0.1
 */
'use strict';

var LatLng = function(options){
	if (typeof options == "undefined")
		options = {};

	this.options = options;

	this.data = {
		zipcode: null,
		status: null,
		coord: {
			lat: null,
			lng: null
		}
	};
};

LatLng.prototype.setZipcode = function(zipcode){
	this.data.zipcode = zipcode.toString().replace(/\D/gi, "");

	return this;
};

LatLng.prototype.setStatus = function(status){
	this.data.status = status;

	return this;
};

LatLng.prototype.setCoord = function(lat, lng){
	this.data.coord = {
		lat: lat,
		lng: lng
	};

	return this;
};

LatLng.prototype.get = function(zipcode, fnCall){
	var _this = this,
		zipcode = zipcode || null,
		fnCall = fnCall || function(){},
        arrFn = [];

    arrFn = [
        'google',
        'bing',
        'mapquest'
    ];

	_this.setZipcode(zipcode);

    var fnRecursive = function(item){
        if (item == undefined){
            fnCall.call(_this, false);
            return !1;
        }

        _this[item].get.call(_this,
            function(success){
                if (success)
                    fnCall.call(_this, data);
                else
                    fnRecursive.call(_this, arrFn.shift());
            }
        );
    };

    fnRecursive.call(_this, arrFn.shift());
    return;
};

LatLng.prototype.google = { // 2.500 per day
	url: "http://maps.googleapis.com/maps/api/geocode/json?sensor=false&region=br&address=",
	get: function(fnCall){
		var _this = this,
			fnCall = fnCall || function(){};

        window.app.loader.on();
        window.app.ajax((_this.google.url + _this.data.zipcode + ' Brasil'),{
            type: "get",
            dataType: "json",
            success: function(data){
            	switch (data.status){
            		case "OK":
            			_this.setStatus("success");
            			_this.setCoord(data.results[0].geometry.location.lat, data.results[0].geometry.location.lng);

            			fnCall.call(_this, true);
            			break;
            		
            		case "ZERO_RESULTS":
            		case "INVALID_REQUEST":
            		case "UNKNOWN_ERROR":
            			_this.setStatus("invalid");

            			fnCall.call(_this, true);
            			break;
            		
            		case "OVER_QUERY_LIMIT":
            		case "REQUEST_DENIED":
            		default:
            			_this.setStatus("try");

            			fnCall.call(_this, false);
            			break;
            	}
            },
            error: function(data){
                console.info(data);
            	_this.setStatus("try");

            	fnCall.call(_this, false);
            },
            complete: function(){
                window.app.loader.off();
            }
        });
	}
};

LatLng.prototype.mapquest = { //15.000 per day
	url: "http://www.mapquestapi.com/geocoding/v1/address?key=[YOUR KEY HERE]&maxResults=1&location=",
	get: function(fnCall){
		var _this = this,
			fnCall = fnCall || function(){};

        window.app.loader.on();
        window.app.ajax((_this.mapquest.url + _this.data.zipcode + ' Brasil'),{
            type: "get",
            dataType: "json",
            success: function(data){
            	if (!data.info || data.info.statuscode !== 0){
            		_this.setStatus("try");
            		fnCall.call(_this, false);

            		return;
            	}

            	if (data.results.length > 0){
        			_this.setStatus("success");
        			_this.setCoord(data.results[0].locations[0].latLng.lat, data.results[0].locations[0].latLng.lng);

        			fnCall.call(_this, true);
            	} else {
        			_this.setStatus("invalid");
        			fnCall.call(_this, false);
            	}
            },
            error: function(data){
                console.info(data);

            	_this.setStatus("try");
            	fnCall.call(_this, false);
            },
            complete: function(){
                window.app.loader.off();
            }
        });
	}
};

LatLng.prototype.bing = { //?? per day
	url: "http://dev.virtualearth.net/REST/v1/Locations?o=json&maxResults=1&key=[YOUR KEY HERE]&q=",
	get: function(fnCall){
		var _this = this,
			fnCall = fnCall || function(){};

        window.app.loader.on();
        window.app.ajax((_this.bing.url + _this.data.zipcode + ' Brasil'),{
            type: "get",
	        dataType: "jsonp",
	        jsonp: "jsonp",
            success: function(data){
            	if (!data.statusCode || data.statusCode != 200){
            		_this.setStatus("try");
            		fnCall.call(_this, false);

            		return;
            	}

            	if (data.resourceSets.length > 0){
            		_this.setStatus("success");
        			_this.setCoord(data.resourceSets[0].resources[0].point.coordinates[0], data.resourceSets[0].resources[0].point.coordinates[1]);
        
        			fnCall.call(_this, true);
            	} else {
        			_this.setStatus("invalid");
        			fnCall.call(_this, false);
            	}
            },
            error: function(data){
                console.info(data);

            	_this.setStatus("try");
            	fnCall.call(_this, false);
            },
            complete: function(){
                window.app.loader.off();
            }
        });
	}
};
