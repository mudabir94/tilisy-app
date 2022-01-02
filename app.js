'use strict';

const {getJWT} = require("./genjwt.js")
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");
// require('./db/mongoose')
const readline = require('readline');
var _ = require('underscore');


const bankslist=[]
const config = JSON.parse(fs.readFileSync(path.join(__dirname, ".", "config.json")))
const token=getJWT()
const BASE_URL = "https://api.tilisy.com"
const REDIRECT_URL = config.redirectUrl
var BANK_NAME = "Nordea"
const BANK_COUNTRY = "FI"
const baseHeaders = {
Authorization: `Bearer ${token}`
}
var link_url=""
var code = ""
var session_id=""
var accounts_list=[]

var today = new Date()
var priorDate = new Date().setDate(today.getDate()-30)
priorDate = new Date(priorDate)
var dateTimeInParts = today.toISOString().split( "T" ); 
var today = dateTimeInParts[ 0 ]; 
var dateTimeInParts = priorDate.toISOString().split( "T" ); 
var priorDate = dateTimeInParts[ 0 ]; 


const validUntil = new Date(new Date().getTime() + 10 * 24 * 60 * 60 * 1000);

const startAuthorizationBody = {
    access: {
      valid_until: validUntil.toISOString()
    },
    aspsp: {
        name: BANK_NAME,
        country: BANK_COUNTRY
      },
    state: "some_test_state",

    redirect_url: REDIRECT_URL,    
  }


// fetched_data={
//     accountid:{
//         numoftransactions:
//         max_val:
//         totalval_crdit:
//         totalvaldebit:
//     },
//     accountid:{
//         ...
//     }

// }
var fetched_data=[]

const main = async function() {
    
    await getASPSPSList(`${BASE_URL}/aspsps`)
        .then(data => {
            var filter= {country:"FI"}
            const bankslist=[]
            data['aspsps'].filter(function (obj) {
                if (obj.country === "FI"){
                        bankslist.push(obj.name)
                    }
            });
            console.log("List of Bank names")
            console.log(bankslist)
        })

    const name = await input ("Please Type the Bank name ")
    BANK_NAME = name
    
    // Start User Authentication
    await startUserAutherize(`${BASE_URL}/auth`,  startAuthorizationBody)
    .then(data => {
        link_url = data['url']
    });
    
    // Show the url and ask for the redirect url from user. 
    const redirectedUrl = await input(`Please go to ${ link_url }   \n \n paste the url you have been redirected to: `)
    code = getCode(redirectedUrl)
    // Autherize User session
    await autherizeUserSess(`${BASE_URL}/sessions`,  {"code":code})
    .then(data => {
    console.log("session id",data.session_id); // JSON data parsed by `data.json()` call
    session_id=data.session_id
    });

    // Get Session Data
    await getSessionData(`${BASE_URL}/sessions/${session_id}`)
      .then(data => {
      console.log(data.accounts[0]); // JSON data parsed by `data.json()` call
      accounts_list=data.accounts[0]
      });
      await getAccountTransactions(`${BASE_URL}/accounts/${accounts_list}/transactions`)
            .then(data => {
            console.log(data); // JSON data parsed by `data.json()` call
            

            console.log("_______________________________________________________________________")
            });
    // for (var acc in accounts_list){
    //     console.log(accounts_list[acc]);
    //     // Get Account Transactions
    //     await getAccountTransactions(`${BASE_URL}/accounts/${accounts_list[acc]}/transactions`)
    //       .then(data => {
    //       console.log(data); // JSON data parsed by `data.json()` call
    //       console.log("_______________________________________________________________________")
    //       });

    // }
    


    
}


// List of ASPSPS
async function getASPSPSList(url = '') {

    const response = await fetch(url, {
      method: 'GET', 
      headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json",
        },

    });
    return response.json(); // parses JSON response into native JavaScript objects
  }

  
// Authenticate APP
async function authenticateApp(url = '') {

    const response = await fetch(url, {
      method: 'GET',
      headers: {Authorization: `Bearer ${token}`},
    });
    return response.json(); // parses JSON response into native JavaScript objects
  }

// authenticateApp(`${BASE_URL}/application`)
//   .then(data => {
//   console.log(data); // JSON data parsed by `data.json()` call
//   });



