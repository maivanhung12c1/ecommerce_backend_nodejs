'use strict'

const { Types } = require("mongoose")
const keytokenModel = require("../models/keytoken.model")

class KeyTokenService {
    
    static createKeyToken = async ({userId, publicKey, privateKey, refreshToken}) => {
        try {
            // const tokens = await keytokenModel.create({
            //     user: userId,
            //     publicKey: publicKey,
            //     privateKey: privateKey
            // })

            // return tokens ? tokens.publicKey : null

            const filter = {user: userId}
            const update = {publicKey, privateKey, refreshTokensUsed: [], refreshToken}
            const options = {upsert: true, new: true}

            const tokens = await keytokenModel.findOneAndUpdate(filter, update, options)

            return tokens ? tokens.publicKey : null

        } catch (error) {
            return error
        }
    }

    static findByUserId = async (userId) => {
        return await keytokenModel.findOne({ user: userId }).lean()
    }

    static removeKeyById = async (id) => {
        return await keytokenModel.deleteOne({ _id: id });
    }

    static findByRefreshTokensUsed = async (refreshToken) => {
        return await keytokenModel.findOne({refreshTokensUsed: refreshToken}).lean()
    }

    static findByRefreshToken = async (refreshToken) => {
        return await keytokenModel.findOne({refreshToken: refreshToken})
    }

    static deleteKeyById = async (userId) => {
        return await keytokenModel.deleteOne({user: userId})
    }
}

module.exports = KeyTokenService