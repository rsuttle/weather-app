require('dotenv').config()
const express = require('express');
const cors = require('cors');
var CronJob = require("cron").CronJob;
const MongoClient = require('mongodb').MongoClient;



const downloadGribData = require("./downloadGribData");
const processGribData = require("./processGribData");


const app = express();
const port = process.env.PORT;

app.use(cors());



console.log("hours",new Date().getHours())

const downloadAndProcessData = async () => {
  console.log("job starting")
  await downloadGribData();
  processGribData();
}

var job = new CronJob('0 18 * * * *', downloadAndProcessData,null,null,"America/New_York",null,true);
job.start();


const uri = `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@cluster0.ha6aw.gcp.mongodb.net/WeatherData?retryWrites=true&w=majority&authSource=admin`;

app.get('/', async (req, res) => {
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  const dbName = "WeatherData";
  try {
    await client.connect();
    const db = client.db(dbName);
    const col = db.collection("Temperature");
    const data = await col.findOne();
    res.send(data);
    
   } catch (err) {
    console.log(err.stack);
  } finally {
    await client.close();
  } 
});

app.get('/testfile', (req, res) => {

  res.send("done");
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});