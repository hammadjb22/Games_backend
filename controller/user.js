// const fs = require('fs');
// const index = fs.readFileSync('index.html', 'utf-8');
// const data = JSON.parse(fs.readFileSync('data.json', 'utf-8'));
// const users = data.users;

const User=require('../model/user').User


exports.getAllUsers = async(req, res) => {
  const user= await User.find()
  if(req.query){
   const products=await user.sort(req.query).exec()
   res.sendStatus(200).json(products)
  }else{
  // filter to get product above 1500 price range : {price:{$gt:1500}}
  res.json(user);
  }
};

exports.getUser = async(req, res) => {
  const id = req.params.id;
  const user = await User.findById(id);
  res.status(200).json(user);
};
exports.replaceUser = async(req, res) => {
  const id = req.params.id;
  try{
  const doc= await User.findOneAndReplace({_id:id},req.body,{new:true})
  res.status(201).json(doc)

  }catch(error){
    error=>console.log({error})
  }
  
};
exports.updateUser = async(req, res) => {
  const id = req.params.id;
  try{
  const doc= await User.findOneAndUpdate({_id:id},req.body,{new:true})
  res.status(201).json(doc);
  }catch(err){console.log({err})}
};
exports.deleteUser = async (req, res) => {
  const id = req.params.id;
  try{
  const doc= await Product.findOneAndDelete({_id:id})
  res.status(200).json(doc);
  }catch(err){console.log(err)}
};