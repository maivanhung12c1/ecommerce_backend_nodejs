'use strict'

const {model, Schema, Types} = require('mongoose'); // Erase if already required

const DOCUMENT_NAME = 'Discount'
const COLLECTION_NAME = 'Discounts'

// Declare the Schema of the Mongo model
const discountSchema = new Schema({
    discountName: {type: String, required: true},
    discountDescription: {type: String, required: true},
    discountType: {type: String, default: 'fixed_amount'}, // default: 'percentage'
    discountValue: {type: Number, required: true},
    discountCode: {type: String, required: true},
    discountStartDate: {type: Date, required: true}, // Start date
    discountEndDate: {type: Date, required: true}, // End date
    discountMaxUses: {type: Number, required: true}, // Number of discount
    discountUsesCount: {type: Number, required: true}, // The number of used discount 
    discountUsersUsed: {type: Array, default: []}, // Who 
    discountMaxUsesPerUser: {type: Number, required: true}, // The max number which allow one user can use
    discountMinOrderValue: {type: Number, required: true},
    discountMaxValue: {type: Number, required: true},
    discountShopId: {type: Schema.Types.ObjectId, ref: 'Shop'},
    discountIsActive: {type: Boolean, default: true},
    discountAppliesTo: {type: String, required: true, enum: ['all', 'specific']},
    discountProductIds: {type: Array, default: []} // Which products can be apply this discount  
}, {
    timestamps: true,
    collection: COLLECTION_NAME
});

//Export the model
module.exports = {
    discount: model(DOCUMENT_NAME, discountSchema),
}