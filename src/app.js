//Hamzah Awnallah
//6hamzah6@gmail.com

//custom meetup url search with api key
var singedMeetupUrl = 'https://api.meetup.com/2/open_events?and_text=False&offset=0&format=json&lon=-122.25851&limited_events=False&photo-host=public&text=runing+run+jogging+hiking&page=20&radius=15&category=9&lat=37.806349&status=upcoming&desc=False&sig_id=185474821&sig=774927aef4ea1cb19313b3f41dde24adc6966d05';

var customMeetupUrl = 'https://api.meetup.com/2/open_events?&photo-host=public&text=jog+run+hike&category=9&page=20&status=upcoming&desc=False&key=92473e3d65402c53a67252350&&sign=true&country=US&key=92473e3d65402c53a67252350';

var weatherApi = 'https://api.forecast.io/forecast/d5bb4142f6d7be37a8aa855e52dd0f31/';


String.prototype.contains = function(other) {
  return this.indexOf(other) !== -1;
};


//Meetup Class takes meetup api data and forms custom objects for each meetup event
//wheather data is assigned to each object later by weatherRequest function
var Meetup = function(meetObj) {
    this.url = meetObj.event_url;
    this.name = meetObj.name;
    this.time = meetObj.time;
    this.date = function() {
        return new Date(meetObj.time)
    };

    this.lat = meetObj.venue.lat;
    this.lng = meetObj.venue.lon;
    this.venueName = meetObj.venue.name;
    this.address = meetObj.venue.address_1;
    this.city = meetObj.venue.city;
    this.state = meetObj.venue.state;
    this.marker = new google.maps.Marker({
        position: {
            lat: this.lat,
            lng: this.lng
        },
        icon: 'dist/icon.png',
        title: this.name
    });
    this.infoWindow = new google.maps.InfoWindow();
    this.weather = {};

};




