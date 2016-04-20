//custom meetup url search with api key
var url = 'https://api.meetup.com/2/open_events?and_text=False&offset=0&format=json&lon=-122.25851&limited_events=False&photo-host=public&text=runing+run+jogging+hiking&page=20&radius=15&category=9&lat=37.806349&status=upcoming&desc=False&sig_id=185474821&sig=774927aef4ea1cb19313b3f41dde24adc6966d05';

var newurl ='https://api.meetup.com/2/open_events?&photo-host=public&text=jog+run+hike&category=9&page=20&status=upcoming&desc=False&key=92473e3d65402c53a67252350&&sign=true&country=US&&radius=15&order=distance&key=92473e3d65402c53a67252350';

var weatherApi = 'https://api.forecast.io/forecast/d5bb4142f6d7be37a8aa855e52dd0f31/';

//Meetup Class takes meetup api data and forms custom objects for each meetup event
var Meetup = function(meetObj) {
    var self = this;
    self.url = meetObj.event_url;
    self.name = meetObj.name;
    self.time = meetObj.time;
    self.date = function() {
        return new Date(meetObj.time)
    };

    self.lat = meetObj.venue.lat;
    self.lng = meetObj.venue.lon;
    self.venueName = meetObj.venue.name;
    self.address = meetObj.venue.address_1;
    self.city = meetObj.venue.city;
    self.state = meetObj.venue.state;
    self.marker = new google.maps.Marker({
        position: {
            lat: self.lat,
            lng: self.lng
        },
        icon: 'icon.png',
        title: self.name
    });
    self.infoWindow = new google.maps.InfoWindow();
    self.weather = ko.observable();

};




//Kockout framework
var ViewModel = function() {
    var self = this;

    //map variable will be instantiated from Map class and is used for all markers
    var map;

    self.searchValue = ko.observable("Berkeley, CA");


    // var infoWindow = new google.maps.InfoWindow();
    self.meetupList = ko.observableArray([]);

    self.cleanUpList = function(){
        self.meetupList().forEach(function(meetup){
            meetup.marker.setMap(null);
        });
        self.meetupList([]);
    }


    self.getMeetups = function(url) {
        //clearing up meetupList array when a new search is requested
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
        }).success(function(response) {
            // extract data from JSON
            var dataArray = response.results;

            //meetup valid(with location and venue object) objects pushed to meetupList(), an observable array
            for (var i = 0; i < dataArray.length; i++) {

                if (dataArray[i]['venue'] && dataArray[i]['venue']['lat'] && dataArray[i]['venue']['lon']) {
                    self.meetupList.push(new Meetup(dataArray[i]));

                }

            }




            for (var i = 0; i < self.meetupList().length; i++) {
                //set each marker on map
                self.meetupList()[i].marker.setMap(map);
                self.weatherRequest(self.meetupList()[i]);

                //IFFE: adds a listener to each marker, so when a marker is clicked, the
                //function self.meetupClicked is invoked
                (function(j) {

                    self.meetupList()[j].marker.addListener('click', function() {
                        self.meetupClicked(self.meetupList()[j]);
                        // self.toggleBounce(self.meetupList()[j]);
                    });
                }(i))

            }



            // If the meetup data fails to load, the user is notified
        }).fail(function(error) {
            $('#search-status').text('Meetup data could not be loaded');
        });
    }



    //self.meetupClicked is invoked once a marker or meetupList item is clicked on window
    self.meetupClicked = function(meetup) {
        //closes any open infoWidow to avoid multiple ones open simultaneously
        self.meetupList().forEach(function(meetup) {
            meetup.infoWindow.close();
            meetup.marker.setAnimation(null);
        })

        meetup.marker.setAnimation(google.maps.Animation.BOUNCE);


        meetup.infoWindow.setContent('<div' +
            '<h5><a href="' +
            meetup.url + '" target="_blank">' + meetup.name +
            '</a> </h5>' +
            '<p>' +
            meetup.address + ', ' + meetup.city + ' </br> Time: ' + meetup.date() +
            '</p>' +
             '<p>' + meetup.weather().summary + '</p>' +
            '</div>'
        );

        meetup.infoWindow.open(map, meetup.marker);
    }


    self.weatherRequest = function(meetup){

        var weatherApiLocal = weatherApi + meetup.lat +
                                ',' + meetup.lng + ',' + (meetup.time/1000) ;

                                console.log(weatherApiLocal);

        $.ajax({
            url: weatherApiLocal,
            dataType: 'jsonp',
            success: function(weatherData){

                var forecastdata = weatherData.currently;

                meetup.weather(forecastdata);
                console.log(meetup.weather());


            },
            error: function(weatherData){
                weatherStatus.summary = 'weather forecast is not available yet';
                weatherStatus.icon = '';
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
            zoom: 12,
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

        var input = document.getElementById('inputSearch');
        var searchBox = new google.maps.places.SearchBox(input);

        searchBox.addListener('places_changed', function() {

            var places = searchBox.getPlaces();
            var lat = places[0].geometry.location.lat();
            var lng = places[0].geometry.location.lng();


           console.log(lat, lng);
           map.setCenter({lat: lat , lng: lng});

           self.getMeetups(newurl + '&lat=' + lat + '&lon=' +lng)

        });


    }


    //map inititated first, then meetup data are loaded

    self.initMap();
    self.getMeetups(url);


}


ko.applyBindings(new ViewModel());
