'use strict'

const { product, clothing, electronic } = require('../models/product.model')
const { BadRequestError, ForbiddenError } = require('../core/error.response')
const { ObjectId } = require('mongodb');
const { findAllDraftsForShop, publishProductByShop, findAllPublishForShop, unPublishProductByShop, searchProductByUser, findAllProducts, findProduct, updateProductById } = require('../models/repositories/product.repo');
const { removeUndefinedObject, updateNestedObjectParser } = require('../utils');
const { insertInventory } = require('../models/repositories/inventory.repo');

// define Factory class to create product
class ProductFactory {
    /**
     * type: 'Cothing'
     */
    // static async createProduct(type, payload) {
    //     switch (type) {
    //         case 'Electronics':
    //             return new Electronics(payload).createProduct()
    //         case 'Clothings':
    //             return new Clothing(payload).createProduct()
    //         default:
    //             throw new BadRequestError(`Invalid Product Types ${type}`)
    //     }
    // }

    static productRegistry = {} // key-class
    static registerProductType(type, classRef) {
        ProductFactory.productRegistry[type] = classRef
    }

    static async createProduct(type, payload) {
        const productClass = ProductFactory.productRegistry[type]
        if (!productClass) {
            throw new BadRequestError(`Invalid Product Type ${type}`)
        }
        return new productClass(payload).createProduct()
    }

    static async updateProduct(type, productId, payload) {
        const productClass = ProductFactory.productRegistry[type]
        if (!productClass) {
            throw new BadRequestError(`Invalid Product Type ${type}`)
        }
        console.log(`productClass ${productClass}`)
        console.log(`productClass(payload) ${JSON.stringify(payload)}`)
        return new productClass(payload).updateProduct(productId)
    }

    // put
    static async publishProductByShop({productShop, productId}) {
        return await publishProductByShop({productShop, productId})
    }

    static async unPublishProductByShop({productShop, productId}) {
        return await unPublishProductByShop({productShop, productId})
    }
    // end put

    // query
    static async findAllDraftsForShop({productShop, limit=50, skip=0}) {
        const query = {productShop, isDraft: true}
        return await findAllDraftsForShop({query, limit, skip})
    }

    static async findAllPublishForShop({productShop, limit=50, skip=0}) {
        const query = {productShop, isPublished: true}
        return await findAllPublishForShop({query, limit, skip})
    }

    static async searchProducts({keySearch}) {
        return await searchProductByUser({keySearch})
    }
    
    static async findAllProducts({limit=50, sort='ctime', page=1, filter={isPublished:true}}) {
        return await findAllProducts({limit, sort, page, filter, select: ['productName', 'productPrice', 'productThumb']})
    }

    static async findProduct({productId}) {
        return await findProduct({productId, unSelect:['__v']})
    }

    // end query

}

class Product {
    constructor({
        productName, productThumb, productDescription, productPrice,
        productType, productShop, productAttributes, productQuantity
    }) {
        this.productName = productName
        this.productThumb = productThumb
        this.productDescription = productDescription
        this.productPrice = productPrice
        this.productType = productType
        this.productShop = productShop
        this.productAttributes = productAttributes
        this.productQuantity = productQuantity
    }

    // create new product
    async createProduct(productId) {
        const newProduct = await product.create({...this, _id: productId})
        if (newProduct) {
            await insertInventory({
                productId: newProduct._id,
                shopId: this.productShop,
                stock: this.productQuantity,
            })
        }

        return newProduct
    }

    // update product
    async updateProduct(productId, bodyUpdate) {
        return await updateProductById({productId, bodyUpdate, model: product})
    }
}

// Define sub-class for differrent product type Clothing
class Clothing extends Product{

    async createProduct() {
        const newClothing = await clothing.create(this.productAttributes)
        if(!newClothing) {
            throw new BadRequestError('Create new Clothing Error')
        }

        const newProduct = await super.createProduct(newClothing._id)
        if(!newProduct) {
            throw new BadRequestError('Create new Product Error')
        }

        return newProduct
    }

    async updateProduct(productId) {
        // 1. remove attr has null 
        const objectParams = updateNestedObjectParser(this)
        // 2. which one is updated or both (child or parent)
        const bodyUpdate = removeUndefinedObject(objectParams)
        if (objectParams.productAttributes) {
            await updateProductById({productId, bodyUpdate: bodyUpdate, model: clothing})
        }

        const updateProduct = await super.updateProduct(productId, bodyUpdate)
        return updateProduct
    }
}

// Define sub-class for differrent product type Electronics
class Electronics extends Product{

    async createProduct() {
        const newElectronic = await electronic.create({
            ...this.productAttributes,
            productShop: this.productShop,
        })
        if(!newElectronic) {
            throw new BadRequestError('Create new Electronic Error')
        }

        const newProduct = await super.createProduct(newElectronic._id)
        if(!newProduct) {
            throw new BadRequestError('Create new Product Error')
        }

        return newProduct
        
    }
}

// register product types
ProductFactory.registerProductType('Electronics', Electronics)
ProductFactory.registerProductType('Clothing', Clothing)
// ProductFactory.registerProductType('Furniture', Furniture)

module.exports = ProductFactory