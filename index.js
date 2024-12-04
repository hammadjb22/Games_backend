

const mongoose = require('mongoose');
const express = require('express')
const http = require('http'); // Import http to create a server
const { Server } = require('socket.io'); // Import socket.io for real-time communication
const app= express()
app.set('view engine','ejs')
require('dotenv').config()
const jwt=require('jsonwebtoken')
// console.log(process.env.DB_PASSWORD)
const productRouter = require('./routes/product')
const userRouter = require('./routes/user')
const testRouter=require('./routes/test')
const authRouter=require('./routes/auth')
const fs=require('fs')
const path=require('path');
const setupSocket = require('./Sockets/Game');
// const publicKey=fs.readFileSync(path.resolve(__dirname,'./public.key'),'utf-8')

const server = http.createServer(app);


// WebSocket Setup for Real-Time Game Connections

setupSocket(server);


// dbConnection
main().catch(err => console.log(err));

async function main() {
  await mongoose.connect(process.env.MONGOOSE_CON);
  console.log('db connected..')
  // use `await mongoose.connect('mongodb://user:password@127.0.0.1:27017/test');` if your database has auth enabled
}

const auth=(req,res,next)=>{
    const token= req.get('Authorization').split(' ')[1]
    // console.log(token)
    try{
       
        const decode = jwt.verify(token, publicKey);
        // console.log(decode)        
        if(decode.email){
            next()
        }
    }
    catch(err){
        console.log({err})
        res.status(401).json({error:"invalid token"})
    }
}


// middlewares
app.use(express.urlencoded({extended:true}))
app.use(express.json())
app.use('/auth',authRouter.router)
app.use("/test",testRouter.router)
app.use('/products',auth,productRouter.router);
app.use('/users',auth,userRouter.router);
// app.use((req,res,next)=>{
//     console.log(req.query.name, req.query.age, req.query.subject)
//     next()
// })




// endpoints
app.get('/',(req,res)=>{
    // res.send('hello')
    // res.json({name:'hammad'})
    // res.sendStatus(500)
    // res.status(500).json({name:'hammad'})
    // res.download('server.js')
    // res.send('helloworld')
    res.render("index",{text:'hammad'})
})
app.get('/params/:name/:subject',(req,res)=>{
    console.log(req.params)
    res.send(req.params)
})


console.log(process.env.PORT)
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
// app.listen(3000,()=>console.log('listening'))