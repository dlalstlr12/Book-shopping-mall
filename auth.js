const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

function ensureAuthorization(req, res) {
  try {
    let receivedJwt = req.headers["authorization"];
    console.log("receivedJwt: ", receivedJwt);

    if (receivedJwt) {
      let decodedUserInfo = jwt.verify(receivedJwt, process.env.PRIVATE_KEY);
      console.log("decodedUserInfo: ", decodedUserInfo);
      return decodedUserInfo;
    } else {
      throw new ReferenceError(`jwt must be provided`);
    }
  } catch (err) {
    console.log(err.name);
    console.log(err.message);

    return err;
  }
}

module.exports = ensureAuthorization;
