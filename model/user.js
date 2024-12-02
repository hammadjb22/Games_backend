const mongoose = require('mongoose');
const { Schema } = mongoose;

// Custom validators
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePassword = (password) => {
  if (!password) return "*Password required";
  if (password.length < 8) return "*Short password";
  if (!/[A-Z]/.test(password)) return "*Uppercase letter missing";
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return "*Special character missing";
  return true;
};

// Define schema
const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      unique: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: validateEmail,
        message: 'Please enter a valid email address',
      },
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      validate: {
        validator: validatePassword,
        message: (props) => props.reason || 'Password validation failed',
      },
    },
    confirmPassword: {
      type: String,
      required: [true, 'Confirm password is required'],
      validate: {
        validator: function (value) {
          return value === this.password;
        },
        message: 'Passwords must match',
      },
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isLoggedIn: {
      type: Boolean,
      default: false, // Initially, the user is not logged in
    },
    token: String,
    otp: {
      type: String,
      default: null,
    },
    otpExpiry: {
      type: Date,
      default: null,
    },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
    country: {
      type: String,
      required: [false, 'Country is required'],
    },
    language: {
      type: String,
      default: 'English',
    },
    uniqueId: {
      type: String,
      unique: true,
      required: [false, 'Unique ID is required'],
    },
    coins: {
      type: Number,
      default: 0,
      min: [0, 'Coins cannot be negative'],
    },
    gamesWon: {
      type: Number,
      default: 0,
      min: [0, 'Games won cannot be negative'],
    },
    totalWinningCoins: {
      type: Number,
      default: 0,
      min: [0, 'Total winning coins cannot be negative'],
    },
    tournamentsWon: {
      type: Number,
      default: 0,
      min: [0, 'Tournaments won cannot be negative'],
    },
    winningStreak: {
      type: Number,
      default: 0,
      min: [0, 'Winning streak cannot be negative'],
    },
    gameLevels: {
      type: Map,
      of: Number, // E.g., { chess: 5, ludo: 3 }
      default: {},
    },
    gamesStats: {
      backgammon: {
        type: Number,
        default: 0,
        min: [0, 'Games won cannot be negative'],
      },
      dominoes: {
        type: Number,
        default: 0,
        min: [0, 'Games won cannot be negative'],
      },
      ludo: {
        type: Number,
        default: 0,
        min: [0, 'Games won cannot be negative'],
      },
      chess: {
        type: Number,
        default: 0,
        min: [0, 'Games won cannot be negative'],
      },
    },
    friends: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User', // Reference to other users
      },
    ],
  },
  { timestamps: true }
);

// Pre-save middleware to handle password encryption (e.g., using bcrypt)
// userSchema.pre('save', async function (next) {
//   if (!this.isModified('password')) return next();
//   try {
//     const bcrypt = require('bcryptjs'); // Import bcrypt for hashing
//     const salt = await bcrypt.genSalt(10);
//     this.password = await bcrypt.hash(this.password, salt);
//     this.confirmPassword = undefined; // Exclude confirmPassword from DB
//     next();
//   } catch (error) {
//     next(error);
//   }
// });

module.exports.User = mongoose.model('User', userSchema);
