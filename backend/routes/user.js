// load and import the required module and files
const express = require("express");
const User = require("../models/userModel.js");
const axios = require("axios");
const redisClient = require("../cache/redisCache.js");
const UserValidationSchema = require("../joiValidation/userValidation.js");

const router = express.Router();

/**
 * @log message
 */
var log = { status: true, message: "" };

/** server the catcha to google server and verify the result
   @return Boolean 
*/
async function verifyCaptcha(captcha) {
  // google captcha url to interact with google API
  const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCA_TOKEN}&response=${captcha}`;
  try {
    const res = await axios.get(verifyUrl);
    const result = res.data;
    console.log(result.score);

    // result is successful and score is greater than 0.5 true 
    if (result.success) {
      if (result.score > 0.5) return true;
    }
    return false;
  } catch {
    return false;
  }
};

/**  @return the internal ip of the machine */
const getIp = (req) => {
  return req.connection.remoteAddress || req.headers["x-forwarded-for"];
};

/**  
 * @return the number of seconds in the day to end 
 * */ 
const getSecondsLeft = () => {
  const date = new Date();
  const secondsTillNow = date.getHours() * 60 * 60 + date.getMinutes() * 60 + date.getSeconds();
  return 24 * 60 * 60 - secondsTillNow;
};

/** redis cache middleware to check wheather the ip is register or not
 *  @explain store the ip and its count for 1 day not with respect to user
  * @return the count of the visit upto 3 after that it does not get updated
*/
function IPcache(req, res, next) {
  // get the remote ip of the user
  const ip = getIp(req);
  console.log("Your local ip: ",ip);
  
  if (!ip) next();

  // call the redis client for the look up of the ip count
  redisClient.get(ip, (error, data) => {
    
    if (error) {
      next();
    }
    
    /**
     * if ip is found and check for the frequency 
     * if frequence <= 3 increament the frequency by 1
     * other wise do nothing
     */
    if (data !== null) {
      const freq = +data;
      if (freq <= 3) {
        redisClient.del(ip);
        redisClient.setex(ip, getSecondsLeft(), freq + 1);
        log.message = freq + 1;
      } else {
        log.message = freq;
      }
      log.status = true;
      res.status(200).send(log);
    } else {
      next();
    }

  });

}

/** 
 * @get call to get the actuall count of the ip
 * @return status 200 if everthing is find
 * otherwise:
 * @return status 404 there is problem with finding the ip
 */
router.get("/ip/address", IPcache, (req, res) => {
  const ip = getIp(req);
  
  if (!ip) {
    log.status = false;
    log.message = "no ip found something is wrong";
    res.status(404).send(log);
  } else {
    // if ip is not in cache then enter the ip in cache 
    const secondsLeft = getSecondsLeft();
    console.log("timeLeft: ",secondsLeft);
    redisClient.setex(ip, secondsLeft, 1);
    log.status = true;
    log.message = 1;
    res.status(200).json(log);
  }
});

/**
 * @post register the user to our database
 * check for captcha validation if ip count >= 3
 * @validation check for input validation using JOI schema
 */
router.post("/registerUser", async (req, res) => {
  const IPfreq = req.body.IPfreq;

  let isVerified = true;

  // check for the captcha verifaction if frequency of ip of the user is greater than 3
  if(IPfreq > 3) isVerified = await verifyCaptcha(req.body.captcha);
    console.log("IP verified: ",isVerified);
  if(!isVerified) {
    log.status = false;
    log.message = "You are a Bot :))";  
    return res.status(401).send()
  }

  // check for input feild validation
  try {
    await UserValidationSchema.validateAsync(req.body.reg);
    const userInfo = new User(req.body.reg);
    await userInfo
      .save()
      .then((data) => {
        console.log(data);
        log.message = true;
        log.message = "User created";
        res.status(201).send(log);
      })
      .catch((error) => {
        log.status = false;
        if(error.code === 11000) log.message = "email id already used";
        else log.message = error.errmsg;
        res.status(500).send(log);
      });
  } catch (error) {
    const fieldError = error.details[0].context.key;
    let message = error.details[0].message;
    
    // crop the low level matching pattern logic
    if(fieldError == "password"){
      let totalChar = 0;
      for(let index=0;index<message.length;index++){
        if(message[index] == ':') break;
        totalChar++;
      }
      message = message.substring(0,totalChar);
    }

    log.status = false;
    log.message = message;
    res.status(406).send(log);
  }
});

/**
 * @implemation not implement in frontend
 * @get find the user in our database
 * @validation has not been done
 */
router.get("/findUser", async (req, res) => {
  const info = req.body;
  try {
    const user = await User.findOne({ email: info.email }).exec();

    if (!user) {
      log.status = false;
      log.message = "user not found";
      res.status(404).send(log);
    } else {
      user.comparePassword(info.password, (error, isMatch) => {
        if (error) {
          log.message = error.errmsg;
          log.status = false;
          return res.status(400).send(log);
        }
        if (!isMatch) {
          log.message = "password does not match";
          log.status = false;
          res.status(401).send(log);
        } else {
          log.message = "password match";
          res.status(202).send(log);
        }
      });
    }
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;
