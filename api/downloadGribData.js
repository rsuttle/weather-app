
const axios = require('axios');
const fs = require("fs")

const LEFTLON = -94;  //west
const RIGHTLON = -79;  //west
const TOPLAT = 49;  //north
const BOTTOMLAT = 37; //north
const MAXFORECASTHOUR = 48;


async function downloadGribData(){

    var runTime = '00';  //2 digits
    var date = '20210313';  //yyyymmdd


    for(let forecastHour = 0; forecastHour <= MAXFORECASTHOUR; forecastHour+=3){
        
        var forecastHourString = forecastHour.toString().padStart(3,"0");
        var url = `https://nomads.ncep.noaa.gov/cgi-bin/filter_gfs_0p25.pl?file=gfs.t${runTime}z.pgrb2.0p25.f${forecastHourString}&lev_2_m_above_ground=on&var_TMP=on&subregion=&leftlon=${LEFTLON}&rightlon=${RIGHTLON}&toplat=${TOPLAT}&bottomlat=${BOTTOMLAT}&dir=%2Fgfs.${date}%2F${runTime}`;

        try{
            let response = await axios.get(url, {responseType:"arraybuffer"});
            fs.writeFileSync(`./gribfiles/temperaturegribhr${forecastHour}.grb2`,response.data);
            await sleep(1000);
        }catch(err){
            console.log(err);
            await sleep(1000);
        }
        
    }
}


const sleep = (milliseconds) => {
    return new Promise(res => setTimeout(res,milliseconds));
}



module.exports = downloadGribData;