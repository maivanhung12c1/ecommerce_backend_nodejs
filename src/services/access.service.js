'use strict'

const shopModel = require("../models/shop.model")
const bcrypt = require('bcrypt')
const crypto = require('crypto')
const KeyTokenService = require("./keyToken.service")
const { createTokenPair, verifyJWT } = require("../auth/authUtils")
const { getInfoData } = require("../utils")
const { BadRequestError, AuthFailureError, ForbiddenError } = require("../core/error.response")
const { findByEmail } = require("./shop.service")
const { ObjectId } = require('mongodb');

const RoleShop = {
    SHOP: 'SHOP',
    WRITER: 'WRITER',
    EDITOR: 'EDITOR',
    ADMIN: 'ADMIN'
}

class AccessService {

    /**
     * Check this token used ?
     *
     */
    static handlerRefreshToken = async (refreshToken) => {
        console.log("0000000000--------")
        const foundToken = await KeyTokenService.findByRefreshTokensUsed(refreshToken)
        console.log(`PRIvate::: ${JSON.stringify(foundToken)}`)
        if (foundToken) {
            console.log("0000000000")
            console.log(`PRIvate: ${foundToken}`)
            const {userId, email} = await verifyJWT(refreshToken, foundToken.privateKey)
            console.log("0000000000----------1")
            const userID_ = new ObjectId(userId)
            console.log(`USERID ${JSON.stringify(userID_)}`)
            await KeyTokenService.deleteKeyById(userID_)
            throw ForbiddenError('Something wrong happend !! Pls relogin')
        }
        console.log("11111111111")
        const holderToken = await KeyTokenService.findByRefreshToken(refreshToken)
        if (!holderToken) throw new AuthFailureError('Shop not registered 1')
        console.log("22222222222")
        // verify Token
        const {userId, email} = await verifyJWT(refreshToken, holderToken.privateKey)
        console.log("33333333333")
        // check userId
        const foundShop = await findByEmail({email})
        if (!foundShop) throw new AuthFailureError('Shop not registered 2')
        console.log("44444444444")
        // create new refrreshtoken
        const tokens = await createTokenPair({userId, email}, holderToken.publicKey, holderToken.privateKey)
        console.log("55555555555")
        // update token
        await holderToken.updateOne({
            $set: {
                refreshToken: tokens.refreshToken
            },
            $addToSet: {
                refreshTokensUsed: refreshToken
            }
        })

        return {
            user: {userId, email},
            tokens,
        }
    }

    static logout = async (keyStore) => {
        const delKey = await KeyTokenService.removeKeyById(keyStore._id)
        return delKey
    }

    static login = async({email, password, refreshToken = null}) => {

        const foundShop = await findByEmail({email})
        if (!foundShop) throw new BadRequestError('Shop not registered')

        const match = bcrypt.compare(password, foundShop.password)
        if (!match) throw new AuthFailureError('Authentication Error')
        
        const privateKey = crypto.randomBytes(64).toString('hex')
        const publicKey = crypto.randomBytes(64).toString('hex')
        const {_id: userId} = foundShop

        const tokens = await createTokenPair({userId, email}, publicKey, privateKey)     
        console.log(`Token ${tokens}`)
        await KeyTokenService.createKeyToken({
            userId,
            publicKey,
            privateKey, 
            refreshToken: tokens.refreshToken,
        })
        
        return {
            shop: getInfoData({fields: ['_id', 'name', 'email'], object: foundShop}),
            tokens,
        }
    }

    static signUp = async ({name, email, password}) => {

        const holderShop = await shopModel.findOne({email}).lean()
        if (holderShop) {
            throw new BadRequestError('Error: Shop already registered!')
        }

        const passwordHash = await bcrypt.hash(password, 10)
        const newShop = await shopModel.create({
            name, email, password: passwordHash, roles: [RoleShop.SHOP]
        })

        if (newShop) {
            // created pivateKey, publicKey
            const privateKey = crypto.randomBytes(64).toString('hex')
            const publicKey = crypto.randomBytes(64).toString('hex')

            console.log({privateKey, publicKey}) // save collection KeyStore

            const keyStore = await KeyTokenService.createKeyToken({
                userId: newShop._id,
                publicKey,
                privateKey
            })

            if (!keyStore) {
                return {
                    code: 'xxx',
                    message: 'keyStore error'
                }
            }
            // created token pair
            const tokens = await createTokenPair({userId: newShop._id, email}, publicKey, privateKey)
            console.log(`Created Token Success:: `, tokens)

            return {
                code: 201,
                metadata: {
                    shop: getInfoData({fields: ['_id', 'name', 'email'], object: newShop}),
                    tokens,
                }
            }
        }

        return {
            code: 200,
            metadata: null
        }
    }
}

module.exports = AccessService