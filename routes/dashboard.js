var express = require('express')
var router = express.Router()
var db = require('../models')
var passport = require('../config/passport.js')
var isAuthenticated = require('./utils/isAuthenticated.js')
var csrf = require('csurf')
var csrfProtection = csrf()

/**
 * Discover API path '/api/teacher'
 *   - To access teacher's UUID: `req.uuid`
 *     (uuid added to `req` object by `isAuthenticated` middleware)
 */

router.route('/login')
  .post(csrfProtection, passport.authenticate('local'), (req, res, next) => {
    res.json({
      isAuthenticated: true,
      redirectPath: '/teacher/dashboard'
    })
  })

router.route('/signup')
  .post(csrfProtection, (req, res, next) => {
    db.User.create({ email: req.body.email, password: req.body.password })
      .then(() => res.redirect(307, '/api/teacher/login'))
      .catch((err) => res.status(422).json(err.errors[0].message))
  })

/*************************************************************
 * All below routes require `isAuthenticated` middleware!!!! *
 *************************************************************/

router.route('/logout')
  .post(isAuthenticated, (req, res, next) => {
    // passport
    req.logout()
    // express-session/redis
    req.session.destroy(err => console.error(err))
    // client side
    res
      .clearCookie('sessionId', {
        httpOnly: true,
        sameSite: true,
        secure: false
      })
      .send({ redirectPath: '/' })
  })

// Teacher can DELETE a class
router.route('/class/:uuid')
  .delete(/* isAuthenticated, */ (req, res, next) => {
    db.Class.destroy({ where: { uuid: req.params.uuid } })
      .then(() => res.status(204).send())
      .catch(err => console.error(err))
  })

// Teacher can ADD a new class
router.route('/class/add')
  .post(isAuthenticated, (req, res, next) => {
    db.Class.create({ name: req.body.name, user_uuid: req.uuid })
      .then(() => res.status(201).send())
      .catch(err => console.error(err))
  })

// For when a teacher adds students to the class (student name, )
router.route('/:uuid_teacher/class/:uuid_/edit')
  // GET list of all students in a class
  .get((req, res, next) => {
    db.Class.findAll({ include: [db.User, db.Student] })
      .then(dbClass => res.json(dbClass))
      .catch(err => console.error(err))
  })
  // POST requests for this path
  .post((req, res, next) => {
    db.Class.create(req.body).then(function (dbClass) {
      res.json(dbClass)
    })
  })
  // PUT requests for this path
  .put((req, res, next) => {
    db.Class.update(
      req.body, {
        where: {
          id: req.body.id
        }
      }).then(function (dbClass) {
      res.json(dbClass)
    })
  })

router.route('/api/classes/:id')
  // GET requests for this path
  .get((req, res, next) => {
    db.Class.findOne({
      where: {
        id: req.params.id
      },
      include: [db.Student]
    }).then(function (dbClass) {
      res.json(dbClass)
    })
  })

router.route('/api/student/dashboard')
  // GET requests for this path
  .get((req, res, next) => {
    res.render('index', { title: 'Express' })
  })

module.exports = router
