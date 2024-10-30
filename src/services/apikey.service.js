'use strict'

const apiKeyModel = require("../models/apiKey.model")

const findById = async (key) => {
    // const key1 = crypto.randomBytes(64).toString('hex')
    // console.log(`KEY1 ${key1}`)
    // await apiKeyModel.create({key1, status: true, permissions: ['0000']})
    const objKey = await apiKeyModel.findOne({key, status: true}).lean()
    return objKey
}

module.exports = {
    findById
}