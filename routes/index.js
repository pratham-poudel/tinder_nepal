var express = require('express');
var router = express.Router();
const userModel = require('./users');
const session = require('express-session');
jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const upload=require('./multer');
const chatModel = require('./chatModel');
require('dotenv').config();
const passport=require('passport');
require('./passport');

router.use(passport.initialize());
router.use(passport.session());

router.get('/auth/google',passport.authenticate('google',{scope:['email','profile']


}));
router.get('/auth/google/callback',passport.authenticate('google',{
  successRedirect:'/success',
  failureRedirect:'/failure',
}))
router.get('/success', async function(req, res, next) {
  console.log(req.user)
  
      let user = await userModel.findOne({email: req.user.email});
    if(user){
      const token = jwt.sign(req.user.email,process.env.TOKEN)
      res.cookie("token",token);
      res.redirect('/profile')
    }else{
      let createdUser = await userModel.create({
        fullName: req.user.displayName,
        email: req.user.email,
        password: 'Signed up from google',
        verified: true,
      });
      const token = jwt.sign(req.user.email,process.env.TOKEN)
      res.cookie("token",token);
      await sendEmail(req.user.email, 'Welcome to Tinder Nepal!', `
<html>
<head>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 40px auto;
            padding: 20px;
            background-color: #ffffff;
            border-radius: 10px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        h1 {
            color: #ff5864;
            text-align: center;
        }
        p {
            color: #333333;
            font-size: 16px;
            line-height: 1.6;
        }
        .button {
            display: block;
            width: 200px;
            margin: 20px auto;
            padding: 10px 0;
            text-align: center;
            color: #ffffff;
            background-color: #ff5864;
            border-radius: 5px;
            text-decoration: none;
            font-size: 16px;
        }
        .footer {
            margin-top: 20px;
            text-align: center;
            color: #666666;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Welcome to Tinder Nepal!</h1>
        <p>Dear ${req.user.displayName},</p>
        <p>We are thrilled to have you on board! Your journey to finding meaningful connections begins here.</p>
        <p>At Tinder Nepal, we believe in creating a welcoming and fun environment for everyone. We hope you enjoy using our platform to meet new people and make lasting connections.</p>
        <p>Get started by exploring your matches, sending messages, and making the most of what Tinder Nepal has to offer.</p>
        <a href="https://tinder-nepal.onrender.com/" class="button">Get Started</a>
        <div class="footer">
            <p>If you have any questions or need assistance, feel free to contact our support team at prathampoudel2@gmail.com</p>
            <p>Happy matching!</p>
            <p>Best regards,</p>
            <p>The Tinder Nepal Team</p>
        </div>
    </div>
</body>
</html>
`);

      res.redirect('/profile');
    }
});




const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.user,
    pass: process.env.pass,
  },
});

