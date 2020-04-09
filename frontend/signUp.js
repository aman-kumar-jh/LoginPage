const password = document.getElementById("psw");
const letter = document.getElementById("letter");
const capital = document.getElementById("capital");
const number = document.getElementById("number");
const length = document.getElementById("length");
const message = document.getElementById("message");
const submit = document.getElementById("submitForm");
const username = document.getElementById("username");
const email = document.getElementById("email");
const siteKey = "6Lf1fOcUAAAAAMQTeUtWGVPwuAyFumObDFCkI-l9";

var generic;


/**
 * @ajax call to get the data from the backend 
 * */ 
async function ajax(url, method, data) {
  return new Promise(function (resolve, reject) {
    var request = new XMLHttpRequest();
    request.open(method, url, true);
    request.responseType = "text";
    request.setRequestHeader("Content-Type", "application/json");
    request.onreadystatechange = function () {
      console.log(request);
      if (request.readyState === XMLHttpRequest.DONE) {
        if (request.status === 201 || request.status == 200) {
          resolve(request.responseText);
        } else {
          reject(request.responseText);
        }
      }
    };
    request.onerror = function () {
      reject(Error("Network Error"));
    };
    request.send(data);
  });
}

/**
 * 
 * @param {user registration information} data 
 * @param {google recaptcha token id} token
 * 
 * register the user in database 
 */
async function RegisterUser(data,token) {
  // this message is shown when user sucessful get register in our database  
  let msg = "SignUp Sucessful, Welcome To Heaven"
    
    /**
     * if count of ip is greater than 3 then
     * add token the data 
     * add Human to the msg just to indentify that it is captcha verified
     *  */  
    if(token !== ""){
      data["captcha"] = token;
      msg+=" Human";
    }
    
    /**
     * making ajax call to our API
     */
    await ajax(
      "http://127.0.0.1:3000/registerUser",
      "POST",
      JSON.stringify(data)
    )
      .then(function (result) {
        result = JSON.parse(result);
        if (result.status === true) {
          alert(msg);
          location.reload();
        } else {
          alert(result.message);
        }
      })
      .catch((err) => {
        err = JSON.parse(err);
        alert(err.message);
      });

      location.reload();
}

/**
 * validator for checking the password field
 */
const validators = {
  lowerCaseLetters: /[a-z]/g,
  upperCaseLetters: /[A-Z]/g,
  numbers: /[0-9]/g,
  minLength: 8,
  maxLength: 16,
  correct: false,
};

/**
 * @class to add class event
 * @event {remove class,add class,event listner}
 */
class Generic {
  addClass(el, className) {
    el.classList.add(className);
  }
  removeClass(el, className) {
    el.classList.remove(className);
  }
  addEvent(el, event, callback) {
    el.addEventListener(event, callback);
  }
}

/**
 * @toogle password visiblity
 */
function visible() {
  //if(!password) console.log("fuck");
  if (password.type === "text") {
    password.type = "password";
  } else {
    password.type = "text";
  }
}

/**
 * javascript event listner
 * @event {keyup,focus,click}
 */
function eventListeners() {
  generic.addEvent(password, "keyup", keyupC);
  generic.addEvent(password, "focus", focusC);
  generic.addEvent(submit, "click", submitC);
}

// When the user clicks on the password field, show the message box
var focusC = function () {
  message.style.display = "block";
};

/**
 * When the user starts to type something inside the password field
 * @check for validation of password
 * @lock submit button until password is not validated
 */

var keyupC = function () {
  const validate = new Validate();
  validate.check();
  if (validate.isPasswordCorrect()) {
    submit.style.pointerEvents = "auto";
  } else {
    submit.style.pointerEvents = "none";
  }
};

/**
 * 
 * @param {event listner} e
 * @call {register User} when some click on submit
 *  
 */
var submitC = async function (e) {
  e.preventDefault();

  // check for email and name null values
  if(email.value === ""){
    alert("Enter Valid Email");
    location.reload();
    return;
  }else if(username.value === ""){
    alert("Enter Valid Name");
    location.reload();
    return;
  }

  /**
   * get count of ip address in 1 day which try to register
   * count range will in [0,4]
   * once count of ip reaches it remain the same
   */
  let IPfreq = 0;
  await ajax("http://127.0.0.1:3000/ip/address", "GET", JSON.stringify({}))
    .then((data) => {
      data = JSON.parse(data);
      if (data.status === true) {
        IPfreq = data.message;
      } else {
        alert(data.message);
        password.textContent = "";
      }
    })
    .catch((err) => {
      console.log(err);
      alert("Something went wrong, Please try again");
      //location.reload();
    });
  
  // data of the user registration form 
  const data = {
    reg: {
      name: username.value,
      email: email.value,
      password: password.value,
    },
    IPfreq: IPfreq,
  };
  
  /**
   * if count of ip of the user is greater than 3
   * then check for google recaptcha
   * then register the user 
   * */ 
  if (IPfreq > 3) {
    grecaptcha.ready(function () {
      grecaptcha
        .execute(siteKey, { action: "homepage" })
        .then(function (token) {
          data["captcha"] = token;
          RegisterUser(data,token);
        });
    });
  } else {
    RegisterUser(data,"");
  }
};

/**
 * Validate Class for the check of password validation
 */
class Validate {
  correct;

  isPasswordCorrect() {
    return this.correct;
  }
  check() {
    if (password.value.match(validators.lowerCaseLetters)) {
      generic.removeClass(letter, "invalid");
      generic.addClass(letter, "valid");
      this.correct = true;
    } else {
      generic.removeClass(letter, "valid");
      generic.addClass(letter, "invalid");
      this.correct = false;
    }

    // Validate capital letters
    if (password.value.match(validators.upperCaseLetters)) {
      generic.removeClass(capital, "invalid");
      generic.addClass(capital, "valid");
      this.correct = true;
    } else {
      generic.removeClass(capital, "valid");
      generic.addClass(capital, "invalid");
      this.correct = false;
    }

    // Validate numbers
    if (password.value.match(validators.numbers)) {
      generic.removeClass(number, "invalid");
      generic.addClass(number, "valid");
      this.correct = true;
    } else {
      generic.removeClass(number, "valid");
      generic.addClass(number, "invalid");
      this.correct = false;
    }

    // Validate length
    if (
      password.value.length >= validators.minLength &&
      password.value.length <= validators.maxLength
    ) {
      generic.removeClass(length, "invalid");
      generic.addClass(length, "valid");
      this.correct = true;
    } else {
      generic.removeClass(length, "valid");
      generic.addClass(length, "invalid");
      this.correct = false;
    }
  }
}

/**
 * @intialize generic class & event listeners
 */
function init() {
  generic = new Generic();
  eventListeners();
}


init();
