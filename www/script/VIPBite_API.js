var VIPbiteAPI = VIPbiteAPI || {};

VIPbiteAPI = function($, window, document) {

	function initializeGM()
	{
		var map_canvas = document.getElementById('VIPbite_GoogleMap');
		var searchMapDiv = document.createElement('div');

		var featureOpts = [{
		stylers: [	{ visibility: 'simplified' }, ] }, 
								{ elementType: 'labels', stylers: [ { visibility: 'off' } ] } ];

		var styledMapOptions = { name: 'VIPbite' };
		var customMapType = new google.maps.StyledMapType(featureOpts, styledMapOptions);

		var mapProperties = {
			center:new google.maps.LatLng(51.0500,-114.0667),
			zoom:13,
			panControl: false,
			zoomControl: false,
			mapTypeControl: false,
			scaleControl: true,
			streetViewControl: false,
			overviewMapControl: false,
			mapTypeControlOptions: { mapTypeIds: [google.maps.MapTypeId.ROADMAP, 'VIPbite'] },
			mapTypeId: 'VIPbite'
		};

		map = new google.maps.Map(map_canvas,mapProperties);
		map.mapTypes.set('VIPbite', customMapType);

		var searchMap = new mapsearchControl(searchMapDiv, map);
		searchMapDiv.index = 10;
		map.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(searchMapDiv);
		google.maps.event.trigger(map, "resize");
	};

	function registerNewUser()
	{
		var urlpart = $("#VIPbite_RegisterForm").serializeArray();
		var data = {}

		for (var i = 0; i < urlpart.length; i++) {
			data[urlpart[i].name] = urlpart[i].value;
		};

		$.ajax({
			url: "http://vipbite-deploy.herokuapp.com/mobile/register?method=post",
			type: "POST",
			dataType: "JSONP",
			data: data,
			success: function(data) {
				$("#VIPbite_RegisterForm").hide();
				$("#feedback_content").html(data.confirmation)

				if(data.response == "success")
				{ setTimeout(function() { window.location.href = "index.html"; }, 5000); }
				else
				{ setTimeout(function() { window.location.href = "register.html"; }, 7000); }
			},
		});
	};

	function renewUser()
	{
		var user = JSON.parse(sessionStorage.getItem("UserLoginId"));
		$("#VIPbite_RenewForm").serializeArray();

		var data = {}

		for (var i = 0; i < urlpart.length; i++) {
			data[urlpart[i].name] = urlpart[i].value;
		};

		data["id"] = user["userId"];

		$.ajax({
			url: "http://vipbite-deploy.herokuapp.com/mobile/renew?method=post",
			type: "POST",
			dataType: "JSONP",
			data: data,
			success: function(data) {
				$("#VIPbite_RenewForm").hide();
				$("#feedback_content").html(data.confirmation)

				if(data.response == "success")
				{ setTimeout(function() { window.location.href = "index.html"; }, 5000); }
				else
				{ setTimeout(function() { window.location.href = "renew.html"; }, 7000); }
			},
		});
	};

	function checkIsUserLogIn()
	{
		var isLogin = JSON.parse(sessionStorage.getItem("UserLoginId"));

		if(!isLogin)
		{
			$("#VIPbite_LoginForm").show();
			$("#VIPbite_ValidUser").hide();
			$("#VIPbite_ExpiredUser").hide();
		}
		else
		{
			$("#VIPbite_ValidUserName").html(isLogin.firstName + "&nbsp"+ isLogin.lastName);
			$("#VIPbite_UserExpDate").html(isLogin.expDate);

			if(new Date(isLogin.expDate) > new Date())
			{
					$("#VIPbite_LoginForm").hide();
					$("#VIPbite_ValidUser").show();
					$("#VIPbite_ExpiredUser").hide();
			}
			else
			{
				$("#VIPbite_LoginForm").hide();
				$("#VIPbite_ExpiredUser").show();
				$("#VIPbite_ValidUser").hide();
			}
		}
	};

	function requestLogin()
	{
		$.ajax({
			url: "http://vipbite-deploy.herokuapp.com/mobile/login?method=post",
			type: "POST",
			dataType: "JSONP",
			data: {username: $("#VIPbite_LoginUserName").val(), password: $("#VIPbite_LoginPwd").val()},
			success: function(data) {
				sessionStorage.setItem('UserLoginId', JSON.stringify(data.respond));
				checkIsUserLogIn();
			},
		});
	};

	function browseRestaurant(showOnMap)
	{
		$("#VIPbite_BrowseResult").html("");

		$.ajax({
			type: "POST",
			url: "http://vipbite-deploy.herokuapp.com/mobile/browse",
			dataType: "JSONP",
			async: false,
			data: {browseby: $("#VIPbite_BrowseInput").val()},
			success: function(data) {
				sessionStorage.setItem('ImageLink', data.originalUri);

				if(showOnMap == false)
				{
					for(var i = 0; i < data.response.length; i++)
					{
						generateSearchResult(data.response[i], data.originalUri);
						sessionStorage.setItem(data.response[i].name, JSON.stringify(data.response[i]));
					}
				}
				else
				{
					for(var i = 0; i < data.response.length; i++)
					{
						generateMapSearchResult(data.response[i]);
						sessionStorage.setItem(data.response[i].name, JSON.stringify(data.response[i]));
					}
				}
			}
		});

		return false;
	};

	function browseByMap()
	{
		var maxLat = map.getBounds().getNorthEast().lat();
		var maxLng = map.getBounds().getNorthEast().lng();
		var minLat = map.getBounds().getSouthWest().lat();
		var minLng = map.getBounds().getSouthWest().lng();

		$.ajax({
			type: "POST",
			url: "http://vipbite-deploy.herokuapp.com/mobile/map",
			dataType: "JSONP",
			async: false,
			data: { latitudeMax : maxLat,
							longitudeMax : maxLng,
							latitudeMin : minLat,
							longitudeMin : minLng },
			success: function(data) {
				sessionStorage.setItem('ImageLink', data.originalUri);
				for(var i = 0; i < data.response.length; i++)
				{
					generateMapSearchResult(data.response[i]);
				}
			}
		});
	};

	function selectRestaurant(restaurant)
	{
		sessionStorage.setItem('selectRestaurant', restaurant);
		window.location = "restaurant.html";
	};

	function getRestaurantInfo()
	{
		var getInfo = sessionStorage.getItem("selectRestaurant");

		$.ajax({
			type: "POST",
			url: "http://vipbite-deploy.herokuapp.com/mobile/restaurantInfo",
			dataType: "JSONP",
			data: { name: getInfo},
			success: function(data) {
				if(data.response)
				{
					var imageLink = data.imageUri;

					$("#VIPbite_RestaurantName").html(data.name);
					document.getElementById("VIPbite_LogoImg").src = (imageLink + "/image/restaurant logo/" + data.logo);

					for(var i = 0; i < data.images.length; i++)
					{
						var divElem = document.createElement("div");
						divElem.setAttribute('class', 'imageItem');

						var aElem = document.createElement("a");
						aElem.setAttribute('href', (imageLink + data.images[i]));
						aElem.setAttribute('data-lightbox-gallery', "gallery1");
						aElem.setAttribute('class', 'imageGal');

						var imgElem = document.createElement('img');
						imgElem.setAttribute('src', (imageLink + data.images[i]));
						imgElem.setAttribute('alt', (""));
						imgElem.setAttribute('align', 'middle');
						imgElem.setAttribute('height', '70px');
						
						aElem.appendChild(imgElem);
						divElem.appendChild(aElem);

						$("#VIPbiteGallary").append(divElem);
					};

					$("#VIPbite_DealContent").html(data.dealDetail);
					$("#VIPbite_UrbanspoonContent").html(data.rate);
					$("#VIPbite_CuisineType").html(data.cuisineType);
					$("#VIPbite_RestaurantDescription").html(data.comment);
					$("#VIPbite_PhoneNumber").html(data.phone);
					$("#VIPbite_ReservationInfo").html(data.reservation);
					for(var i = 0; i < data.hour.length; i++)
					{
						$("#VIPbite_OperatingHour").append(data.hour[i]);
						$("#VIPbite_OperatingHour").append('<br/>');
					}
					$("#VIPbite_RestaurantAddress").html(data.address.toString());
					$("#VIPbite_WebSite").html(data.web);

					$('.imageGal').nivoLightbox({ effect: 'fade' });
				}
			}
		});
	};

	function requestLogOut()
	{
		alert("lol-kk");
		sessionStorage.clear();
		location.replace("index.html");
	}

	//PRIVATE FUNCTION
	function mapsearchControl(controlDiv, map)
	{
		var controlUI = document.createElement('div');
		var controlText = document.createElement('div');

		controlText.style.fontFamily = 'Arial,sans-serif';
		controlText.style.fontSize = '10px';
		controlText.style.paddingLeft = '5px';
		controlText.style.paddingRight = '5px';
		controlText.innerHTML = '<b>Search</b>';

		controlUI.setAttribute('class', 'button');
		controlUI.style.borderStyle = 'solid';
		controlUI.style.borderWidth = '2px';
		controlUI.style.cursor = 'pointer';
		controlUI.style.textAlign = 'center';
		
		controlUI.appendChild(controlText);
		controlDiv.appendChild(controlUI);
		controlDiv.style.padding = '5px';

		google.maps.event.addDomListener(controlUI, 'click', browseByMap);
	}
	function initSessionStorage()
	{
		sessionStorage.setItem('UserLoginId', "");
		sessionStorage.setItem('selectRestaurant', "");
		sessionStorage.setItem('RestaurantList', "");
		sessionStorage.setItem('ImageLink', "");
	};

	function generateSearchResult(content, imgurl)
	{
		var hrefElement = document.createElement("a");
		hrefElement.setAttribute('href', "javascript:VIPbiteAPI.SelectRestaurant('"+content.name+"')");
		hrefElement.setAttribute('class', 'list-group-item');

		var strContent = "<div class='row'>"
											+"<div class='col-xs-2'><img src='" + imgurl + content.imageUrl + "'class='searchImg'/></div>"
											+ "<div class='col-xs-8 col-xs-push-1'>"
												+ "<h3 id='restName' class='list-group-item-heading'>"
												+ content.name + "</h3>"
												+ "<p class='list-group-item-text'>"
													+ "<span class='italic'>" + content.search + "</span><br />" 
													+ "<span class='address'>" + content.address + "</span><br />"
												+ "</p>"
											+ " </div>"
											+ "<div class='col-xs-12'>"
												+ "<div class='special'> <span class='vipLabel'>"
													+ "<i class='fa fa-cutlery'> </i> VIPbite Deal: </span>"
													+ "Two For One Pizzas Every Friday morning"
												+ "</div> "
											+ "</div>"
										+ "</div>";
		hrefElement.innerHTML = strContent;

		$("#VIPbite_BrowseResult").append(hrefElement);
	};

	function generateMapSearchResult(content)
	{
		var hrefElement = document.createElement("a");
		hrefElement.setAttribute('href', "javascript:VIPbiteAPI.SelectRestaurant('"+content.name+"')");
		hrefElement.innerHTML = content.name;

		var pElement = document.createElement("p");
		pElement.innerHTML = content.VIPBiteDeal;

		var divElement = document.createElement("div")
		divElement.appendChild(hrefElement);
		divElement.appendChild(pElement);

		var myLatLng = new google.maps.LatLng(content.latitude,content.longitude);
		var infowindow = new google.maps.InfoWindow({ content: divElement });
		var marker = new google.maps.Marker({
											position: myLatLng,
											map: map,
											title: 'Uluru (Ayers Rock)'});
		google.maps.event.addListener(marker, 'click', function() { infowindow.open(map,marker); });
	};

	return {
		GetRestaurantInfo : getRestaurantInfo,
		CheckIsUserLogIn : checkIsUserLogIn,
		BrowseRestaurant : browseRestaurant,
		BrowseByMap : browseByMap,
		RegisterNewUser : registerNewUser,
		RenewUser : renewUser,
		RequestLogin : requestLogin,
		SelectRestaurant : selectRestaurant,
		InitializeGM : initializeGM,
		RequestLogout : requestLogOut
	}

}(jQuery, window, document);