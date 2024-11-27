const mongoose = require('mongoose');
const {Schema}=mongoose

// Schema

const productSchema = new Schema({
    title: {type:String,required:true}, // String is shorthand for {type: String}
    description:String,
    price:{type:Number,min:0,required:true},
    discountPercentage:{type:Number,min:0,max:50,required:true},
    rating:{type:Number,min:0,max:5,required:true},
    brand:{type:String,required:true},
    category:{type:String,required:true},
    thumbnail:{type:String,required:true},
    images:[String]
  });

  exports.Product = mongoose.model("Product", productSchema)