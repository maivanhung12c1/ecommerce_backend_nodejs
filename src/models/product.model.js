'use strict'

const {Schema, model} = require('mongoose'); // Erase if already required
const { default: slugify } = require('slugify');
const DOCUMENT_NAME = 'Product'
const COLLECTION_NAME = 'Products'

// Declare the Schema of the Mongo model
const productSchema = new Schema({
    productName: {
        type: String,
        required: true,
    },
    productThumb: {
        type: String,
        required: true,
    },
    productDescription: {
        type:String,
    },
    productSlug: {
        type:String,
    },
    productPrice: {
        type: Number,
        required: true,
    },
    productQuantity: {
        type: Number,
        required: true,
    },
    productType: {
        type: String,
        required: true,
        enum: ['Electronics', 'Clothing', 'Furniture'],
    },
    productShop: {
        type: Schema.Types.ObjectId,
        ref: 'Shop',
    },
    productAttributes: {
        type: Schema.Types.Mixed,
        required: true,
    },
    productRatingAverage: {
        type: Number,
        default: 4.5,
        min: [1, 'Rating must be above 1.0'],
        max: [5, 'Rating must be below 5.0'],
        set: (val) => Math.round(val*10) / 10,
    },
    productVariations: {
        type: Array,
        required: [],
    },
    isDraft: {
        type: Boolean,
        default: true,
        index: true,
        select: false,
    },
    isPublished: {
        type: Boolean,
        default: false,
        index: true,
        select: false,
    },
}, {
    collection: COLLECTION_NAME,
    timestamps: true
});

// create index for search
productSchema.index({productName: 'text', productDescription: 'text'})

// Document middleware: runs before .save() and .create()...
productSchema.pre('save', function(next) {
    this.productSlug = slugify(this.productName, {lower: true})
    next()
})

const clothingSchema = new Schema({
    brand: {type: String, required: true},
    size: String,
    material: String,
}, {
    collection: 'clothes',
    timestamps: true,
})

const electronicSchema = new Schema({
    manufature: {type: String, required: true},
    model: String,
    color: String,
}, {
    collection: 'electronics',
    timestamps: true,
})

module.exports = {
    product: model(DOCUMENT_NAME, productSchema),
    electronic: model('Electronics', electronicSchema),
    clothing: model('Clothing', clothingSchema),
}