//Kockout framework
var ViewModel = function() {

    var self = this;

    //map variable will be instantiated from Map class and is used for all markers
    var map;
    var currentLat = 37.806112;
    var currentLng = -122.258038;

    //initial search parameters (editable by the user)
    self.searchValue = ko.observable("Berkeley, CA");
    self.searchRadius = ko.observable(15);
    self.inputFilter = ko.observable('');
    self.meetupListFiltered =ko.observableArray([]);


    // Stores and displayes meetup objects
    self.meetupList = ko.observableArray([]);

    //When a new search is initiated, the markers are removed and the list of meetup
    //objects is cleared
    self.cleanUpList = function() {
        self.meetupList().forEach(function(meetup) {
            meetup.marker.setMap(null);
        });
        self.meetupList([]);
    }


    self.getMeetups = function(url) {
        //clearing up previous meetupList array when a new search is requested
        self.cleanUpList();

        // requesting JSONP
        $.ajax({
            type: "GET",
            url: url,
            timeout: 5000,
            contentType: "application/json",
            dataType: "jsonp",
            cache: false,

            // when api request succeeds
            success: function(response) {

                var dataArray = response.results;

                //valid meetups(with location and venue objects) are pushed to meetupList(), an observable array
                for (var i = 0; i < dataArray.length; i++) {

                    if (dataArray[i]['venue'] && dataArray[i]['venue']['lat'] && dataArray[i]['venue']['lon']) {
                        self.meetupList.push(new Meetup(dataArray[i]));
                    }
                }

                self.filter();



                //The error message is cleared when a succeful request is achieved after a failed request
                $('#search-status').text('');

            },



            // If the meetup request fails, the user is notified
            error: function(error) {
                $('#search-status').text('(Meetup data could not be loaded)');

            }

        });
    }


    self.filter = function(){

        self.meetupListFiltered().forEach(function(meetup) {
            meetup.marker.setMap(null);
        });
        self.meetupListFiltered([]);

        // filter results where name contains se
        var results = self.meetupList().filter(function(meetup){
            return (meetup.name.toLowerCase().indexOf(self.inputFilter().toLowerCase()) != -1)
        });

        results.forEach(function(meetup){
            self.meetupListFiltered.push(meetup)

        });


        //go through results and set marker to visible
        //



        self.addMarkers();

        }

    self.addMarkers = function (){


                //For every meetup object in the self.meetupList()
        for (var i = 0; i < self.meetupListFiltered().length; i++) {
            //set each marker on map
            //request weather data for the location time of the object
            self.meetupListFiltered()[i].marker.setMap(map);
            self.weatherRequest(self.meetupListFiltered()[i]);

            //IFFE: adds a listener to each marker, so when a marker is clicked, the
            //function self.meetupClicked is invoked
            // (function(j) {

            //     self.meetupListFiltered()[j].marker.addListener('click', function() {
            //         self.meetupClicked(self.meetupListFiltered()[j]);
            //     });
            // }(i));

        }

        self.meetupListFiltered().forEach(function(meetup){
            meetup.marker.addListener('click', function(){
                self.meetupClicked(meetup);
            })
        })
    }

    //self.meetupClicked is invoked once a marker or meetupList item is clicked on window
    //infoWindow content is set in this function
    self.meetupClicked = function(meetup) {
        //closes any open infoWidow to avoid multiple ones openning simultaneously
        self.meetupListFiltered().forEach(function(meetup) {
            meetup.infoWindow.close();
            meetup.marker.setAnimation(null);
        })

       // marker bounces
        meetup.marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(function(){
            meetup.marker.setAnimation(null);
        }, 2100)

        //if weather data are valid, they're included in the infoWindow. An error is given otherwise

        if (meetup.weather.summary && meetup.weather.apparentTemperature) {

            var weatherInDOM = '<p> Expected Weather: <i>' + meetup.weather.summary + ' with Temp of ' + meetup.weather.apparentTemperature +
                ' &deg;  F </i></p>'
        } else
            var weatherInDOM = 'Weather forecast is not available yet';


        //info window content is set from the clicked meetup object
        meetup.infoWindow.setContent('<div' +
            '<h5><a href="' +
            meetup.url + '" target="_blank">' + meetup.name +
            '</a> </h5>' +
            '<p>' +
            meetup.address + ', ' + meetup.city + ' </br> Time: ' + meetup.date() +
            '</p>' + weatherInDOM + '</div>'
        );


        meetup.infoWindow.open(map, meetup.marker);

        //Marker bouncing ends once an infoWindow is closed
        google.maps.event.addListener(meetup.infoWindow, 'closeclick', function() {
            meetup.marker.setAnimation(null);
        });

    }



    //weather API request function
    self.weatherRequest = function(meetup) {
        //request link(for each object).
        //The forecast API uses a time with three orders of mag. smaller than the
        //meetup API time
        var weatherApiLocal = weatherApi + meetup.lat +
            ',' + meetup.lng + ',' + (meetup.time / 1000);



        $.ajax({
            url: weatherApiLocal,
            dataType: 'jsonp',
            timeout: 3000,
            success: function(weatherData) {

                var forecastdata = weatherData.currently;

                //weather data is stored into the meetup Object
                meetup.weather = forecastdata;



            },
            error: function(weatherData) {
                //request fails --> weather data is empty object
                meetup.weather = {};

            }
        });

    }



    //google map taken form google reference
    self.initMap = function() {
        map = new google.maps.Map(document.getElementById('map'), {
            center: {
                lat: 37.806112,
                lng: -122.258038
            },
            zoom: 11,
            styles: [{
                featureType: 'poi',
                stylers: [{
                        visibility: 'on'
                    }] // Turn off points of interest.
            }, {
                featureType: 'transit.station',
                stylers: [{
                        visibility: 'off'
                    }] // Turn off bus stations, train stations, etc.
            }],
            disableDoubleClickZoom: false
        });

    }

    //self.newSearch function is fired when a new location is requested in the view
    self.newSearch = function() {

        var input = document.getElementById('inputSearch');
        //google searchBox class autocompletes search results
        var searchBox = new google.maps.places.SearchBox(input);

        //watches for changed location in view, and fires local function: applySearch with a location change
        searchBox.addListener('places_changed', applySearch);


        function applySearch() {

            var places = searchBox.getPlaces();
            // new lat and lng are taken from getPlace, a searchBox method
            currentLat = places[0].geometry.location.lat();
            currentLng = places[0].geometry.location.lng();


            map.setCenter({ lat: currentLat, lng: currentLng });

            //new custom request is fired (locaton)
            self.getMeetups(customMeetupUrl + '&lat=' + currentLat + '&lon=' + currentLng + '&radius=' + self.searchRadius())


        }


    }

    //self.radiusFilter is fired when the search button is clicked
    self.radiusFilter = function() {

        // a new custom search is fired when if the radius is a number
        if (parseInt(self.searchRadius()) == self.searchRadius()) {
            var customRequestURL = customMeetupUrl + '&lat=' + currentLat + '&lon=' + currentLng + '&radius=' + self.searchRadius();
            self.getMeetups(customRequestURL);
        } else {
            alert('The Search Radius Must Be A Number!');
        }

    }


    //map inititated first, then meetup data are loaded

    self.initMap();
    self.getMeetups(singedMeetupUrl);

    // self.newSearch is fired to add a listener for location change
    self.newSearch();


    //end of ViewModel
}



function initViewModel(){
    ko.applyBindings(new ViewModel());
}

