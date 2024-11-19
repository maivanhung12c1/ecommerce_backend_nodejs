'use strict'

const { BadRequestError } = require("../core/error.response")
const { inventory } = require("../models/inventory.model")
const { getProductById } = require("../models/repositories/product.repo")

class InventoryService {
    
    static async addStockToInventory({
        stock,
        productId,
        shopId,
        location='759/5, Binh Tan, HCM'
    }) {
        const product = await getProductById(productId)
        if (!product) {
            throw new BadRequestError('The product does not exists!')
        }
        const query = {invenShopId: shopId, invenProductId: productId}
        const updateSet = {
            $inc: {
                invenStock: stock
            },
            $set: {
                invenLocation: location
            }
        }
        const options = {upsert: true, new: true}

        return await inventory.findOneAndUpdate(query, updateSet, options)
    }
}

module.exports = InventoryService