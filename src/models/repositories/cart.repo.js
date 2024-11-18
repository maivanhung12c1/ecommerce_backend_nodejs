'use strict'

const { convertToObjectIdMongo } = require("../../utils")
const { cart } = require("../cart.model")

const findCartById = async (cartId) => {
    return await cart.findOne({_id: convertToObjectIdMongo(cartId), cartState: 'active'}).lean()

}

module.exports = {
    findCartById,
}