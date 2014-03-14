var VIPBiteAPI = VIPBiteAPI || {};

VIPBiteAPI = function($, window, document) {

	function registerNewUser()
	{
		alert("REGISTERUSER");
	};

	function renewUser()
	{
		alert("RENEW USER");
	};

	function initializeGM()
	{
		var map_canvas = document.getElementById('VIPBite_GoogleMap');
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
		map.controls[google.maps.ControlPosition.TOP_CENTER].push(searchMapDiv);
	};

	function checkIsRenewOrRegister()
	{
		var isLogin = JSON.parse(sessionStorage.getItem("UserLoginId"));

		if(isLogin)
		{
			$("#VIPBite_RegisterHeader").html("Renewal");
			$("#firstName").val(isLogin.firstName);
			$("#lastName").val(isLogin.lastName);
			$("#email").val(isLogin.login);
		}
		else
		{
			$("#VIPBite_RegisterHeader").html("Renewal");
		}
	};

	function checkIsUserLogIn()
	{
		var isLogin = JSON.parse(sessionStorage.getItem("UserLoginId"));

		if(!isLogin)
		{
			$("#VIPBite_LoginForm").show();
			$("#VIPBite_ValidUser").hide();
			$("#VIPBite_ExpiredUser").hide();
		}
		else
		{
			$("#VIPBite_ValidUserName").html(isLogin.firstName + "&nbsp"+ isLogin.lastName);
			$("#VIPBite_UserExpDate").html(isLogin.expDate);

			if(new Date(isLogin.expDate) > new Date())
			{
					$("#VIPBite_LoginForm").hide();
					$("#VIPBite_ValidUser").show();
					$("#VIPBite_ExpiredUser").hide();
			}
			else
			{
				$("#VIPBite_LoginForm").hide();
				$("#VIPBite_ExpiredUser").show();
				$("#VIPBite_ValidUser").hide();
			}
		}
	};

	function requestLogin()
	{
		$.ajax({
			url: "http://localhost:3000/mobile/login",
			type: "POST",
			dataType: "JSONP",
			data: {username: $("#VIPBite_LoginUserName").val(), password: $("#VIPBite_LoginPwd").val()},
			success: function(data) {
				sessionStorage.setItem('UserLoginId', JSON.stringify(data.respond));
				checkIsUserLogIn();
			},
		});
	};

	function browseRestaurant()
	{
		$("#VIPBite_BrowseResult").html("");

		$.ajax({
			type: "POST",
			url: "http://localhost:3000/mobile/browse",
			dataType: "JSONP",
			async: false,
			data: {browseby: $("#VIPBite_BrowseInput").val()},
			success: function(data) {
				sessionStorage.setItem('RestaurantList', JSON.stringify(data.response));
				sessionStorage.setItem('ImageLink', data.originalUri);

				for(var i = 0; i < data.response.length; i++)
				{ generateSearchResult(data.response[i], data.originalUri); }
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
			url: "http://localhost:3000/mobile/map",
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
			url: "http://localhost:3000/mobile/restaurantInfo",
			dataType: "JSONP",
			data: { restaurantName: getInfo},
			success: function(data) {
				if(data.response)
				{
					var imageLink = sessionStorage.getItem('ImageLink');

					for(var i = 0; i < data.images.length; i++)
					{
						var liElement = document.createElement("li");
						var hrefElement = document.createElement("a");
						var imgElement = document.createElement("img");
						hrefElement.setAttribute('href', (imageLink + data.images[i]));
						imgElement.setAttribute('src', (imageLink + data.images[i]));
						imgElement.setAttribute('alt', "Gallery");

						hrefElement.appendChild(imgElement);
						liElement.appendChild(hrefElement);

						$("#VIPBite_RestaurantGallery").append(liElement);
					};

					$("#VIPBite_RestaurantName").html(data.overview.restaurantname);
					$("#VIPBite_DealContent").html(data.info.promo + data.info.promoDetail);
					$("#VIPBite_UrbanspoonContent").html(data.info.urbanspoonreview);
					$("#VIPBite_CuisineType").html(data.overview.tags);
					$("#VIPBite_RestaurantDescription").html(data.info.comment);
					$("#VIPBite_PhoneNumber").html(data.overview.phone);
					$("#VIPBite_OperatingHour").html(data.info.operatinghour);
					$("#VIPBite_RestaurantAddress").html(data.overview.address);
					$("#VIPBite_ReservationInfo").html(data.info.reservation);

					document.getElementById("VIPBite_LogoImg").src = (imageLink + "/restaurant_logo/" + data.overview.imageUrl);
				}
			}
		});
	};

	//PRIVATE FUNCTION
	function mapsearchControl(controlDiv, map)
	{
		var controlUI = document.createElement('div');
		var controlText = document.createElement('div');

		controlText.style.fontFamily = 'Arial,sans-serif';
		controlText.style.fontSize = '12px';
		controlText.style.paddingLeft = '4px';
		controlText.style.paddingRight = '4px';
		controlText.innerHTML = '<b>Search</b>';

		controlUI.style.backgroundColor = 'white';
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
		hrefElement.setAttribute('href', "javascript:VIPBiteAPI.SelectRestaurant('"+content.restaurantname+"')");
		hrefElement.setAttribute('class', 'list-group-item');

		var strContent =	"<div class='fLeft'><img src='"
											+ imgurl + "/restaurant_logo/" + content.imageUrl
											+ "'class='searchImg'/></div>"
											+ "<div class='fLeft'>"
											+ "<h3 id='restName' class='list-group-item-heading'>"
											+ content.restaurantname + "</h3>"
											+ "<p class='list-group-item-text'>"
											+ "<span class='italic'>"
											+ content.tags
											+ "</span><br /> <span class='address'>"
											+ content.address
											+ "</span><br /><div class='special'> <span class='vipLabel'>"
											+ "<i class='fa fa-cutlery'> </i> VIPbite Deal: </span>"
											+ "Two For One Pizzas Every Friday morning"
											+ "</div> </p> </div> </a>";
		hrefElement.innerHTML = strContent;

		$("#VIPBite_BrowseResult").append(hrefElement);
	};

	function generateMapSearchResult(content)
	{
		var hrefElement = document.createElement("a");
		hrefElement.setAttribute('href', "javascript:VIPBiteAPI.SelectRestaurant('"+content.restaurantname+"')");
		hrefElement.innerHTML = content.restaurantname;

		var divElement = document.createElement("div")
		divElement.appendChild(hrefElement);

		var myLatLng = new google.maps.LatLng(content.latitude,content.longitude);
		var infowindow = new google.maps.InfoWindow({ content: divElement });
		var marker = new google.maps.Marker({
											position: myLatLng,
											map: map,
											title: 'Uluru (Ayers Rock)'});
		google.maps.event.addListener(marker, 'click', function() { infowindow.open(map,marker); });
	};

	return {
		RegisterNewUser : registerNewUser,
		RenewUser : renewUser,
		GetRestaurantInfo : getRestaurantInfo,
		CheckInRenewOrRegister : checkIsRenewOrRegister,
		CheckIsUserLogIn : checkIsUserLogIn,
		BrowseRestaurant : browseRestaurant,
		BrowseByMap : browseByMap,
		RequestLogin : requestLogin,
		SelectRestaurant : selectRestaurant,
		InitializeGM : initializeGM
	}

}(jQuery, window, document);