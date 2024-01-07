var express = require('express');
var router = express.Router();

const userModel = require('./users');
const postModel = require('./posts');

const upload = require('./multer');

const passport = require('passport');
const localStrategy = require('passport-local');
passport.use(new localStrategy(userModel.authenticate()));

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/login', function(req, res, next) {
  // console.log(req.flash("error"));
  res.render('login', {error : req.flash("error")});
});

router.get('/feed', function(req, res) {
  res.render("feed");
});

router.post('/upload', isLoggedIn, upload.single("file"), async function(req, res, next) {
  if(!req.file) {
    return res.status(404).send("no files were given");
  }
  const user = await userModel.findOne({username : req.session.passport.user});
  const post = await postModel.create({
    image : req.file.filename,
    imageText : req.body.filecaption,
    user : user._id,         //giving the user's id to the post uploaded by the user
  });

  user.posts.push(post._id);  //giving post's post id to the user
  await user.save();
  res.redirect('/profile');
});

router.get('/profile', isLoggedIn, async function(req, res) {
  const user = await userModel.findOne({
    username : req.session.passport.user
  })
  .populate('posts');   //converting the post id into real post data using .populate()
  console.log(user);
  res.render("profile", {user});
});

router.post('/register', function(req, res) {
  const { username, email, fullname } = req.body;
  const userData = new userModel({ username, email, fullname });

  userModel.register(userData, req.body.password)
      .then(function() {
        passport.authenticate("local")(req, res, function() {
          res.redirect('/profile');
        })
      })
  
});

router.post('/login', passport.authenticate("local", {
  successRedirect : "/profile",
  failureRedirect : '/login',
  failureFlash : true,
}), function(req, res) {});

//passport logout code is changed so referred the documentation 
router.get('/logout', function(req, res, next) {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
})

function isLoggedIn(req, res, next) {
  if(req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
};

module.exports = router;