// Start User Authentication
async function startUserAutherize(url = '', data = {}) {

    const response = await fetch(url, {
      method: 'POST', 
      
      headers: {
          "Authorization": `Bearer ${token}`, 
          "Accept": "application/json",
          "Content-Type": 'application/json',
        },
     
      body: JSON.stringify(data) // body data type must match "Content-Type" header
    
    
    });
    return response.json(); // parses JSON response into native JavaScript objects
  }
 

// startUserAutherize(`${BASE_URL}/auth`,  startAuthorizationBody)
// .then(data => {
// console.log(data); // JSON data parsed by `data.json()` call
// });

async function autherizeUserSess(url = '', data = {}) {

    const response = await fetch(url, {
      method: 'POST', 
      
      headers: {
          "Authorization": `Bearer ${token}`, 
          "Accept": "application/json",
          "Content-Type": 'application/json',
        },
     
      body: JSON.stringify(data) // body data type must match "Content-Type" header
    
    
    });
    return response.json(); // parses JSON response into native JavaScript objects
  }
 

//   autherizeUserSess(`${BASE_URL}/sessions`,  {"code":"1fcf9394-4b13-46c6-9726-704a5fcc7deb"})
// .then(data => {
// console.log(data); // JSON data parsed by `data.json()` call
// });


// Get Session Data
async function getSessionData(url = '') {

    const response = await fetch(url, {
      method: 'GET', 
      headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json",
        },

    });
    return response.json(); // parses JSON response into native JavaScript objects
  }

// getSessionData(`${BASE_URL}/sessions/a8dafe9e-a374-4f01-b250-13e2629cb57e`)
//   .then(data => {
//   console.log(data.accounts); // JSON data parsed by `data.json()` call
//   });

// Get Account Transactions
  async function getAccountTransactions(url = '') {

    const response = await fetch(url, {
      method: 'GET', 
      headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json",
        },

    });
    return response.json(); // parses JSON response into native JavaScript objects
  }
  
getAccountTransactions(`${BASE_URL}/accounts/152284da-61bd-4226-86b9-aca93f2da596/transactions`)
  .then(data => {
   


    var transaction_data = data['transactions'].map(function (obj) {
            if (obj.transaction_date<=today && obj.transaction_date>=priorDate ){
                
                return obj.transaction_amount.amount
            }
        
      });
    
    console.log(Math.max(...transaction_data))
    console.log("NUM: : ", _.size(transaction_data))
    var numoftransactions=_.size(transaction_data)
    var max_val= Math.max(...transaction_data)


    var debit=[];var credit=[]
   

   

    data['transactions'].filter(function (obj) {
        if (obj.credit_debit_indicator === "DBIT" && (obj.transaction_date<=today && obj.transaction_date>=priorDate )){
                // console.log("Debit",obj.transaction_amount.amount)
                debit.push(parseFloat(obj.transaction_amount.amount))
            }
        else if (obj.credit_debit_indicator === "CRDT" && (obj.transaction_date<=today && obj.transaction_date>=priorDate )) {
            // console.log("credit",obj.transaction_amount)
            credit.push(parseFloat(obj.transaction_amount.amount))
        }
        else {
            console.log("No Indicator Info");
        }
    });
    // console.log("Debit list",debit)
    // console.log("credit list ",credit)
    const reducer = (accumulator, curr) => accumulator + curr;
    var totalvaldebit=debit.reduce(reducer)
    var totalval_crdit=credit.reduce(reducer)

    // console.log(debit.reduce(reducer));
    // console.log(credit.reduce(reducer));


    fetched_data
    fetched_data.push({
        accountid:"152284da-61bd-4226-86b9-aca93f2da596",
        numoftransactions:numoftransactions,
        max_val: max_val,
        totalval_credit:totalval_crdit,
        totalval_debit:totalvaldebit
    })
    fetched_data.push({
        accountid:"152284da-61bd-4226-86b9-aca93f2da596",
        numoftransactions:numoftransactions,
        max_val: max_val,
        totalval_credit:totalval_crdit,
        totalval_debit:totalvaldebit
    })

   console.log(fetched_data)
  });






function input(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
  
    return new Promise(resolve => rl.question(query, ans => {
        rl.close();
        resolve(ans);
    }))
  }

function getCode(url) {
    const query = url.split("?")[1];
    for (const pair of query.split("&")) {
      const [key, val] = pair.split("=")
      if (key === "code") {
        return val;
      }
    }
  }
  

// (async () => {
//     try{
//       await main()
//     } catch (error) {
//       console.log(`Unexpected error happened: ${error}`)
//     }
//   })();