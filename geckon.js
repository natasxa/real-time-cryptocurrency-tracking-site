let toggledArr = []; //array for ids (unique unlike symbols)
let coinsArr = []; //array for uppercase symbols (for live data and show)
let dataFlag = 0; //flag for running show live reports
let myTimer = 'null'; //timer for getting live data
let str = ""; //string for live data request

//storage for Live data
let dataPoints0 = [];
let dataPoints1 = [];
let dataPoints2 = [];
let dataPoints3 = [];
let dataPoints4 = [];

let options = {
    title: {
        text: "" //clean everytime we are back to page
    },
    axisY: {
        title: "Coin Value",
        includeZero: false
    },
    toolTip: {
        shared: true //coursor tips
    },
    legend: {
        cursor: "pointer",
        verticalAlign: "top",
        fontSize: 22,
        fontColor: "dimGrey",
        itemclick: toggleDataSeries
    },
    data: []
};

//==========================AJAX_HANDLERS==============================

//spinner
$(document).ajaxStart(function () {
    $('.popup').show();
}).ajaxStop(function () {
    setTimeout(function () {
        $('.popup').hide();
    }, 100)
});

//==========================SHOW_CARDS==============================

function getFunc() {
    localStorage.clear(); //remove unexpected data
    $.get("https://api.coingecko.com/api/v3/coins/list", all => {
        let part = all.slice(0, 99); //first 99 of 6236 =)
        showCards(part);
    })
}

function showCards(x) {
    $("main").empty();
    $("main").append(
        `<div id="rowclass" class="row flex-center"></div>`
    )
    for (let card of x) {
        $("#rowclass").append(
            `<div id="card" class="card bg-light mb-3" align="left">
                <div id="card${card.id}"  class="card-body"> 
                    <form>
                        <div class="row">
                            <div class="col">
                                <h5 class="capital">${card.symbol}</h5>
                            </div>
                            <div class="col" align="right" >
                                <label class="switch pull-right" onclick="toggleFunc('${card.symbol}', '${card.id}')">
                                <input type="checkbox" id="toggle${card.id}">
                                    <span  class="slider round"></span>
                                </label>
                            </div>
                        </div>
                    </form>
                <p id="coinName" class="card-text">${card.name}</p>
                <div class="collapse" id="collapse${card.id}"></div>
                <button id="${card.id}"  data-toggle="collapse" data-target="#collapse${card.id}" aria-expanded="false"  onclick="moreInfo(id)" aria-controls="collapseExample" class="btn btn-primary">
                More info</button>                
                </div>                
                </div>  
            </div>`
        )
    }
    $("main").prop("id", "home");

    //save toggled coin cards "on" after visiting other "pages"
    if (toggledArr !== undefined) {
        let x = toggledArr.length;
        for (let i = 0; i < x; i++) {
            $(`#toggle${toggledArr[i]}`).prop("checked", true);
        }
    }
}

//==========================NAVIGATION==============================

$("#home").click(function () {
    $("main").empty();
    getFunc();
});

$("#live").click(function () {
    $("main").empty();
    liveReports();
});

$("#liveModal").click(function () {
    $("main").empty();
    liveReports();
});

//==========================SEARCH==============================

//filtered search
$("#searchBtn").click(function () {
    $.get("https://api.coingecko.com/api/v3/coins/list", all => {
        let request = $("#searchText").val();
        let filtered = all.filter(all => all.id.includes(request));
        if (filtered.length == 0) {
            alert("Nothing found")
        } else {
            showCards(filtered);
        }
    })
});

//==========================TOGGEL==============================

