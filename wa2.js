var watchId = null;

// gelocation api options
var GLoptions = {
     enableHighAccuracy: false,
     timeout: 10000,
     maximumAge: 60000
};

// coordinates of Greenwich, England
baseCoords = {latitude:51.477222,longitude:0}; 

var map = null;
var prevCoords = null;
var Path = null;

window.onload = getMyLocation;

function getMyLocation() {
    if (navigator.geolocation) {
       navigator.geolocation.getCurrentPosition(displayLocation,displayError,GLoptions);

       // initialize toggle button
       var watchButton = document.getElementById("watch");
       watchButton.value = "Follow";
       watchButton.onclick = watchLocation;
    } else {
        alert("No geolocation support");
    }
}

function displayLocation(position) {
   var div = document.getElementById("location");
   var coords = position.coords;
   div.innerHTML = "Latitude: " + coords.latitude + ", Longitude: " + coords.longitude;

   var km;
   var distance = document.getElementById("distance");
   if (map == null) {
      km = computeDistance(coords, baseCoords);
      distance.innerHTML = "Position is " + km.toFixed(2) + " km from Greenwich, England";
      showMap(coords);
      prevCoords = coords;
   } else {
        km = computeDistance(coords, prevCoords);
        if (km > 0.3) {
           distance.innerHTML = "Position is " + km.toFixed(2) + " km from previous position";
           scrollMapToPosition(coords);
           prevCoords = coords;
        }
   }
}

function displayError(error) {
   var errorTypes = {
      0: "Unknown error",
      1: "Permission denied by user",
      2: "Position is not available",
      3: "Request timed out"
   };

   var errorMessage = errorTypes[error.code];
   // add further detail for 2 cases
   if (error.code == 0 || error.code == 2) {
      errorMessage = errorMessage + " " + error.message;
   }

   var div = document.getElementById("location");
   div.innerHTML = errorMessage;
}

function watchLocation() {
   GLoptions["enableHighAccuracy"] = true;
   watchId = navigator.geolocation.watchPosition(displayLocation,displayError,GLoptions);

   // change label and function of toggle button
   var watchButton = document.getElementById("watch");
   watchButton.value = "Stop";
   watchButton.onclick = clearWatch;
}

function clearWatch() {
   if (watchId) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;

      GLoptions["enableHighAccuracy"] = false;
      // reset label and function of toggle button
      var watchButton = document.getElementById("watch");
      watchButton.value = "Follow";
      watchButton.onclick = watchLocation;
   }
}


function showMap(coords) {
   var latlong = new google.maps.LatLng(coords.latitude,coords.longitude);
   var mapOptions = {
      zoom: 14, //0-20; 14 ~ street level
      center: latlong,
      mapTypeId: google.maps.MapTypeId.ROADMAP
   };
   var mapDiv = document.getElementById("map");
   map = new google.maps.Map(mapDiv, mapOptions);

   // put a marker on the map
   var title = "Location";
   var content = "Position: " + coords.latitude + ", " + coords.longitude;
   content += " (Accuracy: " + coords.accuracy.toFixed(2) + " meters)";
   addMarker(map, latlong, title, content);

   // add path feature
   Path = new google.maps.Polyline({
	                    path: [],
                            geodesic: false,
                            strokeColor: '#FF0000', //red
                            strokeOpacity: 1.0,
                            strokeWeight: 2
                         });
    var pathCoords = Path.getPath(); // pathCoords is a google.maps MVCArray
    pathCoords.push(latlong);
    Path.setPath(pathCoords); // path does not display unless setPath is called
    Path.setMap(map);
}

function addMarker(map, latlong, title, content) {
   var markerOptions = {
      position: latlong,
      map: map,
      title: title,
      clickable: true
   };
   var marker = new google.maps.Marker(markerOptions);

   var infoWindowOptions = {
      content: content,
      position: latlong
   };
   var infoWindow = new google.maps.InfoWindow(infoWindowOptions);

   google.maps.event.addListener(marker, "click", function() {
                 infoWindow.open(map);
               });
}

function scrollMapToPosition(coords) {
   var latlong = new google.maps.LatLng(coords.latitude, coords.longitude);
   map.panTo(latlong);
   // put a marker on the map
   var title = "New Location";
   var content = "Position: " + coords.latitude + ", " + coords.longitude;
   content += " (Accuracy: " + coords.accuracy.toFixed(2) + " meters)";
   addMarker(map, latlong, title, content);
   // update path
   var pathCoords = Path.getPath();
   pathCoords.push(latlong);
}

function computeDistance(startCoords, destCoords) {
   var startLatRads = degreesToRadians(startCoords.latitude);
   var startLongRads = degreesToRadians(startCoords.longitude);

   var destLatRads = degreesToRadians(destCoords.latitude);
   var destLongRads = degreesToRadians(destCoords.longitude);

   var Radius = 6371; // radius of the Earth in km

   var distance = Math.acos(Math.sin(startLatRads) * Math.sin(destLatRads) +
   Math.cos(startLatRads) * Math.cos(destLatRads) *
   Math.cos(startLongRads - destLongRads)) * Radius;

   return distance;
}


function degreesToRadians (degrees) {
         return (degrees * Math.PI)/180;
};
