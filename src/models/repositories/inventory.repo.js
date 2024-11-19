const { Types } = require("mongoose")
const { inventory } = require('../inventory.model')
const { convertToObjectIdMongo } = require("../../utils")

const insertInventory = async ({
    productId, shopId, stock, location = 'unKnow'
}) => {
    return await inventory.create({
        invenProductId: productId,
        invenStock: stock,
        invenLocation: location,
        invenShopId: shopId,
    })
}

const reservationInventory = async ({ productId, quantity, cartId }) => {
    const query = {
        invenProductId: convertToObjectIdMongo(productId),
        invenStock: {$gte: quantity}
    }
    const updateSet = {
        $inc: {
            invenStock: -quantity
        },
        $push: {
            invenReservations: {
                quantity,
                cartId,
                createOn: new Date()
            }
        }
    }
    const options = {upsert: true, new: true}

    return await inventory.updateOne(query, updateSet)
}

module.exports = { 
    insertInventory,
    reservationInventory,
}