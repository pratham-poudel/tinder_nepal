const chatModel = require("./chatModel");

chatModel
const io = require( "socket.io" )();
const socketapi = {
    io: io
};
function isLoggedin(req,res,next){
    let token =  req.cookies.token;
   if(!token){
     res.redirect("/signin")
  }else if (token){
    let data = jwt.verify(token,"secretkey");
    req.user = data;
    next();
  }
  }

// Add your socket.io logic here!
io.on( "connection", function( socket ) { 
    socket.on('newchat', function(data){
        socket.broadcast.emit('loadnewchat', data);
    });
    socket.on('loadPreviousMessages', async function({ sender, receiver })  {
       var chat= await  chatModel.find({ $or: [{ sender: sender, receiver: receiver }, { sender: receiver, receiver: sender }] })
        // const chatMessages = messages.filter(
        //     msg => (msg.sender === sender && msg.receiver === receiver) || (msg.sender === receiver && msg.receiver === sender)
        // );
        socket.emit('previousMessages', { messages: chat });
    });
});
// end of socket.io logic

module.exports = socketapi;