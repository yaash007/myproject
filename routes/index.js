var express = require('express');
var router = express.Router();
var userModel=require('./users');
const postModel=require('./post');
const passport = require('passport');
const localStrategy=require('passport-local')
const upload=require('./multer');

passport.use(new localStrategy(userModel.authenticate()));

function isloggedIn(req,res,next){
  if(req.isAuthenticated()){
   return next();
  }
  res.redirect('/')
 }

 router.get('/add',isloggedIn, async function(req, res, next) {
  const user=await userModel.findOne({username:req.session.passport.user});
  res.render("add",{user,nav:true})
});

router.post('/createpost',isloggedIn,upload.single("postimage"),async function(req,res,next){
  const user=await userModel.findOne({username:req.session.passport.user});
  const post= await postModel.create({
  user: user._id,
  title:req.body.title,
  description:req.body.description,
  image:req.file.filename
  })
  user.posts.push(post._id);
  await user.save();
  res.redirect("/profile")

})


router.get('/', function(req, res, next) {
  res.render('index',{nav:false});
});

router.get('/register',function(req,res,next){
  res.render("register",{nav:false});
});

router.get('/profile',isloggedIn,async function(req,res,next){
  const user=await userModel.findOne({username:req.session.passport.user})
  .populate("posts")
  console.log(user)
  res.render("profile",{user,nav:true})
});

router.get('/show/posts',isloggedIn,async function(req,res,next){
  const user=await userModel.findOne({username:req.session.passport.user})
  .populate("posts")
  res.render("show",{user,nav:true})
});

router.get('/feed',isloggedIn,async function(req,res,next){
  const user=await userModel.findOne({username:req.session.passport.user})
  const posts=await postModel.find()
  .populate("user");
  res.render("feed",{user,posts,nav:true});
});

router.post('/uploadfile',isloggedIn,upload.single('img'),async function(req,res){
const user=await userModel.findOne({username:req.session.passport.user});
user.profileImage=req.file.filename;
await user.save();
res.redirect('/profile');
})

router.post('/register',function(req,res,next){
  const userData=new userModel({
username:req.body.username,
name:req.body.fullname,
email:req.body.email,
contact:req.body.contact,
  })
  userModel.register(userData,req.body.password)
  .then(function(){
    passport.authenticate("local")(req,res,function(){
      res.redirect('/profile')
    })
  })
})

router.post('/login',passport.authenticate("local",{
  successRedirect:'/profile',
  failureRedirect:'/login',
}),function(req,res,next){
});

router.get("/logout",function(req,res){
req.logout(function(err){
  if(err){return next(err);}
  res.redirect('/')
});
})


module.exports = router;
