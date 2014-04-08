var apiUrl = "";
var map = null;

var userPosition = {};

var app = {
    // Application Constructor
    initialize: function () {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function () {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicity call 'app.receivedEvent(...);'
    onDeviceReady: function () {
        console.log("device ready");
        map = new google.maps.Map(document.getElementById('map-canvas'), {
            zoom: 12,
            center: new google.maps.LatLng(41.3906611, 2.171749)
        });
        navigator.geolocation.getCurrentPosition(app.onSuccess, app.onError);
        app.addClickListeners();
    },

    onSuccess: function (position) {

        userPosition.lat = position.coords.latitude;
        userPosition.lng = position.coords.longitude;

        var icon = {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 5
        };

        mapHelper.setMarker(userPosition.lat, userPosition.lng, icon);
        mapHelper.navigateToPoint(userPosition.lat, userPosition.lng);

        apiHelper.getCloseAnchors(userPosition.lat, userPosition.lng, app.onLocatedDataLoaded, function(error){});

    },
    onError: function () {
        alert('code: ' + error.code + '\n' +
            'message: ' + error.message + '\n');
    },
    onLocatedDataLoaded: function (data) {
        //will only run when we've got the user's position and internet.
        $('#floating-closest-anchor').text(data[0].name).data("lat", data[0].latitude).data("lng",data[0].longitude);

        for (var i = 0; i < data.length; i++) {
            var mark = mapHelper.setMarker(data[i].latitude, data[i].longitude);
            (function(marker){
                google.maps.event.addListener(marker, 'click', function(){
                    mapHelper.getNavigationRoute(new google.maps.LatLng(userPosition.lat,userPosition.lng), marker.getPosition());
                });
            })(mark);
        }
    },
    addClickListeners: function () {
        $('#floating-closest-anchor').on('click', function(){
            var data = $('#floating-closest-anchor').data();
            mapHelper.navigateToPoint(data.lat,data.lng);
        });
    }
};

var mapHelper = {
    directionsService: new google.maps.DirectionsService(),
    // directionsDisplay: new google.maps.DirectionsRenderer(),
    navigateToPoint: function (lat, lng) {
        var latlng = new google.maps.LatLng(lat, lng);
        map.panTo(latlng);
        map.setZoom(15);
    },
    setMarker: function (lat, lng, markerIcon) {
        var latlng = new google.maps.LatLng(lat, lng);
        var mark = new google.maps.Marker({
            position: latlng,
            map: map,
            icon: markerIcon
        });
        return mark;
    },
    getNavigationRoute: function(startLatLng, endLatLng){
        var request = {
            origin: startLatLng,
            destination: endLatLng,
            travelMode: google.maps.TravelMode["WALKING"]
        };
        var directionsDisplay = new google.maps.DirectionsRenderer();
        directionsDisplay.setMap(null);
        directionsDisplay.setMap(map);
        mapHelper.directionsService.route(request, function(response, status) {
            if (status == google.maps.DirectionsStatus.OK) {
                directionsDisplay.setDirections(response);
            }
        });
    }, 
};

var apiHelper = {
    apiUrl: "https://bcnbikeanchors.azure-mobile.net/api/bikeanchors/",
    getCloseAnchors: function(lat, lng, success, error){
        apiHelper.callService({lat:lat, lng:lng}, success , error);
    },
    getAllAnchors: function(success, error){
        //TODO: invoke apiHelper.callService with the correct params to download all 488 anchors.
    },
    callService: function(params, success, error){
        var urlParams = apiHelper.objectToUrlParams(params || {});
        $.ajax({
            type: "GET",
            headers: {
                "X-ZUMO-APPLICATION": "UmlmPXSgHQmFpGlfnjDBUnFbofUqqs65"
            },
            url: apiHelper.apiUrl + urlParams
        }).done(success).fail(error);

    },
    objectToUrlParams: function(obj){
        var str = "?";
        for (var key in obj) {
            if (str != "?") {
                str += "&";
            }
            str += key + "=" + obj[key];
        }
        return str;
    }
};