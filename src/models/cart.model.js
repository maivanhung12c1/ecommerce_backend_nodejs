'use strict'

const {model, Schema, Types} = require('mongoose'); // Erase if already required

const DOCUMENT_NAME = 'Cart'
const COLLECTION_NAME = 'Carts'

// Declare the Schema of the Mongo model
const cartSchema = new Schema({
    cartState: {
        type: String, 
        required: true, 
        enum: ['active', 'completed', 'failed', 'pending'],
        default: 'active'
    },
    cartProducts: {type: Array, required: true, default: []},
    cartCountProduct: {type: Number, default: 0},
    cartUserId: {type: Number, required: true},

}, {
    timestamps: true,
    collection: COLLECTION_NAME
});

//Export the model
module.exports = {
    cart: model(DOCUMENT_NAME, cartSchema),
}