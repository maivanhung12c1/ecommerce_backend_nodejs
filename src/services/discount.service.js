'use strict'

const { BadRequestError, NotFoundError } = require("../core/error.response")
const { discount, discount } = require("../models/discount.model")
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
            code, startDate, endDate, isActive, shopId, minOrderValue, productIds, appliesTo, name, 
            description, type, value, maxValue, maxUses, usesCount, maxUsesPerUser, userUsed
        } = payload
        // check
        if (new Date() < new Date(startDate || new Date() > new Date(endDate))) {
            throw new BadRequestError('Discount code has expried!')
        }

        if (new Date(startDate) >= new Date(endDate)) {
            throw new BadRequestError('Start date must be before end date')
        }

        // create index for discount code
        const foundDiscount = await discount.findOne({
            discountCode: code,
            discountShopId: convertToObjectIdMongo(shopId),
        }).lean()

        if (foundDiscount && foundDiscount.discountIsActive == true) {
            throw new BadRequestError('Discount exists!')
        }

        const newDiscount = await discount.create({
            discountName: name,
            discountDiscription: description,
            discountType: type, // default: 'percentage'
            discountCode: code,
            discountValue: value,
            discountMinOrderValue: minOrderValue || 0,

            discountStartDate: new Date(startDate),
            discountEndDate: new Date(endDate),
            discountMaxUses: maxUses,
            discountUsesCount: usesCount,
            discountUsersUsed: userUsed,
            discountShopId: shopId,
            discountMaxUsesPerUser: maxUsesPerUser,
            discountIsActive: isActive,
            discountAppliesTo: appliesTo,
            discountProductIds: appliesTo === 'all' ? [] : productIds
        })

        return newDiscount
    }

    static async updateDiscountCode(payload) {

    }

    /**
     * Get all discount codes available with product
     */
    static async getAllDiscountCodesWithProduct({
        code, shopId, userId, limit, page
    }) {
        // create index for discount code
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
        const discount = await findAllDiscountCodesUnSelect({
            limit: +limit,
            page: +page,
            filter: {
                discountShopId: convertToObjectIdMongo(shopId),
                discountIsActive: true,
            },
            unSelect: ['__v', 'discountShopId'],
            model: discount
        })

        return discount
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
        if (!discountMinOrderValue > 0) {
            // get total
            totalOrder = products.reduce((acc, product) => {
                return acc + (product.quantity * product.price)
            }, 0)

            if (totalOrder < discountMinOrderValue) {
                throw new NotFoundError(`Discount requires a minimum order value of ${discountMinOrderValue}`)
            }
        }

        if (!discountMaxUsesPerUser > 0) {
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

    static async cancelDiscountCode({code, shopId, userId}) {
        const foundDiscount = await checkDiscountExists({
            model: discount
        })
    }

}