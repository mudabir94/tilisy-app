const fs = require("fs");
const path = require("path");
const jwa = require("jwa");
const config = JSON.parse(fs.readFileSync(path.join(__dirname, ".", "config.json")))
const KEY_PATH = config.keyPath;
const APPLICATION_ID = config.applicationId;




  const getJWTHeader = () => {
    return encodeData({
      typ: "JWT",
      alg: "RS256",
      kid: APPLICATION_ID
    })
  }
  
  const encodeData = (data) => {
    return Buffer.from(JSON.stringify(data)).toString("base64").replace("=", "")
  }
  
  const getJWTBody = (exp) => {
    const timestamp = Math.floor((new Date()).getTime() / 1000)
    return encodeData({
      iss: "enablebanking.com",
      aud: "api.tilisy.com",
      iat: timestamp,
      exp: timestamp + exp,
    })
  }
  
  const signWithKey = (data) => {
    const key = fs.readFileSync(KEY_PATH, "utf8");
    const hmac = jwa("RS256");
    return hmac.sign(data, key);
  }
  
  const getJWT = (exp = 3600) => {
    const jwtHeaders = getJWTHeader()
    const jwtBody = getJWTBody(exp);
    const jwtSignature = signWithKey(`${jwtHeaders}.${jwtBody}`)
    return `${jwtHeaders}.${jwtBody}.${jwtSignature}`
  }
  
  module.exports = {
    getJWT: getJWT,
  }
  
