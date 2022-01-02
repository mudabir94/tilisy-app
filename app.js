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
    // console.log("session id",data.session_id); // JSON data parsed by `data.json()` call
    session_id=data.session_id
    });

    // Get Session Data
    await getSessionData(`${BASE_URL}/sessions/${session_id}`)
      .then(data => {
    //   console.log("DATa acounts",data.accounts); // JSON data parsed by `data.json()` call
      accounts_list=data.accounts
      });

    console.log ("\n")
    console.log("Summary of operations for each account during the last 30 days")
    console.log ("\n")
    console.log (`From ${today} To ${priorDate} Date.`)


    for (var acc in accounts_list){
        // console.log("accound id",accounts_list[acc]);
        // Get Account Transactions
        await getAccountTransactions(`${BASE_URL}/accounts/${accounts_list[acc]}/transactions`)
          .then(data => {
             generateSummary(data,accounts_list[acc])
        });
    }
   
    
   

    for (var ind in fetched_data){

        console.log("\n\n")
        console.log("Account ID :",fetched_data[ind].accountid)
        console.log("****** Num of Transactions:",fetched_data[ind].numoftransactions)
        console.log("****** Maximum Value from the Transactions:",fetched_data[ind].max_val)
        console.log("****** Total Value From Credit:",fetched_data[ind].totalval_credit)
        console.log("****** Total Value From Debit:",fetched_data[ind].totalval_debit)
    }
    
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
 

// Autherize User Session. 
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
  


// Generate Summary Function
 function  generateSummary(data,accountid){

    
    var transaction_data = data['transactions'].map(function (obj) {
        if (obj.transaction_date<=today && obj.transaction_date>=priorDate ){
            
            return obj.transaction_amount.amount
        }
    
    });
    if (_.size(transaction_data)===0){
        fetched_data.push({
            accountid:accountid,
            numoftransactions:0,
            max_val: 0,
            totalval_credit:0,
            totalval_debit:0
        })
        return false;
    }


    var numoftransactions=_.size(transaction_data)
    var max_val= Math.max(...transaction_data)
    var debit=[];var credit=[]
    data['transactions'].filter(function (obj) {
        if (obj.credit_debit_indicator === "DBIT" && (obj.transaction_date<=today && obj.transaction_date>=priorDate )){
                debit.push(parseFloat(obj.transaction_amount.amount))
            }
        else if (obj.credit_debit_indicator === "CRDT" && (obj.transaction_date<=today && obj.transaction_date>=priorDate )) {
            credit.push(parseFloat(obj.transaction_amount.amount))
        }
        else {
            console.log("No Indicator Info");
        }
    });
  
    const reducer = (accumulator, curr) => accumulator + curr;
    if (debit.length!==0){
        var totalvaldebit=debit.reduce(reducer)
    }
    else{
        totalvaldebit=0
    }
    if (credit.length!==0){
        var totalval_crdit=credit.reduce(reducer)
    }
    else{
        totalval_crdit=0
    }
  
    fetched_data.push({
        accountid:accountid,
        numoftransactions:numoftransactions,
        max_val: max_val,
        totalval_credit:totalval_crdit,
        totalval_debit:totalvaldebit
    })

  }




// Input function for command line
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
// Fetching Code from The redirect url
function getCode(url) {
    const query = url.split("?")[1];
    for (const pair of query.split("&")) {
      const [key, val] = pair.split("=")
      if (key === "code") {
        return val;
      }
    }
  }
  

(async () => {
    try{
      await main()
    } catch (error) {
      console.log(`Unexpected error happened: ${error}`)
    }
  })();