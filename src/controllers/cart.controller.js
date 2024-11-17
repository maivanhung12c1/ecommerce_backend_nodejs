'use strict'

const CartService = require("../services/cart.service")
const { SuccessResponse } = require("../core/success.response")

class CartController {

    addToCart = async (req, res, next) => {
        new SuccessResponse({
            message: 'Create New Cart Success',
            metadata: await CartService.addToCart(req.body)
        }).send(res)
    }

    updateCart = async (req, res, next) => {
        new SuccessResponse({
            message: 'Update Cart Success',
            metadata: await CartService.addToCartV2(req.body)
        }).send(res)
    }

    deleteItemInUserCart = async (req, res, next) => {
        new SuccessResponse({
            message: 'Delete Cart Success',
            metadata: await CartService.deleteItemInUserCart(req.body)
        }).send(res)
    }

    listCart = async (req, res, next) => {
        new SuccessResponse({
            message: 'List Cart Success',
            metadata: await CartService.getListUserCart(req.body)
        }).send(res)
    }
}

module.exports = new CartController()