
function loggerMiddleware(req,res,next){
    // console.log(req.originalUrl)
    // console.log(req.ip,req.method,req.hostname,req.get('User-Agent'))
    next()
}

const express=require("express")
const router=express.Router()
const morgan=require('morgan')
const testController=require('../controller/test')
// console.log(testController)
router.use(morgan('dev'))
router.use(loggerMiddleware)


// now we will use middleware params in our code 
// router.param('id',(req,res,next,id)=>{
//     req.us=users[id]
//     next()
// })

// const users=[{name:'sally'},{name:'hammad'}]



router.post('/',testController.create)

// we can pass more than 1 mw func to each endpoint separately 
// if we import fun and pass as mdware to get it will not work 
// it works only if we have mdware function in same file
router.get('/',loggerMiddleware,testController.getAll)
// it will print 2 times the url cause call 2 times in endpoint


router.get('/new',testController.renderRegisterPage)
// we always put url with params below the normal url 
// if we put /:id url above /new so on calling /new we get res(user get new)

// router.get('/:id',(req,res)=>{
//     res.send(`user get: ${req.params.id}`)
// })

// router.put('/:id',(req,res)=>{
//     res.send(`user updated : ${req.params.id}`)
// })

// router.delete('/:id',(req,res)=>{
//     res.send(`user deleted: ${req.params.id}`)
// })

// instead of this we can chain all these using code below

router.route('/:id')
.put((req,res)=>{
    res.send(`user updated : ${req.params.id}`)
})
.get(testController.get)
.delete((req,res)=>{
    res.send(`user deleted: ${req.params.id}`)
})

 

module.exports.router=router