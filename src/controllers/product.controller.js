'use strict'

const { OK, CREATED, SuccessResponse } = require("../core/success.response")
const ProductService = require("../services/product.service")

class ProductController {

    createProduct = async (req, res, next) => {
        new SuccessResponse({
            message: 'Create  new Product Success!',
            metadata: await ProductService.createProduct(req.body.productType, {
                ...req.body,
                productShop: req.user.userId,
            })
        }).send(res)
    }

    updateProduct = async (req, res, next) => {
        new SuccessResponse({
            message: 'Update new Product Success!',
            metadata: await ProductService.updateProduct(req.body.productType, req.params.productId, {
                ...req.body,
                productShop: req.user.userId,
            })
        }).send(res)
    }

    publishProductByShop = async (req, res, next) => {
        new SuccessResponse({
            message: 'Publish Product Success!',
            metadata: await ProductService.publishProductByShop({
                productId: req.params.id,
                productShop: req.user.userId,
            })
        }).send(res)
    }

    unPublishProductByShop = async (req, res, next) => {
        new SuccessResponse({
            message: 'Unpublish Product Success!',
            metadata: await ProductService.unPublishProductByShop({
                productId: req.params.id,
                productShop: req.user.userId,
            })
        }).send(res)
    }

    // query
    getAllDraftsForShop = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get list Drafts Success!',
            metadata: await ProductService.findAllDraftsForShop({
                productShop: req.user.userId,
            })
        }).send(res)
    }
    getAllPublishForShop = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get list Published Success!',
            metadata: await ProductService.findAllPublishForShop({
                productShop: req.user.userId,
            })
        }).send(res)
    }

    getListSearchProduct = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get list Search Product Success!',
            metadata: await ProductService.searchProducts(req.params)
        }).send(res)
    }

    findAllProducts = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get list All Products Success!',
            metadata: await ProductService.findAllProducts(req.query)
        }).send(res)
    }

    findProduct = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get list Product Success!',
            metadata: await ProductService.findProduct({
                productId: req.params.productId
            })
        }).send(res)
    }
    // end query
}

module.exports = new ProductController()