function toggleFunc(symbol, id) {
    event.preventDefault();
    let input = $(`#toggle${id}`);
    let index = toggledArr.indexOf(id);

    //if already toggled
    if (input.prop("checked")) {
        input.prop("checked", false);
        deleteToggled(index);//for both arrays
    }
    //if not toggled yet
    else if (!input.prop("checked") && toggledArr.length < 5) {
        $.getJSON("https://min-api.cryptocompare.com/data/pricemulti?fsyms=" + symbol + "&tsyms=USD", json => {
            //second part of checking is needed for empty response - {} 
            //like from coin "btcm"
            if (json.Response == "Error" || Object.entries(json) == 0) {
                $("#myModalError").modal();
            }
            else {
                input.prop("checked", true);
                saveToggled(symbol, id);
            }
        })
    }
    //if not toggled yet, but array is full
    else {
        showModal();
    }
}

function showModal() {
    $("#modalBody").empty();
    $("#modalBody").append(
        `<ul>
            <li id="li0">${coinsArr[0]}
            <button onclick="deleteFunc(0)" class="close">&times;</button></li>
            <li id="li1">${coinsArr[1]}
            <button onclick="deleteFunc(1)" class="close">&times;</button></li>
            <li id="li2">${coinsArr[2]}
            <button onclick="deleteFunc(2)" class="close">&times;</button></li>
            <li id="li3">${coinsArr[3]}
            <button onclick="deleteFunc(3)" class="close">&times;</button></li>
            <li id="li4">${coinsArr[4]}
            <button onclick="deleteFunc(4)" class="close">&times;</button></li>
        </ul>`
    )
    $("#myModal").modal();
}

function saveToggled(symbol, id) {
    toggledArr.push(id);
    let capitalSymbol = symbol.toUpperCase();
    coinsArr.push(capitalSymbol);
}

function deleteToggled(index) {
    if (index > -1) {
        toggledArr.splice(index, 1);
        coinsArr.splice(index, 1);
        //if all coins are untoggled 
        if (coinsArr.length == 0) {
            liveDataKiller(); //stop track live data, clear data           
        }
    }
}

function liveDataKiller() {
    clearInterval(myTimer);
    dataFlag = 0;
    options.data = [];
    dataPoints0 = [];
    dataPoints1 = [];
    dataPoints2 = [];
    dataPoints3 = [];
    dataPoints4 = [];
}

function deleteFunc(index) {
    $(`#li${index}`).remove();
    let tmp = toggledArr[index];
    $(`#toggle${tmp}`).prop("checked", false);
    deleteToggled(index);
}

//==========================LIVE_REPORTS_PAGE==============================

function liveReports() {
    $("main").prop("id", "live");

    //if array is empty, don't ajax
    if (coinsArr.length == 0) {
        $("main").append(
            `<h3>NOTHING TO SHOW...</h3>`
        );
    } else {
        $(".popup").show();
        setTimeout(() => { $(".popup").hide() }, 1500);
        $("main").append(
            `<div id="chartContainer"></div>`
        )
        createTitle();
        createDataPoints();
        //if tracking live data, do not start additional one
        if (dataFlag == 0) {
            myTimer = setInterval(function () { createRequestStr() }, 2000);
        }
    }
}

