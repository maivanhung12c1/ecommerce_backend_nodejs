'use strict'

const { BadRequestError, NotFoundError } = require("../core/error.response")
const { cart } = require("../models/cart.model")
const { getProductById } = require("../models/repositories/product.repo")

/**
 * Key features:
 * - add product to cart [user]
 * - reduce product quantity by one [user]
 * - increase product quantity by one [user]
 * - get cart [user]
 * - delete cart [user]
 * - delete cart item [user]
 */

class CartService {

    static async createUserCart({userId, product}) {
        const query = {cartUserId: userId, cartState: 'active'}
        const updateOrInsert = {
            $addToSet: {
                cartProducts: product,
            }
        }
        const options = {upsert: true, new: true}
        return await cart.findOneAndUpdate(query, updateOrInsert, options)
    }

    
    static async updateUserCartQuantity({userId, product}) {
        const {productId, quantity} = product
        const query = {
            cartUserId: userId,
            'cartProducts.productId': productId,
            cartState: 'active'
        }

        const updateSet = {
            $inc: {
                'cartProducts.$.quantity': quantity // $ represent for the found products in cartProducts
            }
        }
        const options = {upsert: true, new: true}
        return await cart.findOneAndUpdate(query, updateSet, options)
    }

    static async addToCart({userId, product={}}) {
        // check exist
        const userCart = await cart.findOne({cartUserId: userId})

        if (!userCart) {
            // create cart for user
            return await CartService.createUserCart({userId, product})
        }

        // if the userCart is exists but there's no product in it
        if (!userCart.cartProducts.length) {
            userCart.cartProducts = [product]
            return await userCart.save()
        }

        // if the userCart is exist and the product is exist in the userCart, then update product'quantity
        return await CartService.updateUserCartQuantity({userId, product})
    }

    // update cart
    /**
     * "shopOrderIds": [
        {
            "shopId",
            "itemProducts": [
                {
                    "productId"            
                    "oldQuantity",
                    "quantity",
                    "price",
                    "shopId",
               }
            ],
            "version"
        }
    ]
    */
    static async addToCartV2({userId, shopOrderIds}) {
        const {productId, quantity, oldQuantity} = shopOrderIds[0]?.itemProducts[0]
        //check product
        const foundProduct = await getProductById(productId)
        if (!foundProduct) {
            throw new NotFoundError('Product is not exist!')
        }

        if (quantity === 0) {
            // delete
        }

        return await CartService.updateUserCartQuantity({
            userId,
            product: {
                productId,
                quantity: quantity - oldQuantity,
            }
        })

   }

    static async deleteItemInUserCart({userId, productId}) {
        const query = {cartUserId: userId, cartState: 'active'}
        const updateSet = {
            $pull: {
                cartProducts: {
                    productId,
                }
            }
        }

        const deleteCart = await cart.updateOne(query, updateSet)
        return deleteCart
   }

    static async getListUserCart({userId}) {
        return await cart.findOne({
            cartUserId: +userId,
        }).lean()
   }

}

module.exports = CartService