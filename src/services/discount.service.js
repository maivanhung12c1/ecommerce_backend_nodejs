'use strict'

const { filter } = require("lodash")
const { BadRequestError, NotFoundError } = require("../core/error.response")
const { discount } = require("../models/discount.model")
const { findAllDiscountCodesSelect, findAllDiscountCodesUnSelect, checkDiscountExists } = require("../models/repositories/discount.repo")
const { findAllProducts } = require("../models/repositories/product.repo")
const { convertToObjectIdMongo } = require("../utils")

/**
 * Discount Services
 * 1. Generate discount code [Shop | Admin]
 * 2. Get discount amount [User]
 * 3. Get all discount codes [User | Shop]
 * 4. Verify discount code [User]
 * 5. Delete discount code [Admin | Shop]
 * 6. Cancel discount code [User]
 */

class DiscountService {

    static async createDiscountCode(payload) {
        const {
            discountCode, 
            discountStartDate, 
            discountEndDate, 
            discountIsActive, 
            discountShopId, 
            discountMinOrderValue, 
            discountProductIds, 
            discountAppliesTo, 
            discountName, 
            discountDescription, 
            discountType, 
            discountValue, 
            discountMaxValue, 
            discountMaxUses, 
            discountUsesCount, 
            discountMaxUsesPerUser, 
            discountUsersUsed
        } = payload
        // check
        if (new Date() < new Date(discountStartDate) || new Date() > new Date(discountEndDate)) {
            throw new BadRequestError('Discount code has expried!')
        }

        if (new Date(discountStartDate) >= new Date(discountEndDate)) {
            throw new BadRequestError('Start date must be before end date')
        }

        // create index for discount code
        const foundDiscount = await discount.findOne({
            discountCode: discountCode,
            discountShopId: convertToObjectIdMongo(discountShopId),
        }).lean()

        if (foundDiscount && foundDiscount.discountIsActive == true) {
            throw new BadRequestError('Discount exists!')
        }

        const newDiscount = await discount.create({
            discountName: discountName,
            discountDescription: discountDescription,
            discountType: discountType, // default: 'percentage'
            discountCode: discountCode,
            discountValue: discountValue,
            discountMinOrderValue: discountMinOrderValue || 0,
            discountMaxValue: discountMaxValue,
            discountStartDate: new Date(discountStartDate),
            discountEndDate: new Date(discountEndDate),
            discountMaxUses: discountMaxUses,
            discountUsesCount: discountUsesCount,
            discountUsersUsed: discountUsersUsed,
            discountShopId: discountShopId,
            discountMaxUsesPerUser: discountMaxUsesPerUser,
            discountIsActive: discountIsActive,
            discountAppliesTo: discountAppliesTo,
            discountProductIds: discountAppliesTo === 'all' ? [] : discountProductIds
        })

        return newDiscount
    }

    static async updateDiscountCode(payload) {

    }

    /**
     * Get all discount codes available with product
     */
    static async getAllDiscountCodesWithProduct({
        code, shopId, limit, page
    }) {
        // create index for discount code
        console.log(`discount code ${code}`)
        console.log(`shopId code ${shopId}`)

        const foundDiscount = await discount.findOne({
            discountCode: code,
            discountShopId: convertToObjectIdMongo(shopId),
        }).lean()

        if (!foundDiscount || !foundDiscount.discountEndDate) {
            throw new NotFoundError('Discount not exists!')
        }

        const {discountAppliesTo, discountProductIds} = foundDiscount
        let products
        if (discountAppliesTo === 'all') {
            // get all products
            products = await findAllProducts({
                filter: {
                    productShop: convertToObjectIdMongo(shopId),
                    isPublished: true,
                },
                limit: +limit,
                page: +page,
                sort: 'ctime',
                select: ['productName']
            })
        }

        if (discountAppliesTo === 'specific') {
            // get the products ids
            products = await findAllProducts({
                filter: {
                    _id: {$in: discountProductIds},
                    isPublished: true,
                },
                limit: +limit,
                page: +page,
                sort: 'ctime',
                select: ['productName']
            })
        }

        return products
    }

    /**
     * Get all discount code of shop
     */
    static async getAllDiscountCodesByShop({limit, page, shopId}) {
        const discounts = await findAllDiscountCodesUnSelect({
            limit: +limit,
            page: +page,
            filter: {
                discountShopId: convertToObjectIdMongo(shopId),
                discountIsActive: true,
            },
            unSelect: ['__v', 'discountShopId'],
            model: discount
        })

        return discounts
    }

    static async getDiscountAmount({codeId, userId, shopId, products}) {
        const foundDiscount = await checkDiscountExists({
            model: discount,
            filter: {
                discountCode: codeId,
                discountShopId: convertToObjectIdMongo(shopId),
            }
        })

        if (!foundDiscount) {
            throw new NotFoundError(`Discount code doesn't exists!`)
        }

        const {
            discountIsActive, 
            discountMaxUses, 
            discountStartDate, 
            discountEndDate,
            discountMinOrderValue,
            discountMaxUsesPerUser,
            discountType,
            discountValue,
        } = foundDiscount

        if (!discountIsActive) {
            throw new NotFoundError(`Discount code expired!`)
        }

        if (!discountMaxUses) {
            throw new NotFoundError('Discount code are out!')
        }

        if (new Date() < new Date(discountStartDate) || new Date() > new Date(discountEndDate)) {
            throw new NotFoundError(`Discount code has expired!`)
        }

        let totalOrder = 0
        if (discountMinOrderValue > 0) {
            // get total
            totalOrder = products.reduce((acc, product) => {
                return acc + (product.quantity * product.price)
            }, 0)

            if (totalOrder < discountMinOrderValue) {
                throw new NotFoundError(`Discount requires a minimum order value of ${discountMinOrderValue}`)
            }
        }

        if (!discountMaxUsesPerUser > 0) {
            console.log(`check discount max uses`)
            const userUseDiscount = discountUsersUsed.find(user => user.userId === userId)
            if (userUseDiscount) {

            }
        }

        // check weather discount is fixed amount or percentage
        const amount = discountType === 'fixed_amount' ? discountValue : totalOrder * (discountValue / 100)

        return {
            totalOrder,
            discount: amount,
            totalPrice: totalOrder - amount,
        }
    }

    static async deleteDiscountCode({shopId, codeId}) {
        const deleted = await discount.findOneAndDelete({
            discountCode: codeId,
            discountShopId: convertToObjectIdMongo(shopId),
        })
    }

    static async cancelDiscountCode({codeId, shopId, userId}) {
        const foundDiscount = await checkDiscountExists({
            model: discount,
            filter: {
                discountCode: codeId,
                discountShopId: convertToObjectIdMongo(shopId),
            }
        })

        if (!foundDiscount) {
            throw new NotFoundError(`Discount code doesn't exists`)
        }

        const result = await discount.findByIdAndUpdate(foundDiscount._id, {
            $pull: {
                discountUsersUsed: userId,
            },
            $inc: {
                discountMaxUses: 1,
                discountUsesCount: -1,
            }
        })

        return result
    }

}

module.exports = DiscountService