const express = require("express");
const pg = require("pg");
const { Client } = require("pg");
const client = new Client({
  connectionString:
    "postgres://xdtgcxetjzbmkr:6c083aaf4ce5da274ac0d63e43a6b30a2b2227c3af1c7c16ef0a7357dfeb5d9b@ec2-18-214-208-89.compute-1.amazonaws.com:5432/d1nnj41uc9m4cn",
  ssl: {
    rejectUnauthorized: false,
  },
});
client.connect();
pg.types.setTypeParser(1114, (str) => str); // forcing timestamp to be str

const router = express.Router();

router.get("/test", (req, res) => {
  res.send("fodase");
  return;
});
router.get("/api", async (req, res) => {
  //  date_to , date_from
  //  GET /something?date_to=DATE&date_from=DATE&scale=compare/days/months/years
  let date_to = req.query.date_to;
  let date_from = req.query.date_from;
  let scale = req.query.scale;

  if (!date_to || !date_from || !scale) {
    try {
      const resp = await client.query(
        "SELECT * FROM estacao ORDER BY datetime DESC LIMIT 1"
      );
      res.send(JSON.stringify(resp.rows[0]));
      return;
    } catch (err) {
      console.log("Error: ", err.stacks);
      res.send("Error on getting data");
      return;
    }
  }

  try {
    //SELECT * FROM estacao WHERE datetime BETWEEN '2021-03-11 00:00:00' AND '2021-03-12 23:59:59'
    const resp = await client.query(
      "SELECT * FROM estacao WHERE datetime BETWEEN '$1' AND '$2'",
      [date_to, date_from]
    );
    console.log(resp);
    res.send(resp.rows);
    client.end();
    return;
  } catch (err) {
    res.send(err.stack);
    client.end();
    return;
  }
});

router.post("/api", async (req, res) => {
  let data = req.body;
  if (
    !data.device ||
    !data.datetime ||
    !data.temperature ||
    !data.humidity ||
    !data.dewPoint ||
    !data.absoluteHumidity ||
    !data.pressure ||
    !data.luminosity ||
    !data.CO2 ||
    !data.dust10 ||
    !data.dust25 ||
    !data.dust100 ||
    !data.dataId
  ) {
    res.send("ERROR ON BODY");
    console.log("Error on body");
    return;
  }

  let db_query_values = Object.values(data);

  try {
    const resp = await client.query(
      "INSERT INTO estacao (device,datetime,temperature,humidity,dewpoint,absolutehumidity,pressure,luminosity,co2,dust10,dust25,dust100,dataid) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)",
      db_query_values
    );
    console.log("enviado para o db");
    req.io.emit("update_data", data);
    return res.send(resp.rows[0]);
  } catch (err) {
    console.log("error");
    console.log(err.stack);
    return res.send(err.stack);
  }
});

module.exports = router;
