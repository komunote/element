"use strict";
window.dc = {};

function $(e) {
	if (this && this.el) {
		return this;
	} else {
		if(!e) {
			return {};
		} else {
			if (typeof e === "string") {
				if(e.indexOf('#')=== 0 || e.indexOf('.') > -1) {
					return  $.prototype.construct(document.getElementById(e.replace(/#/, '')));
				} else {
					var els = document.querySelectorAll(e),
					items = [];
					for(var i=0; i < els.length; i++) {
						items.push($.prototype.construct(els[i]));
					}
					return items;
				}
			} else {
				if(!e.hasOwnProperty('el')) {
					return  $.prototype.construct(e);
				}
				return e;
			}
		}
	}
};

$.prototype.construct = function(el) {
	return {
		el : el,
		addClass : $.prototype.addClass,
		removeClass : $.prototype.removeClass
	};
};

$.prototype.addClass = function(c) {
	if (this.el.classList) {
		this.el.classList.add(c);
	} else {
		this.el.className += ' ' + c;
	}
	return this;
};

$.prototype.removeClass = function(c) {
	if (this.el.classList) {
		this.el.classList.remove(c);
	} else {
		this.el.className = this.el.className.replace(new RegExp('(^|\\b)' + c.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
	}
	return this;
};

$.prototype.get = function(url, callback) {
	var request = new XMLHttpRequest();
	request.open('GET', url, true);

	request.onload = function() {
		if (request.status >= 200 && request.status < 400) {
			// Success!
			var data = JSON.parse(request.responseText);
			callback(data);
		} else {
			// We reached our target server, but it returned an error
		}
	};

	request.onerror = function() {
	// There was a connection error of some sort
		callback({message:"Erreur de téléchargement"});
	};

	request.send();
};

var onModalClick = function(e) {
	e.stopPropagation();
	var dataset = e.target.dataset.id ? e.target.dataset : e.target.parentNode.dataset,
		modal = document.getElementById(dataset.id),
		bg = modal.parentNode;

	$(document.body).addClass('stop-scrolling');
	$(modal).removeClass('dc-modal').addClass('dc-modal-show');
	$(bg).removeClass('dc-modal-bg').addClass('dc-modal-bg-show');

	if(dataset.closeable !== "false") {
		var btn = document.createElement('button'),
			div = document.createElement('div');
		$(div).addClass('text-right');
		btn.setAttribute('type','button');
		$(btn).addClass('btn').addClass('btn-danger').addClass('btn-lg')
			.addClass('dc-modal-close-click').addClass('glyphicon')
			.addClass('glyphicon-remove');
		div.appendChild(btn);
		modal.insertBefore(div, modal.firstChild);

		btn.addEventListener('click', onModalClose);		
		bg.removeEventListener('click', onModalBgClose);
		bg.addEventListener('click', onModalBgClose, false);
	}
};

var onModalClose = function(e) {
	e.stopPropagation();

	var modal = e.target.parentNode.parentNode,
		bg = modal.parentNode;
	var closeBtns = modal.querySelectorAll('.glyphicon-remove');
	if (closeBtns.length > 0) {
		for(var i = 0; i < closeBtns.length; i++) {
			closeBtns[i].parentNode.parentNode.removeChild(closeBtns[i].parentNode);
		}
	}
	
	$(modal).addClass('dc-modal').removeClass('dc-modal-show');	
	$(bg).addClass('dc-modal-bg').removeClass('dc-modal-bg-show');

	if(document.querySelectorAll('.dc-modal-show').length < 1) {
		$(document.body).removeClass('stop-scrolling');
	}
};

var onModalBgClose = function(e) {
	e.stopPropagation();

	if(e.target.tagName !== 'DIV'){
		return;
	}

	var bg = e.target,
		modal = bg.querySelector('.dc-modal-show');
	var closeBtns = modal.querySelectorAll('.glyphicon-remove');
	if (closeBtns.length > 0) {
		for(var i = 0; i < closeBtns.length; i++) {
			closeBtns[i].parentNode.parentNode.removeChild(closeBtns[i].parentNode);
		}
	}

	$(modal).addClass('dc-modal').removeClass('dc-modal-show');
	$(bg).addClass('dc-modal-bg').removeClass('dc-modal-bg-show');
	if(document.querySelectorAll('.dc-modal-show').length < 1) {
		$(document.body).removeClass('stop-scrolling');
	}
	bg.removeEventListener('click', onModalBgClose);
};

// modal section
var modalsOnClick = document.querySelectorAll('.dc-modal-click');
for (var i=0; i < modalsOnClick.length; i++) {
	modalsOnClick[i].addEventListener('click', onModalClick);
}

var modalsOnClose = document.querySelectorAll('.dc-modal-close-click');
for (var i=0; i < modalsOnClose.length; i++) {
	modalsOnClose[i].addEventListener('click', onModalClose);
}

window.dc.geoloc = {
	callback : null,

	init : function(callback) {
		this.callback = callback;
		var that = this;
		if(navigator) {
			navigator.geolocation.getCurrentPosition(
				function(pos){return that.onSuccess(pos);},
				function(error){return that.onError(error);},
				{enableHighAccuracy: true, timeout: 10000, maximumAge: 600000}
			);
		} else {
			this.callback(null);
		}
	},

	search : function(results, name) {
		if (results && results.length > 0) {
			var k = 0;
			for (var j = 0; j < results.length; j++){
				if (results[j].types[0] == name) {
					k = j;
					break;
				}
			}
			return results[k];
		} else {
			return null;
		}
	},

	onSuccess : function(pos) {
		if (!window.google || !window.google.maps) {
			return this.callback({
				latitude: pos.coords.latitude,
				longitude: pos.coords.longitude,
				country: null,
				state: null,
				city: null,
				postalcode: null
			});
		}
		var that = this,
			geocoder = new window.google.maps.Geocoder(),
			//44.0108578,4.8794943 sorgues john
			latlng = new window.google.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
			//reverse geocode the coordinates, returning location information.
			geocoder.geocode({'latLng': latlng}, function (results, status) {
				var result = results[0];

				if (status == window.google.maps.GeocoderStatus.OK && results.length) {
					var results = result.address_components,
						city = that.search(results, "locality").long_name,
						country = that.search(results, "country").long_name,
						postalcode = that.search(results, "postal_code"),
						dept_number = that.search(results, "administrative_area_level_2");
					dept_number = (dept_number === null) ? null : dept_number.short_name;

					var state = that.search(results, "administrative_area_level_1");
					state = (state === null) ? null : state.long_name;

					return that.callback({
						latitude: pos.coords.latitude,
						longitude: pos.coords.longitude,
						country: country,
						state: state,
						city: city,
						postalcode: (postalcode !== null) ? postalcode.long_name : null
					});

				} else {
					return that.callback({
						latitude: pos.coords.latitude,
						longitude: pos.coords.longitude,
						country: null,
						state: null,
						city: null,
						postalcode: null
					});
				}
		});
	},

	onError : function(error, pos) {
		switch (error.code) {
			case error.PERMISSION_DENIED:
				alert("#geolocalisation-enabled", {onClose: function () {
						window.localStorage.clear();
						window.sessionStorage.clear();
						window.location.assign('https://www.autour2vous.com/logout');
					}
				});
				break;
			case error.POSITION_UNAVAILABLE:
				break;
			case error.TIMEOUT:
				break;
			case 2: // no internet access

		}

		return window.dc.geoloc.callback(null);
	}

};

window.dc.geoloc.init(function(loc) {
	var form = document.getElementById("login-form");
	if(loc) {
		if(form) {
			form.querySelector('button[type=submit]').removeAttribute('disabled');
			form.querySelector("#location>span").innerHTML = loc.city + ' ('+loc.latitude
				+' : ' + loc.longitude + ')';
		}

	} else {
		form.querySelector("#location>span").innerHTML = 'pas de connexion Internet';
	}
});