const { Types } = require("mongoose")
const { inventory } = require('../inventory.model')

const insertInventory = async ({
    productId, shopId, stock, location='unKnow'
}) => {
    return await inventory.create({
        invenProductId: productId,
        invenStock: stock,
        invenLocation: location,
        invenShopId: shopId,
    })
}

module.exports = {insertInventory}