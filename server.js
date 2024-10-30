const app = require("./src/app");

const PORT = process.env.PORT || 3055

const server = app.listen(PORT, () => {
    console.log(`eCommerce start with port ${PORT}`)
})

// process is belong nodejs
// SIGINT = Ctrl + C
process.on('SIGINT', () => {
    server.close(() => {
        console.log(`Exit Server Express`)
        process.exit(0);
    })
    // notify.send( ping... )
})