//"turn off"/"turn on" some coins from graph
function toggleDataSeries(e) {
    if (typeof (e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
        e.dataSeries.visible = false;
    }
    else {
        e.dataSeries.visible = true;
    }
    e.chart.render();
}

function createDataPoints() {
    //creating options.data
    for (let i = 0; i < coinsArr.length; i++) {
        let flag = false;
        //check if already saved
        for (let j = 0; j < options.data["length"]; j++) {
            if (options.data[j].name == coinsArr[i]) {
                flag = true;
            }
        }

        if (flag == false) {
            let k = "dataPoints";
            let upd = options.data["length"];
            let tmp = {
                type: "line", //spline
                xValueType: "dateTime",
                yValueFormatString: "####0.00### USD", //#-if no info - will be invisible
                showInLegend: true,
                name: coinsArr[i],
                dataPoints: eval(k + upd)
            }
            options.data.push(tmp);
        }

    }
}

function createTitle() {
    options.title.text = "";
    //title creating 
    if (coinsArr.length > 1) {
        for (let i = 0; i <= coinsArr.length - 2; i++) {
            options.title.text += `${coinsArr[i]}, `;
        }
    }
    options.title.text += `${coinsArr[coinsArr.length - 1]} to USD`;
}

function createRequestStr() {
    if (coinsArr.length > 1) {
        for (let i = 0; i <= coinsArr.length - 2; i++) {
            str += `${coinsArr[i]},`;
        }
    }
    str += `${coinsArr[coinsArr.length - 1]}`;
    getLiveData(str);
    let mainId = $("main").attr("id");
    if (mainId == "live") {
        $("#chartContainer").CanvasJSChart(options);
    }
    str = "";
}

function updateChart(json) {
    let time = new Date();

    for (let i = 0; i < options.data["length"]; ++i) {
        for (let j = 0; j < coinsArr.length; ++j) {
            if (options.data[i].name == coinsArr[j]) {
                let k = "dataPoints";
                eval(k + i + `.push({
                    x: time.getTime(),
                    y: json.` + coinsArr[j] + `.USD});`
                );
            }
        }
    }

    //do not update chart if we on other pages, but still tracking Live Data
    let mainId = $("main").attr("id");
    if (mainId == "live") {
        $("#chartContainer").CanvasJSChart().render();
    }
}

function getLiveData(str) {
    //do not show spinner every 2 second!
    $(document).ajaxStart(function () {
        $('.popup').hide();
    })
    $.getJSON("https://min-api.cryptocompare.com/data/pricemulti?fsyms=" + str + "&tsyms=USD", json => { //filter for data
        dataFlag = 1; //if updaiting - "do not run setInterval again"
        updateChart(json);
    })
    str = "";
}

//==========================MORE_INFO==============================

function moreInfo(id) {
    if ($(`#${id}`).attr("aria-expanded") == "false") {
        //check local storage
        checkLS(id);
    }
}

function checkLS(id) {
    if (localStorage.length !== 0) {
        let tmpArr = localStorage.getItem(`${id}`);
        if (null == tmpArr) {
            getMoreInfo(id);
        }
        else {
            let parsedArr = JSON.parse(tmpArr);
            let image = parsedArr.image;
            let usd = parsedArr.usd;
            let eur = parsedArr.eur;
            let ils = parsedArr.ils;
            showMoreInfo(id, image, usd, eur, ils);
        }
    } else {
        getMoreInfo(id);
    }
}

function getMoreInfo(id) {
    $.getJSON("https://api.coingecko.com/api/v3/coins/" + id, json => {
        let image = json.image.small;
        let usd = json.market_data.current_price.usd;
        let eur = json.market_data.current_price.eur;
        let ils = json.market_data.current_price.ils;
        showMoreInfo(id, image, usd, eur, ils);
        saveMoreInfoToLS(id, image, usd, eur, ils);
    }).fail(function () {
        alert("Smth get wrong...")
    })
}

function showMoreInfo(id, image, usd, eur, ils) {
    $(`#collapse${id}`).empty();
    $(`#collapse${id}`).append(
        `<div class="row" style="padding: 5px">
            <div class="column" style="padding: 5px 15px;">
                <img src=${image} class="card-img" alt="..." /></br>
            </div>
            <div class="column">
                <p id="usd">&#36 &nbsp ${usd}</p>
                <p id="eur">&#8364 &nbsp ${eur}</p>
                <p id="ils">&#8362 &nbsp ${ils}</p>
            </div>
        </div>`
    )
}

function saveMoreInfoToLS(id, image, usd, eur, ils) {
    let savedObject = { 'id': id, 'image': image, 'usd': usd, 'eur': eur, 'ils': ils };
    localStorage.setItem(id, JSON.stringify(savedObject));
    deleteFromLS(id);
}

function deleteFromLS(id) {
    setTimeout(function () {
        localStorage.removeItem(`${id}`);
    }, 120000)//120.000
}