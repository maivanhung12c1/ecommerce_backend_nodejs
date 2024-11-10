'use strict'

const {model, Schema, Types} = require('mongoose'); // Erase if already required

const DOCUMENT_NAME = 'Inventory'
const COLLECTION_NAME = 'Inventories'

// Declare the Schema of the Mongo model
const inventorySchema = new Schema({
    invenProductId: {type: Schema.Types.ObjectId, ref: 'Product'},
    invenLocation: {type: String, default: 'unKnow'},
    invenStock: {type: Number, required: true},
    invenShopId: {type: Schema.Types.ObjectId, ref: 'Shop'},
    invenReservations: {type: Array, default: []}
    /**
     * When someone add to cart, data will be stored in invenReservations
     * When someone order, we will substract invenStock, we will delete order in invenReservations when the payment comlete 
     */
}, {
    timestamps: true,
    collection: COLLECTION_NAME
});

//Export the model
module.exports = {
    inventory: model(DOCUMENT_NAME, inventorySchema),
}