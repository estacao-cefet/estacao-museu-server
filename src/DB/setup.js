const { Client } = require("pg");
const client = new Client({
  connectionString: process.env.DB_STRING,
  ssl: {
    rejectUnauthorized: false,
  },
});

client.connect();
client.end();
