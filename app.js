const express = require('express')
const app = express()
module.exports = app
app.use(express.json())

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const bcrypt = require('bcrypt')

const path = require('path')
const dbPath = path.join(__dirname, 'userData.db')

let db = null
let serverPort = 3000

const initializeServerAndDb = async () => {
  try {
    db = await open({filename: dbPath, driver: sqlite3.Database})
    app.listen(serverPort, () => {
      console.log(`Server Running in ${serverPort} Port...`)
    })
  } catch (error) {
    console.log(`Db Error: ${error.message}`)
  }
}

initializeServerAndDb()

//API 1: total three Scenarios

app.post('/register', async (request, response) => {
  const {username, name, password, gender, location} = request.body

  const hashedPassword = await bcrypt.hash(password, 10)

  const getDbUsersData = `SELECT * FROM user WHERE username="${username}";`

  const usersPresentInDb = await db.get(getDbUsersData)

  if (usersPresentInDb === undefined) {
    //check user there or not
    if (password.length > 5) {
      const registerUserToDb = `INSERT INTO user(username, name, password, gender, location)
      VALUES("${username}", "${name}", "${hashedPassword}","${gender}", "${location}");`
      await db.run(registerUserToDb)
      response.status(200)
      response.send('User created successfully')
    } else if (password.length < 5) {
      response.status(400)
      response.send('Password is too short')
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

//API 2: total three Scenarios

app.post('/login', async (request, response) => {
  const {username, password} = request.body

  const getSpecificUserFoundOrNotInDb = `SELECT * FROM user WHERE username='${username}';`

  const usersRegisteredInDb = await db.get(getSpecificUserFoundOrNotInDb)

  if (usersRegisteredInDb !== undefined) {
    // compareGivenPswAndHsdPsw Should Be given in local-scope because the condition is true then usrpassword taken on spot
    const compareGivenPswAndHsdPsw = await bcrypt.compare(
      request.body.password,
      usersRegisteredInDb.password,
    )
    if (compareGivenPswAndHsdPsw === true) {
      response.status(200)
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  } else if (usersRegisteredInDb === undefined) {
    response.status(400)
    response.send('Invalid user')
  }
})

//API 3: total three Scenarios

app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body

  const getSpecificUserFoundOrNotInDb = `SELECT * FROM user WHERE username='${username}';`

  const usersRegisteredInDb = await db.get(getSpecificUserFoundOrNotInDb)

  const compareGivenPswAndHsdPsw = await bcrypt.compare(
    request.body.oldPassword,
    usersRegisteredInDb.password,
  )

  if (compareGivenPswAndHsdPsw === true) {
    if (newPassword.length > 5) {
      const hashNewPassword = await bcrypt.hash(newPassword, 10)
      const getUpdatePswInDb = `UPDATE user SET password='${hashNewPassword}'WHERE username='${username}';`
      await db.run(getUpdatePswInDb)
      response.status(200)
      response.send('Password updated')
    } else if (newPassword.length < 5) {
      response.status(400)
      response.send('Password is too short')
    }
  } else {
    response.status(400)
    response.send('Invalid current password')
  }
})
