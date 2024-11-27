const fs = require('fs');
// // const index = fs.readFileSync('index.html', 'utf-8');
// const data = JSON.parse(fs.readFileSync('data.json', 'utf-8'));
// const products = data.products;
const Product=require('../model/product').Product

const parseQueryParams = (query) => {
  const parsedParams = {};

  // Iterate through each key-value pair in the query object
  for (let key in query) {
    if (query.hasOwnProperty(key)) {
      const value = query[key];

      // Check if the value is a string that can be converted to a number
      const parsedValue = Number(value);

      // If it's a valid number, use the number; otherwise, use the string
      parsedParams[key] = isNaN(parsedValue) ? value : parsedValue;
    }
  }

  return parsedParams;
};


exports.createProduct = (req, res) => {
  console.log("body:",req.body);
  // products.push(req.body);
  const product= new Product(req.body)
  product.save() .then((result) => {
    res.status(201).json(result)  
  })
  .catch((err) => {
    res.status(400).json(err)  
    console.error('Error saving user:', err);
  })
  
  // res.status(201).json(req.body);
};

exports.getAllProducts = async(req, res) => {
  let query=  Product.find()
  const parsedQuery = parseQueryParams(req.query);


  // filter to get product above 1500 price range : {price:{$gt:1500}}
  if(Object.keys(parsedQuery).length>0) {
    
    const sortedProducts=await query.sort(parsedQuery).exec()
    res.status(200).json(sortedProducts)
  }
  else{
    const products= await query.exec();

    res.status(200).json(products);
  }
};

exports.getProduct = async(req, res) => {
  const id = req.params.id;
  const product = await Product.findById(id);
  res.json(product);
};
exports.replaceProduct = async(req, res) => {
  const id = req.params.id;
  try{
  const doc= await Product.findOneAndReplace({_id:id},req.body,{new:true})
  res.status(201).json(doc)

  }catch(error){
    error=>console.log({error})
  }
  
};
exports.updateProduct = async(req, res) => {
  const id = req.params.id;
  try{
  const doc= await Product.findOneAndUpdate({_id:id},req.body,{new:true})
  res.status(201).json(doc);
  }catch(err){console.log({err})}
};
exports.deleteProduct = async (req, res) => {
  const id = req.params.id;
  try{
  const doc= await Product.findOneAndDelete({_id:id})
  res.status(200).json(doc);
  }catch(err){console.log(err)}
};