// Define a function to send email
async function sendEmail(to, subject, html) {

  try {
    // Compose the email
    const mailOptions = {
      from: 'ppoudel_be23@thapar.edu',
      to: to,
      subject: subject,
      html: html,

    };

    // Send the email
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

/* GET home page. */
router.get('/', function(req, res, next) {

 




  if(req.cookies.token){
    res.redirect('/profile');
  }else{
    res.render('index', { title: 'Express' });
  }
  
});

//login and signup routes
router.get('/signin', function(req, res, next) {
  res.render('signin');
});
router.get('/signup', function(req, res, next) {
  res.render('signup');
});
router.post('/login', async function(req, res, next) {
  
  let user = await userModel.findOne({email: req.body.email});
  if (!user) {
    res.send("User not found");
    return;
  }else if(user.password !== req.body.password){
    res.send("Email or Password is incorrect");
  }else if(user.password === req.body.password){
    let token = jwt.sign(req.body.email,process.env.TOKEN)
    res.cookie("token",token)
    res.redirect('/profile');
    
  }
  

})
router.post('/signup', async function(req, res, next) {
  console.log(req.body);
  let user = await userModel.findOne({email: req.body.email});
    if(!user){
      let createdUser = await userModel.create({
        fullName: req.body.name,
        email: req.body.email,
        password: req.body.password
      });
      const token = jwt.sign(req.body.email,process.env.TOKEN)
      res.cookie("token",token)
      res.redirect('/verifyemail');
    }else{
      res.send("User already exists");
    }
 
})
router.get('/logout', function(req, res, next) {
  res.clearCookie("token");
  res.render('index');
 
});
 function isLoggedin(req,res,next){
  let token =  req.cookies.token;
 if(!token){
   res.redirect("/signin")
}else if (token){
  let data = jwt.verify(token,process.env.TOKEN);
  req.user = data;
  next();
}
}
router.get('/profile',isLoggedin, async function(req, res, next) {
  let email= req.user;
  
  const user =await  userModel.findOne({email: email});
  if(user.verified){
    res.render('profile',{user, footer: true });  
  }else{
    res.redirect('/verifyemail');
  }
  
res.render('profile',{user});
})


router.get('/verifyemail', isLoggedin , async function(req,res){
  let email= req.user;
  let otp = Math.floor(10000 + Math.random() * 90000);
  await sendEmail(email, 'Otp for Tinder Nepal Verification', `<html>
  <head>
      <style>
          body {
              font-family: Arial, sans-serif;
          }
          .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              border: 1px solid #ccc;
              border-radius: 5px;
              background-color: #f9f9f9;
          }
          h2 {
              color: #333;
          }
          .otp {
              font-size: 24px;
              margin-bottom: 20px;
          }
          .footer {
              margin-top: 20px;
              color: #666;
          }
      </style>
  </head>
  <body>
      <div class="container">
          <h2>Otp for Tinder Nepal Verification</h2>
          <p>Your OTP is:</p>
          <div class="otp">${otp}</div>
          <p>Please use this OTP to verify your account.</p>
          <div class="footer">
              <p>If you did not request this OTP, please ignore this email.</p>
          </div>
      </div>
  </body>
  </html>`);
  
  req.session.otp = otp; 
  console.log(req.session.otp);
  res.render('otp');
});
router.post('/verifyotp',isLoggedin,async function(req,res){
  let email= req.user;
  const otp = Object.values(req.body).join('');
  console.log(otp);
  if(otp == req.session.otp){
    const user = await userModel.findOne({email:email});
    user.verified = true;
    await user.save();
    res.render('edit',{footer: true,user})
    // res.redirect('/profile');
    }else{
      res.send("Invalid OTP");
    }
  

})
router.get('/edit',isLoggedin, async function(req,res){
  let email = req.user;
  const user =await  userModel.findOne({email:email});

  res.render('edit',{footer: true,user});
})
const cpUpload = upload.fields([{ name: 'profilePicture', maxCount: 1 }, { name: 'carouselPicture', maxCount: 1 }])
router.post('/update', cpUpload, isLoggedin, async function (req, res, next) {
    try {
        let email = req.user;
        let user = await userModel.findOne({ email: email });

        if (req.files.profilePicture && req.files.profilePicture.length > 0) {
            user.profilePicture = req.files.profilePicture[0].filename;
        }

        if (req.files.carouselPicture && req.files.carouselPicture.length > 0) {
            user.carouselPicture = req.files.carouselPicture[0].filename;
        }
          user.jobTitle = req.body.jobTitle;
          user.age = req.body.age;
          user.bio = req.body.bio;
          user.fullName = req.body.name;
          user.username = req.body.username;
        
       

        await user.save();
        res.redirect('/profile');
        console.log(req.files);
        console.log(req.body);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error'); // or handle the error in a more appropriate way
    }
});

router.get('/feed',isLoggedin, async function(req,res){
  let email= req.user;
  let manxe = await userModel.findOne({email:email}).populate('matched');
  let users = await userModel.find({email:{$ne:email}}).populate('matched');
  res.render('feed',{users, manxe});
})
router.post('/addFriend', isLoggedin, async function(req, res) {
  try {
      let email = req.user;
      let user = await userModel.findOne({ email: email });
      let friend = await userModel.findOne({ _id: req.body.id });

      // Check if the requesting user's ID is already in the friend's requests array
      if (!friend.requests.includes(user._id)) {
          friend.requests.push(user._id);
          await friend.save();
      }

      res.status(200).json({ fullName: friend.fullName });
  } catch (error) {
      console.error('Error:', error);
      res.status(500).send('Internal Server Error'); // or handle the error in a more appropriate way
  }
});
router.get('/requests',isLoggedin, async function(req,res){
  let email= req.user;
  let user = await userModel.findOne({email:email}).populate('requests');
  let data = user.requests;
  res.render('requests',{user,footer: true});
})
router.post('/declineFriend', isLoggedin, async function(req, res) {
  try {
    let email = req.user;
    let user = await userModel.findOne({ email: email });

    if (!user) {
      return res.status(404).send('User not found');
    }

    // Remove the friend's request ID from the user's requests array
    const requestIdIndex = user.requests.indexOf(req.body.id);
    if (requestIdIndex !== -1) {
      user.requests.splice(requestIdIndex, 1);
      await user.save();
    } else {
      return res.status(404).send('Friend request not found');
    }

    res.status(200).json({ message: 'Friend request declined' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error'); // or handle the error in a more appropriate way
  }
});
router.post('/acceptFriend', isLoggedin, async function(req, res) {
  try {
    let email = req.user;
    let user = await userModel.findOne({ email: email });
    let friend = await userModel.findOne({ _id: req.body.id });

    if (!user || !friend) {
      return res.status(404).send('User not found');
    }

    // Add each other to matched lists
    if (!user.matched.includes(friend._id)) {
      user.matched.push(friend._id);
      await user.save();
    }

    if (!friend.matched.includes(user._id)) {
      friend.matched.push(user._id);
      await friend.save();
    }
    

    // Remove friend ID from user's requests
    const userRequestIndex = user.requests.indexOf(friend._id);
    if (userRequestIndex !== -1) {
      user.requests.splice(userRequestIndex, 1);
    }

    // Remove user ID from friend's requests
    const friendRequestIndex = friend.requests.indexOf(user._id);
    if (friendRequestIndex !== -1) {
      friend.requests.splice(friendRequestIndex, 1);
    }

    // Save both users
    await user.save();
    await friend.save();

    res.status(200).json({ fullName: friend.fullName });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error'); // or handle the error in a more appropriate way
  }
});
router.get('/friends',isLoggedin, async function(req,res){
  let email= req.user;
  let user = await userModel.findOne({email:email}).populate('matched');
  res.render('friends',{user,footer: true});
});
router.post('/removefriend', isLoggedin, async function(req, res) {
  try {
    const userEmail = req.user; // Assuming req.user contains the logged-in user's information
    const friendId = req.body.id;

    if (!friendId) {
      return res.status(400).json({ error: 'Friend ID is required' });
    }

    const user = await userModel.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const friend = await userModel.findOne({ _id: friendId });
    if (!friend) {
      return res.status(404).json({ error: 'Friend not found' });
    }

    const userIndex = user.matched.indexOf(friend._id);
    const friendIndex = friend.matched.indexOf(user._id);

    if (userIndex !== -1) {
      user.matched.splice(userIndex, 1);
    } else {
      return res.status(400).json({ error: 'Friend not found in user matches' });
    }

    if (friendIndex !== -1) {
      friend.matched.splice(friendIndex, 1);
    }

    await user.save();
    await friend.save();

    res.status(200).json({ fullName: friend.fullName });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
router.get('/messages',isLoggedin, async function(req,res){

  let email= req.user;  
  let user = await userModel.findOne({email:email}).populate('matched');
  res.render('messages',{user,footer: true,});
});
router.post('/sendmessages', isLoggedin, async function(req, res) {

  const chat = await chatModel.create({
    message: req.body.message,
    sender: req.body.sender,
    receiver: req.body.receiver,
  });
  console.log(chat);
  res.status(200).json({ message: 'Message sent',data:chat });
});







//authentication




module.exports = router;
