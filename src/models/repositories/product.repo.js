'use strict'

const { product, electronic, clothing } = require('../../models/product.model')
const { ObjectId } = require('mongodb')
const { getSelectData, unGetSelectData } = require('../../utils')

const queryProduct= async ({query, limit, skip}) => {
    return await product.find(query)
    .populate('productShop', 'name email -_id')
    .sort({updateAt: -1})
    .skip(skip)
    .limit(limit)
    .lean()
    .exec()
}

const findAllDraftsForShop = async ({query, limit, skip}) => {
    return await queryProduct({query, limit, skip})
}

const findAllPublishForShop = async ({query, limit, skip}) => {
    return await queryProduct({query, limit, skip})
}

const searchProductByUser = async ({keySearch, limit, skip}) => {
    const regexSearch = new RegExp(keySearch)
    const results = await product.find({
        isPublished: true,
        $text: {$search: regexSearch}
    }, {score: {$meta: 'textScore'}})
    .sort({score: {$meta: 'textScore'}})
    .lean()

    return results
}

const publishProductByShop = async({productShop, productId}) => {
    const foundShop = await product.findOne({
        productShop: new ObjectId(productShop),
        _id: new ObjectId(productId),
    })
    
    if (!foundShop) {
        return null
    }

    foundShop.isDraft = false
    foundShop.isPublished = true

    const {modifiedCount} = await foundShop.updateOne(foundShop)
    return modifiedCount
}

const unPublishProductByShop = async({productShop, productId}) => {
    const foundShop = await product.findOne({
        productShop: new ObjectId(productShop),
        _id: new ObjectId(productId),
    })
    
    if (!foundShop) {
        return null
    }

    foundShop.isDraft = true
    foundShop.isPublished = false

    const {modifiedCount} = await foundShop.updateOne(foundShop)
    return modifiedCount
}

const findAllProducts = async({limit, sort, page, filter, select}) => {
    const skip = (page - 1) * limit
    const sortBy = sort === 'ctime' ? {_id: -1} : {_id: 1}
    const products = await product.find(filter)
    .sort(sortBy)
    .skip(skip)
    .limit(limit)
    .select(getSelectData(select))
    .lean()

    return products
}

const findProduct = async ({productId, unSelect}) => {
    return await product.findById(productId).select(unGetSelectData(unSelect))
}

const updateProductById = async ({
    productId,
    bodyUpdate,
    model,
    isNew=true,
}) => {
    return await model.findByIdAndUpdate(productId, bodyUpdate, {
        new: isNew
    })
}
 
module.exports = {
    findAllDraftsForShop,
    publishProductByShop,
    findAllPublishForShop,
    unPublishProductByShop,
    searchProductByUser,
    findAllProducts,
    findProduct,
    updateProductById,
}