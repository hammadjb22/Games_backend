// const testRouter=require('../routes/test')
const users=[{name:'sally'},{name:'hammad'}]

// we will create a middleware function logger to print hit url
// logger function is applicable to the endpoints defined below it




exports.getAll=(req,res)=>{
    res.json(JSON.stringify(users))
}

exports.renderRegisterPage=(req,res)=>{
    // res.send("new user")
    res.render("../views/users/new",{firstname:null})
}
exports.create=(req,res)=>{
    const isValid=true
    if(isValid){
        users.push({name:req.body.firstname})
        res.redirect(`/test/${users.length-1}`)
    }
    else{
        console.log("error")
        res.render('../views/users/new',{firstname:req.body.firstname})
    }
    // res.send("user created")
}
exports.get=(req,res)=>{
    // console.log(req.us)
    res.send(`user get: ${JSON.stringify(users[req.params.id])}`)
}