'use strict'

const express = require('express')
const asyncHandler = require('../../helpers/asyncHandler')
const { authenticationV2 } = require('../../auth/authUtils')
const cartController = require('../../controllers/cart.controller')

const router = express.Router()

router.post('', asyncHandler(cartController.addToCart))
router.delete('', asyncHandler(cartController.deleteItemInUserCart))
router.post('/update', asyncHandler(cartController.updateCart))
router.get('', asyncHandler(cartController.listCart))

module.exports = router