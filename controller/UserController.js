const conn = require("../mariadb");
const { StatusCodes } = require("http-status-codes"); //status code 모듈
const jwt = require("jsonwebtoken");
const crypto = require("crypto"); //암호화 모듈
const dotenv = require("dotenv");
dotenv.config();

const join = (req, res) => {
  const { email, password } = req.body;

  let sql = "INSERT INTO users (email, password, salt) VALUES (?,?,?)";

  //회원가입 시 비밀번호를 암호화해서 암호화된 비밀번호와, salt 값을 같이 저장
  const salt = crypto.randomBytes(10).toString("base64");
  const hashPassword = crypto
    .pbkdf2Sync(password, salt, 10000, 10, "sha512")
    .toString("base64");

  let valuse = [email, hashPassword, salt];
  conn.query(sql, valuse, (err, results) => {
    if (err) {
      console.log(err);
      return res.status(StatusCodes.BAD_REQUEST).end();
    }

    return res.status(StatusCodes.CREATED).json(results);
  });
};

const login = (req, res) => {
  const { email, password } = req.body;

  let sql = "SELECT * FROM users WHERE email = ?";
  conn.query(sql, email, (err, results) => {
    if (err) {
      console.log(err);
      return res.status(StatusCodes.BAD_REQUEST).end();
    }

    const loginUser = results[0];

    //salt값 꺼내서 날 것인 비밀번호 암호화
    const hashPassword = crypto
      .pbkdf2Sync(password, loginUser.salt, 10000, 10, "sha512")
      .toString("base64");

    //=> 디비 비밀번호 비교
    if (loginUser && loginUser.password == hashPassword) {
      //토큰 발행
      const token = jwt.sign(
        {
          email: loginUser.email,
        },
        process.env.PRIVATE_KEY,
        {
          expiresIn: "5m",
          issuer: "minsik",
        }
      );

      res.cookie("token", token, {
        httpOnly: true,
      });
      console.log(token);

      return res.status(StatusCodes.OK).json(results);
    } else {
      res.status(StatusCodes.UNAUTHORIZED).end(); //401 : Unauthorized(미인증) , 403 : Forbidden(접근 권리 없음)
    }
  });
};

const passwordResetrequest = (req, res) => {
  const { email } = req.body;

  let sql = "SELECT * FROM users WHERE email = ?";
  conn.query(sql, email, (err, results) => {
    if (err) {
      console.log(err);
      return res.status(StatusCodes.BAD_REQUEST).end();
    }

    const user = results[0];
    if (user) {
      return res.status(StatusCodes.OK).json({
        email: email,
      });
    } else {
      return res.status(StatusCodes.UNAUTHORIZED).end();
    }
  });
};

const passwordReset = (req, res) => {
  const { email, password } = req.body;
  let sql = "UPDATE users SET password = ?, salt =? WHERE email = ?";

  const salt = crypto.randomBytes(10).toString("base64");
  const hashPassword = crypto
    .pbkdf2Sync(password, salt, 10000, 10, "sha512")
    .toString("base64");

  let valuse = [hashPassword, salt, email];
  conn.query(sql, valuse, (err, results) => {
    if (err) {
      console.log(err);
      return res.status(StatusCodes.BAD_REQUEST).end();
    }

    if (results.affectedRows) {
      return res.status(StatusCodes.OK).json(results);
    } else {
      return res.status(StatusCodes.BAD_REQUEST).end();
    }
  });
};

module.exports = {
  join,
  login,
  passwordResetrequest,
  passwordReset,
};
