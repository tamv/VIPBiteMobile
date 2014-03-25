var VIPBiteAPI = VIPBiteAPI || {};

VIPBiteAPI = function($, window, document) {

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
		map.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(searchMapDiv);
		google.maps.event.trigger(map, "resize");
	};

	function registerNewUser()
	{
		var urlpart = $("#VIPBite_RegisterForm").serializeArray();
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
				$("#VIPBite_RegisterForm").hide();
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
		$("#VIPBite_RenewForm").serializeArray();

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
				$("#VIPBite_RenewForm").hide();
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
			url: "http://vipbite-deploy.herokuapp.com/mobile/login?method=post",
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
			url: "http://vipbite-deploy.herokuapp.com/mobile/browse",
			dataType: "JSONP",
			async: false,
			data: {browseby: $("#VIPBite_BrowseInput").val()},
			success: function(data) {
				sessionStorage.setItem('ImageLink', data.originalUri);

				for(var i = 0; i < data.response.length; i++)
				{
					generateSearchResult(data.response[i], data.originalUri);
					sessionStorage.setItem(data.response[i].name, JSON.stringify(data.response[i]));
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

					$("#VIPBite_RestaurantName").html(data.name);
					document.getElementById("VIPBite_LogoImg").src = (imageLink + "/image/restaurant logo/" + data.logo);

					for(var i = 0; i < data.images.length; i++)
					{
						var colElement = document.createElement("div");
						colElement.setAttribute('class', 'imgList');

						var divElement = document.createElement("div");
						divElement.setAttribute('class', 'imageItem');

						var hrefElement = document.createElement("a");
						var imgElement = document.createElement("img");
						hrefElement.setAttribute('href', (imageLink + data.images[i]));
						hrefElement.setAttribute('data-lightbox-gallery', "gallery1");
						hrefElement.setAttribute('class', 'imageGal');

						imgElement.setAttribute('src', (imageLink + data.images[i]));
						imgElement.setAttribute('height', '100%');
						imgElement.setAttribute('alt', "Gallery");

						hrefElement.appendChild(imgElement);
						divElement.appendChild(hrefElement);
						colElement.appendChild(divElement);

						$("#VIPBite_RestaurantGallery").append(colElement);
					};

					$("#VIPBite_DealContent").html(data.dealDetail);
					$("#VIPBite_UrbanspoonContent").html(data.rate);
					$("#VIPBite_CuisineType").html(data.cuisineType);
					$("#VIPBite_RestaurantDescription").html(data.comment);
					$("#VIPBite_PhoneNumber").html(data.phone);
					$("#VIPBite_ReservationInfo").html(data.reservation);
					for(var i = 0; i < data.hour.length; i++)
					{
						$("#VIPBite_OperatingHour").append(data.hour[i]);
						$("#VIPBite_OperatingHour").append('<br/>');
					}
					$("#VIPBite_RestaurantAddress").html(data.address.toString());
					$("#VIPBite_WebSite").html(data.web);

					$('.imageGal').nivoLightbox({ effect: 'fade' });
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
		hrefElement.setAttribute('href', "javascript:VIPBiteAPI.SelectRestaurant('"+content.name+"')");
		hrefElement.setAttribute('class', 'list-group-item');

		var strContent =	"<div class='fLeft'><img src='"
											+ imgurl + content.imageUrl
											+ "'class='searchImg'/></div>"
											+ "<div class='fLeft'>"
											+ "<h3 id='restName' class='list-group-item-heading'>"
											+ content.name + "</h3>"
											+ "<p class='list-group-item-text'>"
											+ "<span class='italic'>"
											+ content.cuisineType
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
		hrefElement.setAttribute('href', "javascript:VIPBiteAPI.SelectRestaurant('"+content.name+"')");
		hrefElement.innerHTML = content.name;

		var pElement = document.createElement("p");
		pElement.innerHTML = content.cuisineType;

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
		InitializeGM : initializeGM
	}

}(jQuery, window, document);