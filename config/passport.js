const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const GitHubStrategy = require('passport-github').Strategy;
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../database');

module.exports = (passport) => {

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user exists
    db.get('SELECT * FROM users WHERE google_id = ?', [profile.id], (err, user) => {
      if (err) return done(err);
      if (user) {
        return done(null, user);
      } else {
        // Create new user
        db.run('INSERT INTO users (google_id, email, name) VALUES (?, ?, ?)',
          [profile.id, profile.emails[0].value, profile.displayName], function(err) {
          if (err) return done(err);
          db.get('SELECT * FROM users WHERE id = ?', [this.lastID], (err, newUser) => {
            return done(null, newUser);
          });
        });
      }
    });
  } catch (error) {
    done(error);
  }
}));

passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  callbackURL: '/auth/facebook/callback',
  profileFields: ['id', 'emails', 'name']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    db.get('SELECT * FROM users WHERE facebook_id = ?', [profile.id], (err, user) => {
      if (err) return done(err);
      if (user) {
        return done(null, user);
      } else {
        db.run('INSERT INTO users (facebook_id, email, name) VALUES (?, ?, ?)',
          [profile.id, profile.emails[0].value, profile.displayName], function(err) {
          if (err) return done(err);
          db.get('SELECT * FROM users WHERE id = ?', [this.lastID], (err, newUser) => {
            return done(null, newUser);
          });
        });
      }
    });
  } catch (error) {
    done(error);
  }
}));

passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: '/auth/github/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    db.get('SELECT * FROM users WHERE github_id = ?', [profile.id], (err, user) => {
      if (err) return done(err);
      if (user) {
        return done(null, user);
      } else {
        db.run('INSERT INTO users (github_id, email, name) VALUES (?, ?, ?)',
          [profile.id, profile.emails[0].value, profile.displayName], function(err) {
          if (err) return done(err);
          db.get('SELECT * FROM users WHERE id = ?', [this.lastID], (err, newUser) => {
            return done(null, newUser);
          });
        });
      }
    });
  } catch (error) {
    done(error);
  }
}));

passport.use(new LocalStrategy({
  usernameField: 'email'
}, async (email, password, done) => {
  try {
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
      if (err) return done(err);
      if (!user) return done(null, false, { message: 'Incorrect email.' });
      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) return done(err);
        if (isMatch) {
          return done(null, user);
        } else {
          return done(null, false, { message: 'Incorrect password.' });
        }
      });
    });
  } catch (error) {
    done(error);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  db.get('SELECT * FROM users WHERE id = ?', [id], (err, user) => {
    done(err, user);
  });
});
};