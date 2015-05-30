let passport = require('passport')
let nodeifyit = require('nodeifyit')
let User = require('../../models/user')
//let util = require('util')
let LocalStrategy = require('passport-local').Strategy

require('songbird')

function configure() {
  // Required for session support / persistent login sessions
  passport.serializeUser(nodeifyit(async (user) => user.id))
  passport.deserializeUser(nodeifyit(async (id) => {
      return await User.promise.findById(id)
  }))

  passport.use(new LocalStrategy({
      usernameField: 'email',
      failureFlash: true
  }, nodeifyit(async (email, password) => {
      let regExp = new RegExp(email, "i")
      let regExQuery = {email: {$regex: regExp}}
      let user = await User.promise.findOne(regExQuery)
      console.log("user" + user)
      if(!user) {
          return [false, {message: 'Invalid username or password'}]
      }
      if(!await user.validatePassword(password)) {
          return [false, {message: 'Invalid password'}]
      }
      return user
  }, {spread: true})))

  passport.use('local-signup', new LocalStrategy({
      usernameField: 'email',
      passReqToCallback: true
  }, nodeifyit(async (req, email, password) => {
      let emailRegExp = new RegExp(email, "i")
      let emailRegExQuery = {email: {$regex: emailRegExp}}
      if(!email.indexOf('@')){
          return [false, {message: 'The email is invalid'}]
      }
      if(await User.promise.findOne(emailRegExQuery)){
        return [false, {message: 'The email is already taken'}]
      }
      let user = new User()
      user.email = email
      user.password = password
      try {
          return await user.save()
      } catch (e) {
          console.log('Validation error', e)
          return [false, {message: e.message}]
      }
  }, {spread: true})))
}

module.exports = {passport, configure}
