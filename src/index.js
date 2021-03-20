require("dotenv").config();
const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);
const bodyParser = require("body-parser");
const apiRoutes = require("./routes/api");

app.use(function (req, res, next) {
  // now io can be used in apliances Router
  req.io = io;
  next();
});
app.use(bodyParser.json());
app.use(apiRoutes);
app.use(express.static("webpage"));

server.listen(process.env.PORT, () => {
  console.log(`Listening on port: ${server.address().port} ... `);
});

io.on("connection", (socket) => {
  console.log("Connected");
});
