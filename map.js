// PARAMETERS
const SHEET = 'Feuil';
const START_COLUMN = 'A';
const END_COLUMN = 'K';
const VALUES_RANGE = `${SHEET}1!${START_COLUMN}1:${END_COLUMN}`;

const SHEETS_InnovMedica = '1P8kcOooZsA0UxK-bOYEfFmP4bonqW4h-9iiccfexnwk';
const SHEETS_BigDatia = '1Hb-pqcET0WStHFFT4Zp3bF6PRCihrK0vwnvXSl93qOE';
const SHEETS_Additivalley = '1puX66N8WHFDynESqZg24fueA68eG0MzX_8EZM52-hCw';

const SHEETS = {
  'innovmedica': SHEETS_InnovMedica,
  'bigdatia': SHEETS_BigDatia,
  'additivalley': SHEETS_Additivalley
}


const GOOGLE_API_KEY = 'AIzaSyDxtxnVPmLTpY_TcxUVyfzso9vuNU29z0A';
const MAP_TYPE = 'roadmap';
const MARKER_CLUSTER_IMG_URL = "https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m";
const MARKER_IMG_URL = "https://chart.apis.google.com/chart?cht=mm&chs=24x32&chco=FFFFFF,333333,000000&ext=.png";

// SPREADSHEET COLUMN KEY
const COLUMNS = {
  company: 0,
  url: 1,
  name: 2,
  email: 3,
  address: 4,
  territory: 5,
  product: 6,
  lat: 7,
  lng: 8,
  logo: 9,
  activity: 10,
}

function initialiseMap() {

  const queryString = window.location.search;
  const searchParams = new URLSearchParams(queryString);

  if (searchParams.has("map")) {
    const sheetName = searchParams.get("map");
    const sheet = SHEETS[sheetName]
    sheet && createMap(sheet)
  }


}

function createMap(googleSheetId) {

  const bounds = new google.maps.LatLngBounds();
  
  var mundakaStyle = [
    {
        featureType: "poi",
        elementType: "labels",
        stylers: [
            { visibility: "off" }
        ]
    }, {
        stylers: [
            { saturation: -50 },
            { lightness: 5 }
        ]
    }
  ]

  const mapOptions = {
    zoom: 10,
    center: new google.maps.LatLng(0, 0),
    mapTypeId: MAP_TYPE
  };


  const container = document.getElementById('container');
  const mapContainer = document.createElement('div');
  mapContainer.className = "map";
  container.appendChild(mapContainer);
  map = new google.maps.Map(mapContainer, mapOptions);

  // map.mapTypes.set("styled_map", styledMapType);
  // map.setMapTypeId("styled_map");
  
  map.mapTypes.set("styled_map", new google.maps.StyledMapType(mundakaStyle));
  map.setMapTypeId("styled_map");
  loadMap(googleSheetId, map, bounds);
}

function loadMap(googleSheetId, map, bounds) {
  // make sure your API key is authorised to access Google Sheets API - you can enable that through your Google Developer console.
  // Finally, in the URL, fix the sheet name and the range that you are accessing from your spreadsheet. 'Sheet1' is the default name for the first sheet.
  $.getJSON(`https://sheets.googleapis.com/v4/spreadsheets/${googleSheetId}/values/${VALUES_RANGE}?key=${GOOGLE_API_KEY}`, function (data) {

    headers = data.values[0];
    const values = data.values.slice(1);

    const locations = values.map(row => {
      var location = {};
      location.company = row[COLUMNS.company];
      
      location.name = row[COLUMNS.name];
      location.email = row[COLUMNS.email];
      location.product = row[COLUMNS.product];
      location.activity = row[COLUMNS.activity];
      location.latitude = row[COLUMNS.lat];
      location.logo = row[COLUMNS.logo];
      location.longitude = row[COLUMNS.lng];
      location.url = row[COLUMNS.url];
      location.territory = row[COLUMNS.territory];
      location.address = row[COLUMNS.address];

      return location;

    });

    setLocations(map, locations, bounds);
  });
}


// ==============
// CREATE AND ADD MARKERS TO MAP
// ==============

function setLocations(map, locations, bounds) {
  var infowindow = new google.maps.InfoWindow({ content: getTitle(location), maxWidth: 300 });
  const markers = locations.map(location => {

    var new_marker = createMarker(map, location, infowindow);

    bounds.extend(new_marker.position);
    map.setCenter(new_marker.position);
    map.fitBounds(bounds);

    return new_marker
  })

  const markerCluster = new MarkerClusterer(map, markers, {
 styles: [{
      url: 'https://www.mundakaoptic.com/images/dealers/cluster.png',
      height: 41,
      width: 41,
      'line-height': 41,
      anchor: [0, 0],
      textColor: '#000000',
      textSize: 12,
      iconAnchor: [0, 31],
    }]
  });
}


// ==============
// LOCATION DATA GETTERS
// ==============

function getTitle(location) {
  return location.company
}

function getInfo(location) {
  const title = getTitle(location)
  const formattedTitle = ((location.url === undefined) ? title : ('<a href="' + location.url + '">' + title + '</a>'));
  const url = ((location.url === undefined) ? '' : ('<a href="' + location.url + '">' + location.url.replace('http://', '').replace('https://', '') + '</a>'))
  
  return '<div>' +
    '<center>' +
    `<img class="company_logo" src="${location.logo}"/>` +
    '<h3>' + location.company + '</h3>' +
    '</center>' +
    '<div class="info">' +
    renderRow('Sitio Web', url) +
    renderRow('Apellido', location.name) +
    renderRow('Mail', location.email) +
    renderRow('Direccion', location.address) +
    renderRow('Territorio', location.territory) +
    '</div>' +
    '<div class="more">' +
    
    '<div class="content">' +
    renderMore('Actividad', location.activity) +
    renderMore('Producto(s)', location.product) +
    '</div>'+

    '<center>' +
    '<img onclick="toggle(this)" class="arrow" src="https://cdn0.iconfinder.com/data/icons/navigation-set-arrows-part-one/32/ExpandMore-512.png">' +
    '</center>' +
    
    '</div>' +
    '</div>'
}

function toggle(e) {
  const container = e.parentElement.parentElement
  if (container.classList.contains('show')) {
    container.classList.remove('show')
  } else {
    container.classList.add('show')
  }

}

function getPosition(location) {
  return {
    lat: parseFloat(location.latitude.replace(',', '.')),
    lng: parseFloat(location.longitude.replace(',', '.'))
  };
}


// ==============
// CREATE MARKER FROM LOCATION DATA (USING GETTERS)
// ==============

function createMarker(map, location, infowindow) {
  const position = getPosition(location)
  const title = getTitle(location)
  const info = getInfo(location)
  const icon = 'https://www.mundakaoptic.com/images/dealers/marker.png'

  var marker = new google.maps.Marker({ position, map, title, icon });

  google.maps.event.addListener(marker, 'click', function () {
    infowindow.setContent(info);
    infowindow.open(map, marker);
  });

  return marker;
}

// ==============
// HELPERS
// ==============

function renderRow(label, value) {
  return ((value === undefined || value === '') ? "" : (`<p>${value}</p>`))
  // return ((value === undefined || value === '') ? "" : (`<p><strong>${label}: </strong>${value}</p>`))
}

function renderMore(label, value) {
  return ((value === undefined || value === '') ? "" : (`<h4>${label}: </h4><p>${value}</p>`))
}
