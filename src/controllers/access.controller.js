'use strict'

const { OK, CREATED, SuccessResponse } = require("../core/success.response")
const AccessService = require("../services/access.service")

class AccessController {

    // handlerRefreshToken = async (req, res, next) => {
    //     new SuccessResponse({
    //         message: 'Got Token Success!',
    //         metadata: await AccessService.handlerRefreshToken(req.body.refreshToken)
    //     }).send(res)
    // }

    handlerRefreshToken = async (req, res, next) => {
        new SuccessResponse({
            message: 'Got Token Success!',
            metadata: await AccessService.handlerRefreshTokenV2({
                refreshToken: req.refreshToken,
                user: req.user,
                keyStore: req.keyStore,
            })
        }).send(res)
    }

    logout = async (req, res, next) => {
        new SuccessResponse({
            message: 'Logout Success!',
            metadata: await AccessService.logout(req.keyStore)
        }).send(res)
    }

    login = async (req, res, next) => {
        new SuccessResponse({
            metadata: await AccessService.login(req.body)
        }).send(res)
    }

    signUp = async (req, res, next) => {
        new CREATED({
            message: 'Registered OK!',
            metadata: await AccessService.signUp(req.body),
            options: {
                limit: 10
            }
        }).send(res)
    }
}

module.exports = new AccessController()