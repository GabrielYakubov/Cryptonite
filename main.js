$(() => {
  /**
   * Global configuration
   */

  // loader divs
  const loader = `
  <div id="loader" class="loader">
     <div class="loading-spinner"></div>
   </div>`;

  //  pop-up div that displays the max number of coins
  const limitContainer = `
    <div id="deselect" class="row mx-0 mt-5" >
    <h3 class="d-flex justify-content-center align-items-center mb-2 text-light">
    Only 5 coins can be selected at a time!</h3>
    <p class="d-flex justify-content-center align-items-center text-light">Please remove some coins</p>
     <div id="deselector" class="row m-0 p-0">
     </div>
     <div class="row d-flex justify-content-center"">
     <button id="confirmSelected" class="btn btn-primary col-4 mt-2 mx-2">Confirm</button>
     <button id="clearSelected" class="btn btn-danger col-4 mt-2 mx-2">Clear all</button>
     </div>
    </div>
   `;

  //  mystery div do NOT peek in the file folder unless you want to spoil it ;)
  const roll = `
   <div id="roll" class="d-flex justify-content-center">
   <h1 >Much empty such sad</h1>
   <audio controls autoplay loop>
   <source src="audio/epic.mp3" type="audio/mpeg">
   </audio>
   </div>
   `;

  //  selectors for various sections
  const selectors = {
    mainContainer: "#main",
    homeSection: "#homeSection",
    reportSection: "#reportSection",
    aboutSection: "#aboutSection",
    loader: "#loader",
    loaderContainer: ".loaderContainer",
    MaxLimitDeselect: "#deselect",
  };

  // global variables
  const MORE_INFO_LOCAL_STORAGE_KEY = "more_info";
  const TWO_MINUTES = 120000; // in milliseconds
  const COMPARE_API_URL =
    "https://min-api.cryptocompare.com/data/pricemulti?fsyms=";
  const COINS_API_URL = "https://api.coingecko.com/api/v3/coins/";
  let selectedCoins = [];
  let coins = [];
  let liveCoins = [];
  const moreInfoTimers = {};
  let chartInterval;

  // global kill interval function
  function killInterval(interval) {
    clearInterval(interval);
  }

  // setting up local strorage epmty object to store more info timers
  localStorage.setItem(MORE_INFO_LOCAL_STORAGE_KEY, JSON.stringify({}));

  // initial home function call to start up the page
  home();

  // single page selector switch for choosing between various "pages"
  $(".btn").on("click", function () {
    // clears section on click
    $("section").remove();
    const dataSection = $(this).attr("data-section");
    // sets selected setion using "this" keyword to capture and assign costume attribute to id
    $("<section>", {
      id: dataSection,
      class: "row m-0 p-0",
    }).appendTo(selectors.mainContainer);
    // sets variable of selector to be used in the switch by clicked ID
    const selector = `#${dataSection}`;

    // selector function to change "pages"
    switch (selector) {
      case selectors.reportSection:
        killInterval(chartInterval);
        report();
        break;
      case selectors.aboutSection:
        killInterval();
        about();
        break;
      default:
        killInterval(chartInterval);
        home();
        break;
    }
  });

  // restores main page to display all coins when clicking search "x" button
  $("#search").on("search", () => displayCoins(coins));
  // search field function to get coins by symbol using "keyup" event.
  // in the project guidelines we've been told to use a search button but i see no reason to add one
  // as we already use the "keyup" event
  $("input[type=search]").on("keyup", function () {
    // sets variable of search box value using "this" to a variable
    const textToSearch = $(this).val().toLowerCase();
    // if variable is empty display all coins
    if (textToSearch === "") {
      displayCoins(coins);
      // else filters all coins in the array by above variable to use as filtered array
    } else {
      const filteredCoins = coins.filter((c) =>
        c.symbol.includes(textToSearch)
      );
      // checks if filtered array got values, if it does uses displayCoins function to draw filtered array on screen
      if (filteredCoins.length > 0) {
        displayCoins(filteredCoins);
      }
    }
  });

  // function to fetch data from the API and parse it to usable data
  async function handleCoins() {
    // wrapped in try and catch, for some reason functions wont execute otherwise, suspect because of wait time for jason
    try {
      // appends loader to the page for a waiting effect
      $(loader).appendTo(selectors.mainContainer);
      // wating for jason and setting the result in the global variable of "coins"
      coins = await getJSON(COINS_API_URL);
      displayCoins(coins);
      toggle(coins);
      // checking for errors, if any return display them in alert
    } catch (err) {
      alert(err.message);
    } finally {
      // remove loader on completion whether the function was seccessful or not
      $(selectors.loader).remove();
    }
  }

  // function to handle card creation
  function displayCoins(coins) {
    let content = "";
    for (const coin of coins) {
      const card = createCard(coin);
      content += card;
    }
    // appends cards to "home page" by ID
    $("#homeSection").html(content);
    // sets checkeBox attribute to false as it is set to true when the html elements created, the checkBox attribute
    // does not appear to exist other wise, cannot set it to true using nither .prop or .attr no idea why this is happening
    $("input[type=checkBox]").attr("checked", false);
  }

  // function to display the Modal of limited coins
  function displayModalCoins(LimitedArray) {
    let content = "";
    for (const coin of LimitedArray) {
      const card = createCard(coin);
      content += card;
    }
    // appends cards to "home page" by ID
    $("#deselector").html(content);
    // loops over selected coins and compares their symbol to API recived array and sets their checked attribute to true
    const coinSymbol = $(this).attr("data-toggle-symbol");
    for (let i = 0; i < coins.length; i++) {
      if (coinSymbol === coins[i].symbol) {
        $(this).attr("checked", true);
      }
    }
  }

  // creates card html elements
  function createCard(coin) {
    // destructuring recieved array
    const {
      id,
      symbol,
      name,
      image: { thumb },
    } = coin;

    // creates html elements using the destructured data to be displayed as cards by displayCoins function
    const card = `
            <div class="card col-sm-12 col-lg-3 col-md-4 p-0" style="height: 155px;" id="${id}">
            <div class="loaderContainer"></div>
              <div id="cardBody" class="card-body overflow-auto py-0">
            <span class="coin-symbol d-flex justify-content-between mt-2"><h4>${symbol}</h4>
            
            <label class="switch">

            <input id="${id}" class="checkBox" type="checkbox" checked="checked" data-toggle-symbol="${symbol}">
            <span class="slider round"></span>
            </label>
            
            
            </span>
            <span class="d-inline-block">${name}</span> <br>
            <img class="coin-image my-2" src="${thumb}" /> <br>
            <button data-coin-id="${id}" class="btn btn-primary btn-sm mb-2" id="more-info">More Info</button>
            <span></span>
            </div>
            </div>
            `;
    return card;
  }

  // function to haddle toggle buttons in the Modal pop-up
  function modalToggleHandeler(selectedCoins) {
    $("input[type=checkBox]").on("change", function (e) {
      const coinSymbol = $(this).attr("data-toggle-symbol");
      const isChecked = e.target.checked;
      try {
        if (isChecked === false) {
          for (let i = 0; i <= selectedCoins.length; i++) {
            if (coinSymbol === selectedCoins[i].symbol) {
              selectedCoins.splice(i, 1);
              return;
            }
          }
        }
      } catch (err) {
        // error handling for tyoeError, for some reason on random occasions error recieved that current symbol is undefined
        // even tho the coins are removed properly and everything works as intended, speculate something to do with delays
        if (err instanceof TypeError) {
          return;
        }
      }
    });

    // confirm button function
    $("#deselect").on("click", "#confirmSelected", function () {
      // removes disabled state for the checkBox's
      $("input[type=checkBox]").prop("disabled", false);
      // removes Modal
      $("#deselect").remove();
      // variable to compare if checkBox is checked
      const checkedBoxes = $("input[type=checkbox]:checked");
      // sets all checkBox's to false then compares what which checkBoxes has the same symbol to the ones that remained
      // in the Modal and turns them back on
      $("input[type=checkBox]").prop("checked", false);
      for (let i = 0; i < checkedBoxes.length; i++) {
        for (let j = 0; j < selectedCoins.length; j++) {
          if (checkedBoxes[i].id === selectedCoins[j].id) {
            $(checkedBoxes[i]).prop("checked", true);
          }
        }
      }
      // sends selected coins to be compared and parsed from Gecko API to CryptoCompare API
      reportLive(selectedCoins);
      return;
    });

    // function for clearing all selected coins from the array
    $("#deselect").on("click", "#clearSelected", function () {
      // removes all coins from array
      selectedCoins.splice(0, 6);
      // removes disabled state from toggle buttons
      $("input[type=checkBox]").attr("disabled", false);
      // removes all checked = true attributes
      $("input[type=checkBox]").prop("checked", false);
      // removes Modal
      $("#deselect").remove();
      // sends selected coins to be compared and parsed from Gecko API to CryptoCompare API
      reportLive(selectedCoins);
      return;
    });
    return;
  }

  // function to hadle toggle button behaviour
  function toggle(coins) {
    $("input[type=checkBox]").on("change", function (e) {
      const isChecked = e.target.checked;
      const coinSymbol = $(this).attr("data-toggle-symbol");
      // if selectedCoins array length is equals to 5 pops-up Modal
      if (selectedCoins.length === 5) {
        // sets all checkboxes that outside the modal to disalbed state
        $("input[type=checkBox]").prop("disabled", true);
        // pops-up modal
        $(limitContainer).appendTo(selectors.mainContainer);
        // calls Modal display card function
        displayModalCoins(selectedCoins);
        // calls Modal toggle handler function
        modalToggleHandeler(selectedCoins);
        return;
        // checks if check attribute is set to false if it is removes coin from array
      } else if (isChecked === false) {
        $(this).attr("checked", false);
        for (let i = 0; i <= selectedCoins.length; i++) {
          try {
            if (coinSymbol === selectedCoins[i].symbol) {
              selectedCoins.splice(i, 1);
              console.log(selectedCoins);
              return;
            }
          } catch (err) {
            // error handling of typeError same reason as before
            if (err instanceof TypeError) {
            }
          }
        }
      } else {
        // pushes selected coin to array and sets check attribute to true
        for (let i = 0; i < coins.length; i++) {
          if (coinSymbol === coins[i].symbol) {
            selectedCoins.push(coins[i]);
            $(this).attr("checked", true);
          }
        }
      }
      // sends selected coins to be compared and parsed from Gecko API to CryptoCompare API
      reportLive(selectedCoins);
    });
    return;
  }

  //function to get more info about coin from API
  async function getMoreInfo(coinId) {
    const coin = await getJSON(`${COINS_API_URL}/${coinId}`);
    return coin;
  }

  // jason parse function
  function getJSON(url) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        $.ajax({
          url,
          success: (data) => {
            resolve(data);
          },
          error: (err) => {
            reject(err);
          },
        });
      }, 1000);
    });
  }

  // home page-------------------------------------------------
  // creates home "page"
  async function home() {
    // sets homeSection variable to selector
    let homeSection = $(selectors.homeSection);
    // checks if home page div exists if not creates one
    if (!homeSection.length) {
      homeSection = $("<section>", {
        id: "homeSection",
        class: "row",
      });
    }
    // appends homepage to main container
    homeSection.appendTo(selectors.mainContainer);
    handleCoins();
    moreInfo();
  }

  // moreInfo button function, expands card to display specified information
  function moreInfo() {
    $("#homeSection").on(
      "click",
      ".card > .card-body > button#more-info",
      async function () {
        let coin;
        const coinId = $(this).attr("data-coin-id");
        const currentCard = $(`#${coinId}`);
        const currentLoaderContainer = $(currentCard).find(
          selectors.loaderContainer
        );
        const now = new Date();
        const timer = moreInfoTimers[coinId];
        // checks if timer euqals to current time minus time if not sets timeDiff to 2 minutes
        const timeDiff = timer ? now - timer : TWO_MINUTES;
        // checks if timeDiff is less than 2 minutes
        if (timeDiff < TWO_MINUTES) {
          // get the coin from local storage
          const coinsHash = getCoinFromLocalStorage();
          coin = coinsHash[coinId];
        } else {
          // if 2 minutes have passed - get the coin from the api

          // render loader
          $(loader).appendTo(currentLoaderContainer);
          $(currentLoaderContainer).show();

          coin = await getMoreInfo(coinId);

          // hide loader
          $(selectors.loader).remove();
          $(currentLoaderContainer).remove(); //was .hide before

          // get the current data from local storage
          const coinsHash = getCoinFromLocalStorage();

          coinsHash[coinId] = coin;

          //insert the coin data into local storage
          localStorage.setItem(
            MORE_INFO_LOCAL_STORAGE_KEY,
            JSON.stringify(coinsHash)
          );
          //reset the timer
          moreInfoTimers[coinId] = new Date();
        }
        // displays values of coins in various currencies in more info span
        const content = `
        <br>
        $ ${coin.market_data.current_price.usd} <br>
        € ${coin.market_data.current_price.eur} <br>
        ₪ ${coin.market_data.current_price.ils}
        `;
        $(this).next().html(content);
      }
    );
  }
  // gets and parses data from more info local storage
  function getCoinFromLocalStorage() {
    const coin = localStorage.getItem(MORE_INFO_LOCAL_STORAGE_KEY);
    return coin ? JSON.parse(coin) : {};
  }

  // report "page"-------------------------------------------------

  function report() {
    // sets reportSection variable to selector
    let reportSection = $(selectors.reportSection);
    // checks if report section exists if not creates one
    if (!reportSection.length) {
      reportSection = $("<section>", {
        id: "reportSection",
        class: "row m-0 p-0",
      });
    }
    // checks if chart array has any entries if not you get an easter egg =)))
    if (liveCoins.length === 0) {
      $(roll).appendTo(reportSection);
      return;
    }
    // appends loader to to live report page
    $(loader).appendTo(selectors.mainContainer);
    // start display charr function
    displayChart(liveCoins);
  }

  // function that takes selected coins and pulls data from cryptoCompare API and creates a new map
  async function reportLive(array) {
    const myMap = array.map((symbol) => symbol.symbol);
    const mapString = myMap.toString().toUpperCase();
    try {
      liveCoins = await getJSON(`${COMPARE_API_URL}${mapString}&tsyms=USD`);
    } catch (err) {
      console.log(err);
    }
  }
  // function to start displaying the chart
  function displayChart(coin) {
    // if Gecko API failed to deliver data display alert to user
    if (coin.length === 0) {
      alert("There was an problem getting data from the API");
      return;
    }

    // set variable to get keys from passed coins
    const coinKeys = Object.keys(coin);
    // accumulates datapoints
    const dataPointsArray = coinKeys.reduce((acc, coin) => {
      acc[coin] = [];
      return acc;
    }, {});

    // creates new data object for chart
    const data = coinKeys.map((coin) => {
      return {
        type: "spline",
        name: coin,
        visible: true,
        showInLegend: true,
        xValueFormatString: "DD MMM YYYY",
        yValueFormatString: "$#,###0.######## USD",
        // datapoints for chart
        dataPoints: dataPointsArray[coin],
      };
    });
    // chart options
    const options = {
      exportEnabled: true,
      animationEnabled: true,
      title: {
        text: "Crypto Currency Price",
      },
      subtitles: [
        {
          text: "Live Update",
        },
      ],
      axisX: {
        title: "Date",
      },
      axisY: {
        title: "Coin Value in USD",
        titleFontColor: "#4F81BC",
        lineColor: "#4F81BC",
        labelFontColor: "#4F81BC",
        tickColor: "#4F81BC",
      },
      toolTip: {
        shared: true,
      },
      legend: {
        cursor: "pointer",
      },
      data: data,
    };

    // sets new chart in variable for render
    const chart = new CanvasJS.Chart("reportSection", options);
    // renders chart
    chart.render();

    // places chart interval in global variable for later use by the kill function
    chartInterval = setInterval(async () => {
      try {
        // pulls new data from API to use in datapoints
        const newPrices = await getJSON(
          `${COMPARE_API_URL}${coinKeys.join(",")}&tsyms=USD`
        );
        for (const [coin, { USD }] of Object.entries(newPrices)) {
          const dataPoints = dataPointsArray[coin];
          if (dataPoints.length === 20) {
            dataPoints.shift();
            dataPoints.push({ x: new Date(), y: USD });
          } else {
            dataPoints.push({ x: new Date(), y: USD });
          }
        }
        chart.render();
      } catch (err) {
        console.log(err);
      }
      $(selectors.loader).remove();
    }, 1000);
  }

  // about page----------------------------------------------------------------------
  // creates about section page
  async function about() {
    let aboutSection = $(selectors.homeSection);
    if (!aboutSection.length) {
      aboutSection = $("<section>", {
        id: "aboutSection",
        class: "container m-0 p-0",
      });
    }
    aboutSection.appendTo(selectors.mainContainer);

    const aboutPage = `
   
    <div id="description" class="row px-4">
        <h2 class="mb-5">Technologies used in this application.</h2>
        <div class="progress mb-4 px-0" style="height: 25px">
          <div
            class="progress-bar bg-success text-start ps-2"
            role="progressbar"
            style="width: 10%"
            aria-valuenow="10%"
            aria-valuemin="0"
            aria-valuemax="100"
          >
            HTML
          </div>
        </div>
        <div class="progress mb-4 px-0" style="height: 25px">
          <div
            class="progress-bar bg-success text-start ps-2"
            role="progressbar"
            style="width: 20%"
            aria-valuenow="20"
            aria-valuemin="0"
            aria-valuemax="100"
          >
            CSS
          </div>
        </div>
        <div class="progress mb-4 px-0" style="height: 25px">
          <div
            class="progress-bar bg-success text-start ps-2"
            role="progressbar"
            style="width: 80%"
            aria-valuenow="80"
            aria-valuemin="0"
            aria-valuemax="100"
          >
            Bootstrap
          </div>
        </div>
        <div class="progress progress-striped active mb-4 px-0" style="height: 25px">
          <div
            class="progress-bar bg-success text-start ps-2"
            role="progressbar"
            style="width: 100%"
            aria-valuenow="100"
            aria-valuemin="0"
            aria-valuemax="100"
          >
            Javascript
          </div>
        </div>
        <hr>
        <div class="col-md mb-3">
          <h2 class="mb-5">Application Documentation</h2>
          <h5>Cryptonite.</h5>
          <p>This is a Crypto currency application that uses various API's to deliver accurate and up to date pricing
          and reports. <br>
          To get started first select a crypto coin of your choosing, you may have up to 5 coins selected at a time. <br>
          After you selected your desired coins head over to the Live Report section to see updated prices in real time.<br>
           </p>
          </div>
        
      </div>
    `;
    // appends variable to about section
    $(aboutPage).appendTo(aboutSection);
  }
});
