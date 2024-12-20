'use strict'

const _ = require('lodash')
const { Types } = require('mongoose')

const convertToObjectIdMongo = id => new Types.ObjectId(id)

const getInfoData = ({fields = [], object = {}}) => {
    return _.pick(object, fields)
}

const getSelectData = (select=[]) => {
    return Object.fromEntries(select.map(el => [el, 1]))
}

const unGetSelectData = (select=[]) => {
    return Object.fromEntries(select.map(el => [el, 0]))
}

const removeUndefinedObject = obj => {
    Object.keys(obj).forEach(k => {
        if (obj[k] == null) {
            delete obj[k]
        }
    })

    return obj
}

const updateNestedObjectParser = obj => {
    // console.log(`obj ${JSON.stringify(obj)}`)
    const final = {}
    Object.keys(obj).forEach(k => {
        if (typeof obj[k] === 'object' && !Array.isArray(obj[k])) {
            // console.log(`obj[k] ${JSON.stringify(obj[k])}`)
            const response = updateNestedObjectParser(obj[k])
            Object.keys(response).forEach( a => {
                final[`${k}.${a}`] = response[a]
            })
        } else {
            final[k] = obj[k]
            // console.log(`final[k] ${JSON.stringify(final[k])}`)
            // console.log(`obj[k] 2 ${JSON.stringify(obj[k])}`)
        }
    })
    return final
}

module.exports = {
    getInfoData,
    getSelectData,
    unGetSelectData,
    removeUndefinedObject,
    updateNestedObjectParser,
    convertToObjectIdMongo,
}