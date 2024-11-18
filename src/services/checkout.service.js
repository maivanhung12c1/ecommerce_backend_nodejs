'use strict'

const { BadRequestError } = require("../core/error.response")
const { findCartById } = require("../models/repositories/cart.repo")
const { checkProductByServer } = require("../models/repositories/product.repo")
const { getDiscountAmount } = require("./discount.service")

class CheckoutService {
    // 
    /*
        {
            "cartId",
            "userId",
            "shopOrderIds": [
                {
                    "shopId",
                    "shopDiscounts": [],
                    "itemProducts": [
                        {
                            "price",
                            "quantity",
                            "productId",
                        }
                    ]
                },
                {
                    "shopId",
                    "shopDiscounts": [
                        {
                            "shopId",
                            "discountId",
                            "codeId",
                        }
                    ],
                    "itemProducts": [
                        {
                            "price",
                            "quantity",
                            "productId",
                        }
                    ]
                }
            ]
        }


    */
    static async checkoutReview({
        cartId, userId, shopOrderIds
    }) {
        // check cartId is exist?
        const foundCart = await findCartById(cartId)
        if (!foundCart) {
            throw new BadRequestError('Cart does not exists!')
        } else {
            console.log(`foundCart ${foundCart}`)
        }

        const checkoutOrder = {
            totalPrice: 0,
            freeShip: 0,
            totalDiscount: 0,
            totalCheckout: 0,
        }
        const shopOrderIdsNew = []

        // calculate total
        for (let i = 0; i < shopOrderIds.length; i++) {
            const {shopId, shopDiscounts = [], itemProducts = []} = shopOrderIds[i]
            // check product available
            const checkProductServer = await checkProductByServer(itemProducts)
            console.log(`check Product By Server:: `, checkProductServer)
            if (!checkProductServer[0]) {
                throw new BadRequestError('Order Wrong!')
            }

            // 
            const checkoutPrice = checkProductServer.reduce((acc, product) => {
                return acc + (product.quantity * product.price)
            }, 0)

            checkoutOrder.totalPrice += checkoutPrice

            const itemCheckout = {
                shopId,
                shopDiscounts,
                priceRaw: checkoutPrice,
                priceApplyDiscount: checkoutPrice,
                itemProducts: checkProductServer
            }

            // check discounts are valid
            if (shopDiscounts.length > 0) {
                const {totalPrice = 0, discount = 0} = await getDiscountAmount({
                    codeId: shopDiscounts[0].codeId,
                    userId,
                    shopId,
                    products: checkProductServer
                })
                
                checkoutOrder.totalDiscount += discount

                if (discount > 0) {
                    itemCheckout.priceApplyDiscount = checkoutPrice - discount
                }
            }

            checkoutOrder.totalCheckout += itemCheckout.priceApplyDiscount
            shopOrderIdsNew.push(itemCheckout)

        }

        return {
            shopOrderIds,
            shopOrderIdsNew,
            checkoutOrder,
        }

    }
}

module.exports = CheckoutService