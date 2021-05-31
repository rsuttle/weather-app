require('dotenv').config()
const MongoClient = require('mongodb').MongoClient;

const uri = `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@cluster0.ha6aw.gcp.mongodb.net/WeatherData?retryWrites=true&w=majority&authSource=admin`;

/**
 * Inserts an object into the database.
 * @param {object} data The geojson object to insert into the database.
 */
async function insertToDatabase(data) {
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  const dbName = "WeatherData";
  try {
    await client.connect();
    const db = client.db(dbName);
    const col = db.collection("Temperature");
    await col.insertOne(data);

   } catch (err) {
    console.log(err.stack);

  } finally {
    await client.close();
  }
}

/**
 * IDeletes an object from the database.
 * @param {object} query The document that will be removed.
 */
async function deleteFromDatabase(query) {
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    const dbName = "WeatherData";
    try {
      await client.connect();
      const db = client.db(dbName);
      const col = db.collection("Temperature");
      await col.deleteMany(query);
      
      
    } catch (err) {
          console.log(err.stack);
    } finally {
      await client.close();
    }
    }

    /**
     * Replaces a document in the database.
     * @param {object} query The document to be replaced.
     * @param {object} data The document that will replace the old document.
     */
async function replaceInDatabase(query,data){
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  const dbName = "WeatherData";
  try {
    await client.connect();
    const db = client.db(dbName);
    const col = db.collection("Temperature");
    await col.replaceOne(query,data);

   } catch (err) {
    console.log(err.stack);

  } finally {
    console.log("awaiting client close")
    await client.close();
    console.log("client closed")
  }
}

module.exports = {insertToDatabase,deleteFromDatabase,replaceInDatabase};