const axios = require('axios');
const fspromises = require("fs").promises;
const fs = require("fs")

const path = require('path');
const util = require('util');

const LEFTLON = -94;  //west
const RIGHTLON = -79;  //west
const TOPLAT = 49;  //north
const BOTTOMLAT = 37; //north
const MAXFORECASTHOUR = 48;

/**
 * Downloads the GRIB temperature data from the NWS for the interval [0,MAXFORECASTHOUR].
 * Saves the files to the ./gribfiles directory.
 */
async function downloadGribData(){

    await eraseDirectoryContents("./gribfiles");

    var runTime = null;  //2 digits
    var date = null;  //yyyymmdd

    //Determine run time based on when the function runs
    var currentHour = new Date().getHours();
    if(currentHour>=0 && currentHour<2){
      //Use yesterday's 12z run
      runTime = '12';
      date = new Date().setHours(12,0,0,0);
      date.setDate(date.getDate()-1);
    }else if (currentHour>=2 && currentHour<=14){
      //Use today's 0z run
      runTime = '00';
      date = new Date().setHours(0,0,0,0);
    } else {
      //Use today's 12z run
      runTime = '12';
      date = new Date().setHours(12,0,0,0);
    }
    date = convertDateToyyyymmdd(date);

    for(let forecastHour = 0; forecastHour <= MAXFORECASTHOUR; forecastHour+=3){
        
        var forecastHourString = forecastHour.toString().padStart(3,"0");
        var url = `https://nomads.ncep.noaa.gov/cgi-bin/filter_gfs_0p25.pl?file=gfs.t${runTime}z.pgrb2.0p25.f${forecastHourString}&lev_2_m_above_ground=on&var_TMP=on&subregion=&leftlon=${LEFTLON}&rightlon=${RIGHTLON}&toplat=${TOPLAT}&bottomlat=${BOTTOMLAT}&dir=%2Fgfs.${date}%2F${runTime}%2Fatmos`;

        try{
            let response = await axios.get(url, {responseType:"arraybuffer"});
            let fileForecastHourString = forecastHour.toString().padStart(2,"0");
            await fspromises.writeFile(`./gribfiles/temperaturegribhr${fileForecastHourString}.grb2`,response.data);
            await sleep(1000);
        }catch(err){
            console.log(err);
            await sleep(1000);
        }
        
    }
}

/**
 * Pauses execution for n milliseconds.
 * @param {number} milliseconds 
 * @returns A promise.
 */
const sleep = (milliseconds) => {
    return new Promise(res => setTimeout(res,milliseconds));
}

/**
 * Converts a date string to yyyymmdd format.
 * @param {Date} date A date string that will be used to create a Date object.
 * @returns The inputted date converted to yyyymmdd format.
 */
const convertDateToyyyymmdd = (date) => {
  date = new Date(date);
  var mm = date.getMonth() + 1;
  var dd = date.getDate();
  var yyyy = date.getFullYear();

  if(mm<=9) mm = '0' + mm;
  if(dd<=9) dd = '0' + dd;

  return yyyy+mm+dd;

}

/**
 * Erases the contents of a given directory.
 * @param {string} directoryName 
 * @returns A promise.
 */
const eraseDirectoryContents = (directoryName) => {
    const directory = directoryName;
   
    return new Promise((resolve,reject) => {
      fs.readdir(directory, (err, files) => {
        if (err) reject(err);
    
        for (const file of files) {
          fs.unlinkSync(path.join(directory, file), err => {
            if (err) reject(err);
          });
        }
  
        resolve();
      });
    })
  }

module.exports = downloadGribData;