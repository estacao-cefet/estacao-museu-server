var socket = io();
let API_URL = "https://estacao-museu.herokuapp.com/api";
let cards = [
  {
    title: "Temperatura(C°)",
    icon: "fas fa-temperature-high fa-2x",
    id: "temperature",
  },
  { title: "Umidade Relativa(%)", icon: "fas fa-tint fa-2x", id: "humidity" },
  {
    title: "Ponto de Orvalho(C°)",
    icon: "./assets/dewpoint.png",
    id: "dewpoint",
  },
  {
    title: "Umidade Absoluta(g/cm³)",
    icon: "./assets/absolut_humidity.png",
    id: "absolutehumidity",
  },
  {
    title: "Pressão(hPa)",
    icon: "fas fa-tachometer-alt fa-2x",
    id: "pressure",
  },
  {
    title: "Luminosidade(LDR)",
    icon: "fas fa-bolt fa-2x",
    id: "luminosity",
  },
  { title: "CO2 (ppm)", icon: "./assets/co2.png", id: "co2" },
  { title: "Poeira 1.0 (ppm)", icon: "fas fa-smog fa-2x", id: "dust10" },
  { title: "Poeira 2.5 (ppm)", icon: "fas fa-smog fa-2x", id: "dust25" },
  { title: "Poeira 10 (ppm)", icon: "fas fa-smog fa-2x", id: "dust100" },
  {
    title: "Ultima atualização",
    icon: "fas fa-clock fa-2x",
    id: "last_update_date:last_update_time",
  },
];

let init = async () => {
  createCards();
  let resp = await fetch(API_URL, {
    method: "GET",
  });
  let data = await resp.json();
  updateData(data);
};

socket.on("update_data", (income) => {
  //let data = JSON.parse(income);
  console.log(income);
  updateData(income);
});

let updateData = async (data) => {
  let all_data = document.getElementsByClassName("all_data");
  let date = data.datetime.slice(0, 10);
  let time = data.datetime.slice(11);
  //console.log(data);

  for (let i = 0; i < all_data.length; i++) {
    if (all_data[i].id == "last_update_date") {
      all_data[i].innerText = date;
    } else if (all_data[i].id == "last_update_time") {
      all_data[i].innerText = time;
    } else if (all_data[i].id == "co2") {
      all_data[i].innerText = "0";
    } else {
      all_data[i].innerText = data[all_data[i].id];
    }
  }
};

let createCards = () => {
  let container = document.getElementById("card_container");
  let id_html, title_html, icon_html;
  let html = "";
  for (let i = 0; i < cards.length; i++) {
    icon_html = `<div class="card"><div class="card_icon">`;
    if (cards[i].icon[0] == "f") {
      icon_html += `<i class = "${cards[i].icon}"></i></div>`;
    } else {
      icon_html += `<img src="${cards[i].icon}"></img></div>`;
    }

    title_html = `<div class="card_texts"><h3>${cards[i].title}</h3>`;
    if (cards[i].title == "Ultima atualização") {
      let aux = cards[i].id.split(":");
      id_html = `<p id = "${aux[0]}" class="all_data"></p><p id = "${aux[1]}" class="all_data"></p></div></div>`;
    } else {
      id_html = `<p id="${cards[i].id}" class="all_data">0</p></div></div>`;
    }

    html += icon_html + title_html + id_html;
  }
  container.innerHTML = html;
};

window.onload = init;
