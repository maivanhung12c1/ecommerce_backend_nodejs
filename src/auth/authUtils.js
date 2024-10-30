'use strict'

const JWT = require('jsonwebtoken')
const asyncHandler = require('../helpers/asyncHandler')
const { findByUserId } = require("../services/keyToken.service")
const { AuthFailureError, NotFoundError } = require('../core/error.response')

const HEADER = {
    API_KEY: 'x-api-key',
    CLIENT_ID: 'x-client-id',
    AUTHORIZATION: 'authorization', 
}

const createTokenPair = async (payload, publicKey, privateKey) => {
    try {
        // accessToken
        console.log(`PUBLICKEY sign up : ${publicKey}`)
        const accessToken = await JWT.sign(payload, publicKey, {
            expiresIn: '2 days'
        })

        // refreshToken
        const refreshToken = await JWT.sign(payload, privateKey, {
            expiresIn: '7 days'
        })
        
        JWT.verify(accessToken, publicKey, (err, decode) => {
            if (err) {
                console.log(`error verify:: `, err)
            } else {
                console.log(`decode verify:: `, decode)
            }
        })

        return {accessToken, refreshToken}
    } catch (error) {

    }
}

const authentication = asyncHandler(async (req, res, next) => {
    /*
        1 - Check userId missing?
        2 - Get AccessToken
        3 - Verify Token
        4 - Check user in db
        5 - Check keystore with this userId
        6 - Okk all -> return next()
    */
    console.log("-----------iiii 11111")
    const userId = req.headers[HEADER.CLIENT_ID]
    if (!userId) throw new AuthFailureError('Invalid Request')
    console.log("-----------iiii 2222")
    const keyStore = await findByUserId(userId)
    if (!keyStore) throw new NotFoundError('Not Found  KeyStore')
    console.log("-----------iiii 33333")
    const accessToken = req.headers[HEADER.AUTHORIZATION]
    if(!accessToken) throw new AuthFailureError('Invalid Request')
    console.log("-----------iiii 4444")
    console.log(`PUBLICKEY : ${keyStore.publicKey}`)
    try {
        const decodeUser = JWT.verify(accessToken, keyStore.publicKey)
        console.log("-----------iiii 666666")
        if(userId !== decodeUser.userId) throw new AuthFailureError('Invalid UserId')
        req.keyStore = keyStore
        console.log("-----------iiii")
        return next()
    } catch (error) {
        throw error
    }
    
})

const verifyJWT = async (token, keySecret) => {
    return await JWT.verify(token, keySecret)
}

module.exports = {
    createTokenPair,
    authentication,
    verifyJWT,
}