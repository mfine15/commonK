const cities = require('./cities.json');
const fs = require('fs');

cities.features.forEach((city, i) => {
  city.properties.id = i;
});


fs.writeFile("./city-data.json", JSON.stringify(cities), 'utf8', function (err) {
    if (err) {
        return console.log(err);
    }

    console.log("The file was saved!");
});
